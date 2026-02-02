const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Inicializando banco de dados...');

  // Criar áreas
  console.log('📍 Criando áreas...');
  const areas = await prisma.$transaction([
    prisma.area.upsert({
      where: { name: 'Área 1' },
      update: {},
      create: { name: 'Área 1' }
    }),
    prisma.area.upsert({
      where: { name: 'Área 2' },
      update: {},
      create: { name: 'Área 2' }
    }),
    prisma.area.upsert({
      where: { name: 'Área 3' },
      update: {},
      create: { name: 'Área 3' }
    })
  ]);

  const [area1] = areas;

  // Criar congregação sede
  console.log('⛪ Criando congregação SEDE...');
  const sede = await prisma.congregation.upsert({
    where: { code: 'SEDE-001' },
    update: { name: 'SEDE', areaId: area1.id, isHeadquarters: true },
    create: {
      name: 'SEDE',
      code: 'SEDE-001',
      isHeadquarters: true,
      areaId: area1.id
    }
  });

  // Criar usuário administrador provisório
  console.log('👤 Criando usuário administrador provisório...');
  const adminWhatsapp = process.env.ADMIN_WHATSAPP || '5500000000000';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { whatsapp: adminWhatsapp },
    update: { 
      congregationId: sede.id, 
      role: 'ADMIN', 
      active: true,
      password: hashedPassword
    },
    create: {
      name: 'Admin Provisório',
      whatsapp: adminWhatsapp,
      congregationId: sede.id,
      role: 'ADMIN',
      active: true,
      password: hashedPassword
    }
  });

  // Criar revistas padrão
  console.log('📚 Criando revistas padrão...');
  const magazines = [
    { code: 'ADU-01', name: 'Lições Bíblicas Adultos', className: 'Lições Bíblicas Adultos', ageRange: '18+', unitPrice: 8.50 },
    { code: 'JOV-01', name: 'Lições Bíblicas Jovens', className: 'Lições Bíblicas Jovens', ageRange: '14-17', unitPrice: 7.50 },
    { code: 'JUV-01', name: 'Lições Bíblicas Juvenis', className: 'Lições Bíblicas Juvenis', ageRange: '8-13', unitPrice: 6.50 },
    { code: 'CRI-01', name: 'Lições Bíblicas Crianças', className: 'Lições Bíblicas Crianças', ageRange: '6-7', unitPrice: 5.50 },
    { code: 'INF-01', name: 'Lições Bíblicas Infantis', className: 'Lições Bíblicas Infantis', ageRange: '3-5', unitPrice: 5.00 }
  ];

  for (const mag of magazines) {
    await prisma.magazine.upsert({
      where: { code: mag.code },
      update: { ...mag },
      create: { ...mag }
    });
  }

  console.log('\n✅ Inicialização concluída!');
  console.log('\n📋 Credenciais do administrador:');
  console.log(`   WhatsApp: ${adminWhatsapp}`);
  console.log(`   Senha: ${adminPassword}`);
  console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Erro na inicialização:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
