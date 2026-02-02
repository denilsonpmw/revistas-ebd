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
    // Verificar se a senha está vazia, é muito curta ou não é um hash bcrypt válido
    const needsUpdate = !user.password || 
                       user.password.length < 10 || 
                       !user.password.startsWith('$2');
    
    if (needsUpdate) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      console.log(`✅ Senha atualizada para: ${user.name} (${user.whatsapp})`);
      updated++;
    }
  }

  console.log(`\n📊 ${updated} senhas atualizadas de ${allUsers.length} usuários`);

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
