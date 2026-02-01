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

  // Busca orders do período com items
  const orders = await prisma.order.findMany({
    where: { periodId },
    include: {
      congregation: { include: { area: true } },
      items: { include: { magazine: true } }
    }
  });

  // Agrupa por congregação e revista
  const groupedMap = new Map();
  
  for (const order of orders) {
    for (const item of order.items) {
      const key = `${order.congregationId}-${item.magazineId}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          congregationId: order.congregationId,
          congregationName: order.congregation.name,
          area: order.congregation.area?.name || null,
          magazineCode: item.magazine.code,
          magazineName: item.magazine.name,
          className: item.magazine.className,
          ageRange: item.magazine.ageRange,
          period: period.name,
          status: order.status,
          quantity: 0,
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
