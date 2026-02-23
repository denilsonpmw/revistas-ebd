module.exports = {
  datasources: {
    db: {
      provider: 'sqlite',
      url: process.env.DATABASE_URL,
    },
  },
};
