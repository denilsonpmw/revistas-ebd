const bcrypt = require('bcryptjs');
const { prisma } = require('./src/db');

async function generatePasswords() {
  try {
    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      select: { id: true, whatsapp: true, name: true }
    });

    console.log(`\n📋 Encontrados ${users.length} usuário(s)\n`);

    // Gerar senhas e hashes
    for (const user of users) {
      // Gerar senha temporária (primeiros 6 caracteres do WhatsApp + 123)
      const tempPassword = user.whatsapp.slice(-6) + '123';
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      console.log(`\n👤 Usuário: ${user.name}`);
      console.log(`📱 WhatsApp: ${user.whatsapp}`);
      console.log(`🔐 Senha temporária: ${tempPassword}`);
      console.log(`🔒 Hash: ${hashedPassword}`);

      // Atualizar no banco
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      console.log(`✅ Senha atualizada no banco`);
    }

    console.log(`\n✨ Processo concluído!\n`);
    console.log(`📝 Envie as senhas temporárias para os usuários via WhatsApp`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

generatePasswords();
