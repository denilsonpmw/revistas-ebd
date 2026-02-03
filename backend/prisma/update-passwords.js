const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Atualizando senhas de usuários...');

  // Senha padrão para todos os usuários que não têm senha
  const defaultPassword = process.env.DEFAULT_PASSWORD || 'senha123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Buscar todos os usuários
  const allUsers = await prisma.user.findMany();
  
  console.log(`📋 Total de usuários: ${allUsers.length}`);

  let updated = 0;
  for (const user of allUsers) {
    // Sempre atualizar para garantir que o hash seja válido para 'senha123'
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    console.log(`✅ Senha (re)criada para: ${user.name} (${user.whatsapp})`);
    updated++;
  }

  console.log(`\n📊 ${updated} senhas (re)criadas`);

  console.log(`\n✨ Concluído! Senha padrão definida: ${defaultPassword}`);
  console.log('⚠️  Oriente os usuários a alterarem suas senhas após o primeiro acesso.');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao atualizar senhas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
