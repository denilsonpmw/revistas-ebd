const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
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

  const [area1, area2, area3] = areas;

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

  const area1Congregations = [
    'Cong. Monte das Oliveiras',
    'Cong. Nova Canaã',
    'Cong. Rocha Eterna',
    'Cong. Estrela da Manha',
    'Cong. Rosa de Saron',
    'Cong. Nova Beréia',
    'Cong. Monte Sião',
    'Cong. Emanuel',
    'Cong. Nova Vida'
  ];

  const area2Congregations = [
    'Cong. Filadélfia',
    'Cong. Monte Horebe',
    'Cong. Monte Sinai',
    'Cong. Naiote',
    'Cong. Lírio dos Vales',
    'Sub-Sede',
    'Cong. Mensageiros de Sião',
    'Cong. Betsaida',
    'Cong. Berseba',
    'Cong. Quemuel'
  ];

  const area3Congregations = [
    'Cong. Betânia',
    'Cong. Monte Moriá',
    'Cong. Monte Carmelo',
    'Cong. Deus Proverá',
    'Cong. Arca da Aliança',
    'Cong. Monte Geresim',
    'Cong. Galileia',
    'Cong. Rocha Viva',
    'Cong. Atalaia',
    'Cong. Shalon'
  ];

  const toData = (items, areaId, prefix) =>
    items.map((name, idx) => ({
      name,
      code: `${prefix}-${String(idx + 1).padStart(2, '0')}`,
      areaId
    }));

  const congregations = [
    ...toData(area1Congregations, area1.id, 'A1'),
    ...toData(area2Congregations, area2.id, 'A2'),
    ...toData(area3Congregations, area3.id, 'A3')
  ];

  for (const data of congregations) {
    await prisma.congregation.upsert({
      where: { code: data.code },
      update: { name: data.name, areaId: data.areaId },
      create: data
    });
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminHashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { whatsapp: '5500000000000' },
    update: { congregationId: sede.id, role: 'ADMIN', active: true },
    create: {
      name: 'Admin Sede',
      whatsapp: '5500000000000',
      congregationId: sede.id,
      role: 'ADMIN',
      active: true,
      password: adminHashedPassword
    }
  });


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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    await prisma.$disconnect();
    process.exit(1);
  });
