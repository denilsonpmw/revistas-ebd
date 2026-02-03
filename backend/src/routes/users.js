const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const { prisma } = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Rotas ADMIN apenas
router.use(requireRole(['ADMIN']));

// GET listar todos os usuários
router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      congregation: { include: { area: true } }
    },
    orderBy: [{ active: 'asc' }, { createdAt: 'desc' }]
  });
  return res.json({ users });
});

// GET listar usuários pendentes (não ativos)
router.get('/pending', async (req, res) => {
  const users = await prisma.user.findMany({
    where: { active: false },
    include: {
      congregation: { include: { area: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  return res.json({ users });
});

// POST criar novo usuário (admin cria diretamente)
router.post('/', async (req, res) => {
  const schema = z.object({
    name: z.string().min(3),
    whatsapp: z.string().min(10),
    congregationId: z.string(),
    role: z.enum(['USER', 'MANAGER', 'ADMIN']).default('USER'),
    active: z.boolean().default(true)
  });

  try {
    const data = schema.parse(req.body);
    
    // Normaliza WhatsApp
    const normalizedWhatsapp = data.whatsapp.replace(/[\s\-\(\)]/g, '');
    
    // Verifica se já existe
    const existing = await prisma.user.findUnique({
      where: { whatsapp: normalizedWhatsapp }
    });
    
    if (existing) {
      return res.status(400).json({ message: 'WhatsApp já cadastrado' });
    }
    
    const user = await prisma.user.create({
      data: {
        name: data.name,
        whatsapp: normalizedWhatsapp,
        congregationId: data.congregationId,
        role: data.role,
        active: data.active
      },
      include: { congregation: true }
    });
    
    return res.status(201).json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    return res.status(500).json({ message: error.message });
  }
});

// PATCH atualizar usuário (role, congregação, ativar/desativar)
router.patch('/:id', async (req, res) => {
  const schema = z.object({
    name: z.string().min(3).optional(),
    whatsapp: z.string().min(10).optional(),
    congregationId: z.string().optional(),
    role: z.enum(['USER', 'MANAGER', 'ADMIN']).optional(),
    active: z.boolean().optional()
  });

  try {
    let data = schema.parse(req.body);
    const { id } = req.params;

    // Se for atualizar whatsapp, normaliza e verifica duplicidade
    if (data.whatsapp) {
      const normalizedWhatsapp = data.whatsapp.replace(/[\s\-\(\)]/g, '');
      // Verifica se já existe outro usuário com esse whatsapp
      const existing = await prisma.user.findUnique({
        where: { whatsapp: normalizedWhatsapp }
      });
      const userToUpdate = await prisma.user.findUnique({ where: { id } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ message: 'WhatsApp já cadastrado' });
      }
      data.whatsapp = normalizedWhatsapp;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: { congregation: true }
    });

    return res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    return res.status(500).json({ message: error.message });
  }
});

// DELETE deletar usuário
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await prisma.user.delete({ where: { id } });
    return res.json({ message: 'Usuário removido' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PATCH resetar senha de um usuário (admin only)
router.patch('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Gerar nova senha aleatória (12 caracteres)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let tempPassword = '';
    for (let i = 0; i < 12; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Atualizar senha no banco
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    return res.json({ 
      message: 'Senha resetada com sucesso',
      tempPassword, // Retornar para o admin copiar e enviar
      whatsapp: user.whatsapp
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
