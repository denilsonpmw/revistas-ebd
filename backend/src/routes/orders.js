const express = require('express');
const { z } = require('zod');
const { prisma } = require('../db');
const { requireRole } = require('../middleware/auth');
const { Prisma } = require('@prisma/client');

const router = express.Router();

// Schema para criar pedido com múltiplas linhas
const createSchema = z.object({
  periodId: z.string().min(1),
  items: z.array(
    z.object({
      magazineId: z.string().min(1),
      combinationId: z.string().min(1),
      quantity: z.number().int().min(1)
    })
  ).min(1, 'Pelo menos um item é obrigatório'),
  observations: z.string().optional()
});

router.post('/', requireRole(['USER', 'MANAGER', 'ADMIN']), async (req, res) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parse.error.errors });
  }

  const { periodId, items, observations } = parse.data;

  // Validar período
  const period = await prisma.period.findUnique({ where: { id: periodId } });
  if (!period || !period.active) {
    return res.status(404).json({ message: 'Período não encontrado' });
  }

  // Validar e calcular itens
  const processedItems = [];
  let totalOrderValue = 0;

  for (const item of items) {
    const magazine = await prisma.magazine.findUnique({ where: { id: item.magazineId } });
    if (!magazine || !magazine.active) {
      return res.status(404).json({ message: `Revista ${item.magazineId} não encontrada` });
    }

    const combination = await prisma.magazineVariantCombination.findUnique({ where: { id: item.combinationId } });
    if (!combination || combination.magazineId !== magazine.id || !combination.active) {
      return res.status(404).json({ message: 'Combinação de variação não encontrada' });
    }

    const unitPrice = new Prisma.Decimal(combination.price);
    const itemTotal = Number((item.quantity * Number(unitPrice)).toFixed(2));
    totalOrderValue += itemTotal;

    processedItems.push({
      magazineId: item.magazineId,
      combinationId: combination.id,
      quantity: item.quantity,
      unitPrice,
      totalValue: new Prisma.Decimal(itemTotal),
      variantData: {
        combinationId: combination.id,
        combinationName: combination.name
      }
    });
  }

  // Criar pedido com itens
  const order = await prisma.order.create({
    data: {
      congregationId: req.user.congregationId,
      submittedById: req.user.id,
      periodId,
      observations,
      items: {
        create: processedItems
      }
    },
    include: {
      congregation: true,
      submittedBy: true,
      period: true,
      items: {
        include: { magazine: true }
      }
    }
  });

  return res.status(201).json({ order });
});

router.get('/', async (req, res) => {
  const { periodId } = req.query;

  const where = {};
  if (periodId) {
    where.periodId = String(periodId);
  }

  if (req.user.role !== 'ADMIN') {
    where.congregationId = req.user.congregationId;
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      congregation: true,
      submittedBy: true,
      period: true,
      items: {
        include: { 
          magazine: true,
          variantCombination: true
        }
      }
    }
  });

  // Serializar Decimal para número
  const serializedOrders = orders.map(order => ({
    ...order,
    items: order.items.map(item => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalValue: Number(item.totalValue),
      magazine: {
        ...item.magazine,
        unitPrice: Number(item.magazine.unitPrice)
      }
    }))
  }));

  return res.json({ orders: serializedOrders });
});

// GET detalhe de um pedido específico
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      congregation: true,
      submittedBy: true,
      period: true,
      items: {
        include: { 
          magazine: true,
          variantCombination: true
        }
      },
      approvedBy: true
    }
  });

  if (!order) {
    return res.status(404).json({ message: 'Pedido não encontrado' });
  }

  // Verificar permissão: apenas admin ou dono da congregação
  if (req.user.role !== 'ADMIN' && req.user.congregationId !== order.congregationId) {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  // Serializar Decimal para número
  const serializedOrder = {
    ...order,
    items: order.items.map(item => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalValue: Number(item.totalValue),
      magazine: {
        ...item.magazine,
        unitPrice: Number(item.magazine.unitPrice)
      }
    }))
  };

  return res.json({ order: serializedOrder });
});

router.patch('/:id/status', requireRole(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  const status = String(req.body.status || '');
  const allowed = ['PENDING', 'APPROVED', 'DELIVERED', 'CANCELED'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Status inválido' });
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      status,
      approvedById: status === 'APPROVED' ? req.user.id : undefined,
      approvedAt: status === 'APPROVED' ? new Date() : undefined,
      deliveredAt: status === 'DELIVERED' ? new Date() : undefined
    },
    include: {
      congregation: true,
      period: true,
      items: { include: { magazine: true } },
      submittedBy: true,
      approvedBy: true
    }
  });

  return res.json({ order });
});

// PATCH para editar pedido (apenas se status = PENDING)
const updateSchema = z.object({
  items: z.array(
    z.object({
      magazineId: z.string().min(1),
      combinationId: z.string().min(1),
      quantity: z.number().int().min(1)
    })
  ).min(1, 'Pelo menos um item é obrigatório'),
  observations: z.string().optional()
});

router.patch('/:id', requireRole(['USER', 'MANAGER', 'ADMIN']), async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!order) {
    return res.status(404).json({ message: 'Pedido não encontrado' });
  }

  // Verificar se está pendente
  if (order.status !== 'PENDING') {
    return res.status(400).json({ message: 'Apenas pedidos pendentes podem ser editados' });
  }

  // Verificar permissão: apenas quem criou ou admin
  if (req.user.role !== 'ADMIN' && req.user.id !== order.submittedById) {
    return res.status(403).json({ message: 'Você não tem permissão para editar este pedido' });
  }

  const parse = updateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parse.error.errors });
  }

  const { items, observations } = parse.data;

  // Validar e calcular itens
  const processedItems = [];
  for (const item of items) {
    const magazine = await prisma.magazine.findUnique({ where: { id: item.magazineId } });
    if (!magazine || !magazine.active) {
      return res.status(404).json({ message: `Revista ${item.magazineId} não encontrada` });
    }

    const combination = await prisma.magazineVariantCombination.findUnique({ where: { id: item.combinationId } });
    if (!combination || combination.magazineId !== magazine.id || !combination.active) {
      return res.status(404).json({ message: 'Combinação de variação não encontrada' });
    }

    const unitPrice = new Prisma.Decimal(combination.price);
    const itemTotal = Number((item.quantity * Number(unitPrice)).toFixed(2));
    processedItems.push({
      magazineId: item.magazineId,
      quantity: item.quantity,
      unitPrice,
      totalValue: new Prisma.Decimal(itemTotal),
      variantData: {
        combinationId: combination.id,
        combinationName: combination.name
      }
    });
  }

  // Deletar itens antigos e criar novos
  await prisma.orderItem.deleteMany({ where: { orderId: id } });

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      observations,
      items: {
        create: processedItems
      }
    },
    include: {
      congregation: true,
      submittedBy: true,
      period: true,
      items: {
        include: { magazine: true }
      }
    }
  });

  return res.json({ order: updatedOrder });
});

// DELETE para deletar pedido (apenas se status = PENDING)
router.delete('/:id', requireRole(['USER', 'MANAGER', 'ADMIN']), async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({ where: { id } });

  if (!order) {
    return res.status(404).json({ message: 'Pedido não encontrado' });
  }

  // Verificar se está pendente
  if (order.status !== 'PENDING') {
    return res.status(400).json({ message: 'Apenas pedidos pendentes podem ser deletados' });
  }

  // Verificar permissão: apenas quem criou ou admin
  if (req.user.role !== 'ADMIN' && req.user.id !== order.submittedById) {
    return res.status(403).json({ message: 'Você não tem permissão para deletar este pedido' });
  }

  await prisma.order.delete({ where: { id } });

  return res.json({ message: 'Pedido deletado com sucesso' });
});

module.exports = router;
