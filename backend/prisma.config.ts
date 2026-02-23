import { defineConfig } from '@prisma/cli';

export default defineConfig({
  datasources: {
    db: {
      provider: 'sqlite',
      url: process.env.DATABASE_URL,
    },
  },
});
