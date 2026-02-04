const express = require('express');
const { z } = require('zod');
const { prisma } = require('../db');

// Helper para normalizar datas vindas do frontend
// Quando o frontend envia "2024-01-15", precisamos garantir que seja
// armazenado como meio-dia UTC para evitar problemas de timezone
const normalizeDate = (dateString) => {
  if (!dateString) return undefined;
  // Se já é uma data ISO completa, usa diretamente
  if (dateString.includes('T')) {
    return new Date(dateString);
  }
  // Se é apenas YYYY-MM-DD, adiciona 12:00:00 UTC
  return new Date(dateString + 'T12:00:00.000Z');
};

const router = express.Router();

// Zod validation schemas
const createPeriodSchema = z.object({
  code: z.string().min(1, 'Código obrigatório'),
  name: z.string().min(1, 'Nome obrigatório'),
  startDate: z.string().min(1, 'Data de início inválida'),
  endDate: z.string().min(1, 'Data de fim inválida')
});

const updatePeriodSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  active: z.boolean().optional()
});

// GET all active periods
router.get('/', async (req, res) => {
  try {
    const periods = await prisma.period.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ periods });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all periods (admin - includes inactive)
router.get('/admin/all', async (req, res) => {
  try {
    // Verify user is ADMIN
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    const periods = await prisma.period.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ periods });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create period (admin only)
router.post('/', async (req, res) => {
  try {
    // Verify user is ADMIN
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    const data = createPeriodSchema.parse(req.body);

    const period = await prisma.period.create({
      data: {
        code: data.code,
        name: data.name,
        startDate: normalizeDate(data.startDate),
        endDate: normalizeDate(data.endDate)
      }
    });

    res.status(201).json(period);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PATCH update period (admin only)
router.patch('/:id', async (req, res) => {
  try {
    // Verify user is ADMIN
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    const data = updatePeriodSchema.parse(req.body);

    const updateData = {};
    if (data.code) updateData.code = data.code;
    if (data.name) updateData.name = data.name;
    if (data.startDate) updateData.startDate = normalizeDate(data.startDate);
    if (data.endDate) updateData.endDate = normalizeDate(data.endDate);
    if (typeof data.active === 'boolean') updateData.active = data.active;

    const period = await prisma.period.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(period);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// DELETE soft delete period (admin only)
router.delete('/:id', async (req, res) => {
  try {
    // Verify user is ADMIN
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    const period = await prisma.period.update({
      where: { id: req.params.id },
      data: { active: false }
    });

    res.json({ message: 'Período desativado', period });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
