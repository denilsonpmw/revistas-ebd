const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signJwt, verifyJwt };
