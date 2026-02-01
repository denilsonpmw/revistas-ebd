const express = require('express');
const { z } = require('zod');
const { prisma } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { signJwt } = require('../utils/token');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const requestSchema = z.object({
  whatsapp: z.string().min(8)
});

router.post('/request-link', async (req, res) => {
  const parse = requestSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'WhatsApp inválido' });
  }

  // Normalizar WhatsApp: remover espaços, hífens, parênteses
  let { whatsapp } = parse.data;
  whatsapp = whatsapp.replace(/[\s\-\(\)]/g, '');

  const user = await prisma.user.findUnique({ where: { whatsapp } });
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  if (!user.active) {
    return res.status(403).json({ message: 'Cadastro pendente de aprovação' });
  }

  const token = uuidv4();
  const minutes = Number(process.env.TOKEN_EXP_MINUTES || 15);
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  await prisma.authToken.create({
    data: {
      whatsapp,
      token,
      expiresAt,
      ip: req.ip,
      userId: user.id
    }
  });

  const base = process.env.WA_LINK_BASE || '';
  const waLink = `${base}${encodeURIComponent(token)}`;
  const front = process.env.FRONTEND_URL || '';
  const verifyUrl = front ? `${front.replace(/\/$/, '')}/verificar?token=${encodeURIComponent(token)}` : null;

  return res.json({ waLink, verifyUrl, expiresAt });
});

router.get('/verify', async (req, res) => {
  const token = String(req.query.token || '').trim();
  if (!token) {
    return res.status(400).json({ message: 'Token inválido' });
  }

  const authToken = await prisma.authToken.findUnique({ where: { token } });
  if (!authToken) {
    return res.status(404).json({ message: 'Token não encontrado' });
  }
  if (authToken.used) {
    return res.status(400).json({ message: 'Token já utilizado' });
  }
  if (authToken.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Token expirado' });
  }

  const user = await prisma.user.findUnique({
    where: { whatsapp: authToken.whatsapp },
    include: { congregation: true }
  });
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  if (!user.active) {
    return res.status(403).json({ message: 'Cadastro pendente de aprovação' });
  }

  await prisma.authToken.update({
    where: { token },
    data: { used: true }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  const jwtToken = signJwt({
    sub: user.id,
    role: user.role
  });

  return res.json({ token: jwtToken, user });
});

router.get('/me', authRequired, async (req, res) => {
  return res.json({ user: req.user });
});

// POST registro público (auto-cadastro)
router.post('/register', async (req, res) => {
  const schema = z.object({
    name: z.string().min(3),
    whatsapp: z.string().min(10),
    congregationId: z.string()
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
    
    // Cria usuário com active=false (pendente de aprovação)
    const user = await prisma.user.create({
      data: {
        name: data.name,
        whatsapp: normalizedWhatsapp,
        congregationId: data.congregationId,
        role: 'USER',
        active: false
      },
      include: { congregation: true }
    });
    
    return res.status(201).json({ 
      message: 'Cadastro enviado! Aguarde aprovação do administrador.',
      user 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    return res.status(500).json({ message: error.message });
  }
});

// GET congregações públicas (para formulário de registro)
router.get('/congregations', async (req, res) => {
  const congregations = await prisma.congregation.findMany({
    include: { area: true },
    orderBy: { name: 'asc' }
  });
  return res.json(congregations);
});

module.exports = router;
