const bcrypt = require('bcryptjs');
const { prisma } = require('./src/db');

async function generatePasswords() {
  try {
    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      select: { id: true, whatsapp: true, name: true }
    });

    // Gerar senhas e hashes
    for (const user of users) {
      // Gerar senha temporária (primeiros 6 caracteres do WhatsApp + 123)
      const tempPassword = user.whatsapp.slice(-6) + '123';
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Atualizar no banco
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
    }
  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

generatePasswords();
