const { verifyJwt } = require('../utils/token');
const { prisma } = require('../db');

async function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token ausente' });
  }
  const token = header.replace('Bearer ', '').trim();
  try {
    const decoded = verifyJwt(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { congregation: true }
    });
    if (!user) {
      return res.status(401).json({ message: 'Usuário inválido' });
    }
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    return next();
  };
}

module.exports = { authRequired, requireRole };
