const express = require('express');
const { z } = require('zod');
const { prisma } = require('../db');
const { requireRole } = require('../middleware/auth');
const { Prisma } = require('@prisma/client');

const router = express.Router();

// GET é público (qualquer usuário autenticado pode ler)
// POST, PATCH, DELETE requer ADMIN

const createSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  className: z.string().min(1),
  ageRange: z.string().min(1),
  unitPrice: z.union([z.number().positive(), z.string().min(1)]).transform(val => {
    const num = typeof val === 'string' 
      ? parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.'))
      : val;
    if (isNaN(num) || num <= 0) {
      throw new Error('Preço deve ser um número positivo');
    }
    return num;
  })
});

const updateSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  className: z.string().min(1).optional(),
  ageRange: z.string().min(1).optional(),
  active: z.boolean().optional(),
  unitPrice: z.union([z.number().positive(), z.string().min(1)]).transform(val => {
    const num = typeof val === 'string' 
      ? parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.'))
      : val;
    if (isNaN(num) || num <= 0) {
      throw new Error('Preço deve ser um número positivo');
    }
    return num;
  }).optional()
});

router.post('/', requireRole(['ADMIN']), async (req, res) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parse.error.errors });
  }

  const { code, name, className, ageRange, unitPrice } = parse.data;

  try {
    const magazine = await prisma.magazine.create({
      data: {
        code,
        name,
        className,
        ageRange,
        unitPrice: new Prisma.Decimal(unitPrice.toString())
      }
    });
    return res.status(201).json({ magazine });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Código já existe' });
    }
    throw err;
  }
});

router.get('/', async (req, res) => {
  const activeOnly = req.query.active === 'true';
  const magazines = await prisma.magazine.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { name: 'asc' }
  });
  
  // Converter Decimal para número para evitar problemas no frontend
  const serializedMagazines = magazines.map(m => ({
    ...m,
    unitPrice: Number(m.unitPrice)
  }));
  
  // Debug: verificar primeiro item
  if (serializedMagazines.length > 0) {
    console.log('First magazine unitPrice:', serializedMagazines[0].unitPrice, typeof serializedMagazines[0].unitPrice);
  }
  
  return res.json({ magazines: serializedMagazines });
});

router.patch('/:id', requireRole(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  const parse = updateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Dados inválidos' });
  }

  const data = { ...parse.data };
  if (data.unitPrice !== undefined) {
    data.unitPrice = new Prisma.Decimal(data.unitPrice.toString());
  }

  const magazine = await prisma.magazine.update({
    where: { id },
    data
  });
  return res.json({ magazine });
});

router.delete('/:id', requireRole(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  await prisma.magazine.update({
    where: { id },
    data: { active: false }
  });
  return res.json({ message: 'Revista desativada' });
});

module.exports = router;
