const express = require('express');
const { prisma } = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireRole(['ADMIN']));

router.get('/areas', async (req, res) => {
  const areas = await prisma.area.findMany({
    include: { congregations: true },
    orderBy: { name: 'asc' }
  });
  return res.json({ areas });
});

router.get('/congregations', async (req, res) => {
  const congregations = await prisma.congregation.findMany({
    include: { area: true },
    orderBy: { name: 'asc' }
  });
  return res.json({ congregations });
});

router.post('/congregations', async (req, res) => {
  try {
    let { name, code, isHeadquarters, areaId, address, city, contactName } = req.body;
    
    // Sanitizar strings vazias para null
    name = name ? String(name).trim() : null;
    code = code ? String(code).trim() : null;
    areaId = areaId ? String(areaId).trim() : null;
    address = address ? String(address).trim() : null;
    city = city ? String(city).trim() : null;
    contactName = contactName ? String(contactName).trim() : null;
    
    if (!name || !code) {
      return res.status(400).json({ message: 'Nome e código são obrigatórios' });
    }

    const congregation = await prisma.congregation.create({
      data: {
        name,
        code,
        isHeadquarters: Boolean(isHeadquarters),
        areaId: areaId || null,
        address: address || null,
        city: city || null,
        contactName: contactName || null
      },
      include: { area: true }
    });

    return res.status(201).json({ congregation });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Código já existe' });
    }
    console.error('Erro ao criar congregação:', error.message);
    return res.status(500).json({ message: 'Erro ao criar congregação' });
  }
});

router.put('/congregations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { name, code, isHeadquarters, areaId, address, city, contactName } = req.body;
    
    // Sanitizar strings vazias para null
    name = name ? String(name).trim() : null;
    code = code ? String(code).trim() : null;
    areaId = areaId ? String(areaId).trim() : null;
    address = address ? String(address).trim() : null;
    city = city ? String(city).trim() : null;
    contactName = contactName ? String(contactName).trim() : null;
    
    if (!name || !code) {
      return res.status(400).json({ message: 'Nome e código são obrigatórios' });
    }

    // Verifica se a congregação existe
    const existing = await prisma.congregation.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Congregação não encontrada' });
    }

    // Se o código foi alterado, verifica se já existe outro com este código
    if (code !== existing.code) {
      const duplicateCode = await prisma.congregation.findUnique({ where: { code } });
      if (duplicateCode) {
        return res.status(400).json({ message: 'Código já existe' });
      }
    }

    const congregation = await prisma.congregation.update({
      where: { id },
      data: {
        name,
        code,
        isHeadquarters: Boolean(isHeadquarters),
        areaId: areaId || null,
        address: address || null,
        city: city || null,
        contactName: contactName || null
      },
      include: { area: true }
    });

    return res.json({ congregation });
  } catch (error) {
    console.error('Erro ao atualizar congregação:', error.message);
    return res.status(500).json({ message: 'Erro ao atualizar congregação' });
  }
});

router.delete('/congregations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica se há usuários ou pedidos associados
    const usersCount = await prisma.user.count({ where: { congregationId: id } });
    const ordersCount = await prisma.order.count({ where: { congregationId: id } });
    
    if (usersCount > 0 || ordersCount > 0) {
      return res.status(400).json({ 
        message: `Não é possível excluir. Há ${usersCount} usuário(s) e ${ordersCount} pedido(s) associados.` 
      });
    }

    await prisma.congregation.delete({ where: { id } });
    
    return res.json({ message: 'Congregação excluída com sucesso' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Congregação não encontrada' });
    }
    console.error('Erro ao excluir congregação:', error);
    return res.status(500).json({ message: 'Erro ao excluir congregação' });
  }
});

router.get('/report', async (req, res) => {
  const periodId = String(req.query.periodId || '').trim();
  if (!periodId) {
    return res.status(400).json({ message: 'Período obrigatório' });
  }

  const period = await prisma.period.findUnique({
    where: { id: periodId }
  });
  if (!period) {
    return res.status(404).json({ message: 'Período não encontrado' });
  }

  // Busca orders do período com items e combinações
  const orders = await prisma.order.findMany({
    where: { periodId },
    include: {
      congregation: { include: { area: true } },
      items: { 
        include: { 
          magazine: true,
          variantCombination: true
        } 
      }
    }
  });

  const fallbackCombinationIds = Array.from(
    new Set(
      orders.flatMap(order =>
        order.items
          .filter(item => !item.combinationId && item.variantData?.combinationId)
          .map(item => item.variantData.combinationId)
      )
    )
  );

  const fallbackCombinations = fallbackCombinationIds.length
    ? await prisma.magazineVariantCombination.findMany({
        where: { id: { in: fallbackCombinationIds } }
      })
    : [];

  const combinationById = new Map(
    fallbackCombinations.map(combination => [combination.id, combination])
  );

  // Agrupa por congregação, revista E variação
  const groupedMap = new Map();
  
  for (const order of orders) {
    for (const item of order.items) {
      // Chave única por congregação + revista + variação
      const fallbackCombination = item.variantData?.combinationId
        ? combinationById.get(item.variantData.combinationId)
        : null;
      const variantKey = item.combinationId
        || item.variantCombination?.id
        || fallbackCombination?.id
        || item.variantCombination?.code
        || item.variantData?.combinationId
        || item.variantData?.combinationCode
        || 'no-variant';
      const key = `${order.congregationId}-${item.magazineId}-${variantKey}`;

      const variantCode = item.variantCombination?.code
        || fallbackCombination?.code
        || item.variantData?.code
        || item.variantData?.combinationCode
        || '-';
      const variantName = item.variantCombination?.name
        || fallbackCombination?.name
        || item.variantData?.name
        || item.variantData?.combinationName
        || 'Sem variação';
      
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          congregationId: order.congregationId,
          congregationName: order.congregation.name,
          area: order.congregation.area?.name || null,
          magazineCode: item.magazine.code,
          magazineName: item.magazine.name,
          className: item.magazine.className,
          ageRange: item.magazine.ageRange,
          variantCode,
          variantName,
          period: period.name,
          status: order.status,
          quantity: 0,
          unitPrice: Number(item.unitPrice || 0),
          totalValue: 0
        });
      }
      const entry = groupedMap.get(key);
      entry.quantity += item.quantity;
      entry.totalValue += Number(item.totalValue);
    }
  }

  const rows = Array.from(groupedMap.values());

  return res.json({ period: period.name, periodCode: period.code, rows });
});

module.exports = router;
