require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const magazinesRoutes = require('./routes/magazines');
const periodsRoutes = require('./routes/periods');
const usersRoutes = require('./routes/users');
const { authRequired } = require('./middleware/auth');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));
app.use(express.json());
app.use(morgan('dev'));

const webDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/orders', authRequired, ordersRoutes);
app.use('/admin', authRequired, adminRoutes);
app.use('/magazines', authRequired, magazinesRoutes);
app.use('/periods', authRequired, periodsRoutes);
app.use('/users', authRequired, usersRoutes);

if (fs.existsSync(webDist)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: 'Erro interno' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on port ${port}`);
});
