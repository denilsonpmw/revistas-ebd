const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Listar combinações de uma revista
router.get('/:magazineId/combinations', async (req, res) => {
  try {
    const { magazineId } = req.params;

    const combinations = await prisma.magazineVariantCombination.findMany({
      where: { magazineId, active: true },
      orderBy: { name: 'asc' }
    });

    // Converter price para número
    const serialized = combinations.map(c => ({
      ...c,
      price: Number(c.price)
    }));

    res.json({ combinations: serialized });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar combinações' });
  }
});

// Criar combinação de variações
router.post('/:magazineId/combinations', async (req, res) => {
  try {
    const { magazineId } = req.params;
    const { name, code, variantData, price } = req.body;

    if (!name || !code || !variantData || typeof price !== 'number') {
      return res.status(400).json({ message: 'Nome, código, variantData e price são obrigatórios' });
    }

    // Validar formato do código (opcional, mas recomendado)
    if (!/^[A-Z0-9\-]+$/.test(code)) {
      return res.status(400).json({ message: 'Código deve conter apenas letras maiúsculas, números e hífens' });
    }

    const combination = await prisma.magazineVariantCombination.create({
      data: {
        magazineId,
        name,
        code: code.toUpperCase(),
        variantData,
        price
      }
    });

    res.status(201).json({
      ...combination,
      price: Number(combination.price)
    });
  } catch (error) {
    if (error.code === 'P2002') {
      // Violação de unique constraint
      return res.status(400).json({ message: 'Este código já existe para esta revista' });
    }
    res.status(500).json({ message: 'Erro ao criar combinação' });
  }
});

// Atualizar combinação
router.put('/combinations/:combinationId', async (req, res) => {
  try {
    const { combinationId } = req.params;
    const { name, code, price, active } = req.body;

    const combination = await prisma.magazineVariantCombination.update({
      where: { id: combinationId },
      data: {
        ...(name && { name }),
        ...(code && { code: code.toUpperCase() }),
        ...(typeof price === 'number' && { price }),
        ...(typeof active === 'boolean' && { active })
      }
    });

    res.json({
      ...combination,
      price: Number(combination.price)
    });
  } catch (error) {
    if (error.code === 'P2002') {
      // Violação de unique constraint
      return res.status(400).json({ message: 'Este código já existe para esta revista' });
    }
    res.status(500).json({ message: 'Erro ao atualizar combinação' });
  }
});

// Deletar combinação
router.delete('/combinations/:combinationId', async (req, res) => {
  try {
    const { combinationId } = req.params;

    await prisma.magazineVariantCombination.delete({
      where: { id: combinationId }
    });

    res.json({ message: 'Combinação deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar combinação' });
  }
});

// Listar todas as variações de uma revista
router.get('/:magazineId/variants', async (req, res) => {
  try {
    const { magazineId } = req.params;

    const variantTypes = await prisma.magazineVariantType.findMany({
      where: { magazineId },
      include: {
        options: {
          where: { active: true },
          orderBy: { position: 'asc' }
        }
      },
      orderBy: { position: 'asc' }
    });

    res.json({ variantTypes });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar variações' });
  }
});

// Criar tipo de variação para uma revista
router.post('/:magazineId/variants', async (req, res) => {
  try {
    const { magazineId } = req.params;
    const { name, required = true, options = [] } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Nome do tipo de variação é obrigatório' });
    }

    // Buscar a maior posição atual
    const maxPosition = await prisma.magazineVariantType.findFirst({
      where: { magazineId },
      orderBy: { position: 'desc' },
      select: { position: true }
    });

    const position = maxPosition ? maxPosition.position + 1 : 1;

    const variantType = await prisma.magazineVariantType.create({
      data: {
        magazineId,
        name,
        required,
        position,
        options: {
          create: options.map((opt, idx) => ({
            name: opt.name,
            position: idx + 1
          }))
        }
      },
      include: { options: true }
    });

    res.status(201).json(variantType);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar tipo de variação' });
  }
});

// Atualizar tipo de variação
router.put('/variants/:variantTypeId', async (req, res) => {
  try {
    const { variantTypeId } = req.params;
    const { name, required, position } = req.body;

    const variantType = await prisma.magazineVariantType.update({
      where: { id: variantTypeId },
      data: {
        ...(name && { name }),
        ...(typeof required === 'boolean' && { required }),
        ...(typeof position === 'number' && { position })
      },
      include: { options: true }
    });

    res.json(variantType);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar tipo de variação' });
  }
});

// Deletar tipo de variação
router.delete('/variants/:variantTypeId', async (req, res) => {
  try {
    const { variantTypeId } = req.params;

    await prisma.magazineVariantType.delete({
      where: { id: variantTypeId }
    });

    res.json({ message: 'Tipo de variação deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar tipo de variação' });
  }
});

// Adicionar opção a um tipo de variação
router.post('/variants/:variantTypeId/options', async (req, res) => {
  try {
    const { variantTypeId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Nome da opção é obrigatório' });
    }

    // Buscar a maior posição atual
    const maxPosition = await prisma.magazineVariantOption.findFirst({
      where: { variantTypeId },
      orderBy: { position: 'desc' },
      select: { position: true }
    });

    const position = maxPosition ? maxPosition.position + 1 : 1;

    const option = await prisma.magazineVariantOption.create({
      data: {
        variantTypeId,
        name,
        position
      }
    });

    res.status(201).json(option);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar opção' });
  }
});

// Atualizar opção
router.put('/variants/options/:optionId', async (req, res) => {
  try {
    const { optionId } = req.params;
    const { name, position, active } = req.body;

    const option = await prisma.magazineVariantOption.update({
      where: { id: optionId },
      data: {
        ...(name && { name }),
        ...(typeof position === 'number' && { position }),
        ...(typeof active === 'boolean' && { active })
      }
    });

    res.json(option);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar opção' });
  }
});

// Deletar opção
router.delete('/variants/options/:optionId', async (req, res) => {
  try {
    const { optionId } = req.params;

    await prisma.magazineVariantOption.delete({
      where: { id: optionId }
    });

    res.json({ message: 'Opção deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar opção' });
  }
});

module.exports = router;
