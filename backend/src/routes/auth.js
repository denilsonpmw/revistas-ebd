const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const { prisma } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { signJwt } = require('../utils/token');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const requestSchema = z.object({
  whatsapp: z.string().min(8),
  password: z.string().min(4)
});

router.post('/request-link', async (req, res) => {
  const parse = requestSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'WhatsApp e senha são obrigatórios' });
  }

  // Normalizar WhatsApp: remover espaços, hífens, parênteses
  let { whatsapp, password } = parse.data;
  const whatsappOriginal = whatsapp;
  whatsapp = whatsapp.replace(/[\s\-\(\)]/g, '');
  
  console.log(`[AUTH] Tentativa de login - WhatsApp original: ${whatsappOriginal}, normalizado: ${whatsapp}`);

  const user = await prisma.user.findUnique({ where: { whatsapp } });
  
  if (!user) {
    console.log(`[AUTH] Usuário não encontrado com WhatsApp: ${whatsapp}`);
    // Listar todos os WhatsApps do banco para debug
    const allUsers = await prisma.user.findMany({ select: { whatsapp: true, name: true } });
    console.log('[AUTH] WhatsApps cadastrados:', allUsers.map(u => u.whatsapp).join(', '));
    return res.status(404).json({ message: 'WhatsApp ou senha incorretos' });
  }
  
  console.log(`[AUTH] Usuário encontrado: ${user.name}`);
  
  if (!user.active) {
    console.log(`[AUTH] Usuário inativo: ${user.name}`);
    return res.status(403).json({ message: 'Cadastro pendente de aprovação' });
  }

  // Validar senha
  console.log(`[AUTH] Validando senha para ${user.name}`);
  console.log(`[AUTH] Senha fornecida tem ${password.length} caracteres`);
  console.log(`[AUTH] Hash no banco começa com: ${user.password?.substring(0, 10) || 'VAZIO'}`);
  
  const validPassword = await bcrypt.compare(password, user.password);
  console.log(`[AUTH] Validação de senha: ${validPassword ? 'OK' : 'FALHOU'}`);
  
  if (!validPassword) {
    console.log(`[AUTH] Tentando recriar hash com a senha padrão...`);
    const defaultPass = 'senha123';
    const hashedDefault = await bcrypt.hash(defaultPass, 10);
    console.log(`[AUTH] Hash padrão gerado: ${hashedDefault}`);
    console.log(`[AUTH] Comparando padrão com entrada: ${await bcrypt.compare(defaultPass, hashedDefault)}`);
    
    console.log(`[AUTH] Senha incorreta para ${user.name}`);
    return res.status(401).json({ message: 'WhatsApp ou senha incorretos' });
  }

  console.log(`[AUTH] Autenticação bem-sucedida para ${user.name}`);
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
    console.error('Token ausente na requisição /verify');
    return res.status(400).json({ message: 'Token inválido' });
  }

  try {
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
  } catch (error) {
    console.error('Erro em /verify:', error);
    return res.status(500).json({ message: 'Erro ao verificar token' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  return res.json({ user: req.user });
});

// POST alterar senha (usuário logado)
router.post('/change-password', authRequired, async (req, res) => {
  const schema = z.object({
    currentPassword: z.string().min(4),
    newPassword: z.string().min(4)
  });

  try {
    const data = schema.parse(req.body);
    
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Validar senha atual
    const validPassword = await bcrypt.compare(data.currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    return res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    return res.status(500).json({ message: error.message });
  }
});

// POST registro público (auto-cadastro)
router.post('/register', async (req, res) => {
  const schema = z.object({
    name: z.string().min(3),
    whatsapp: z.string().min(10),
    password: z.string().min(4),
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
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Cria usuário com active=false (pendente de aprovação)
    const user = await prisma.user.create({
      data: {
        name: data.name,
        whatsapp: normalizedWhatsapp,
        password: hashedPassword,
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
