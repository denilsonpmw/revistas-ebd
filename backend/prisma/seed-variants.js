const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('📚 Adicionando variações às revistas...');

  // Buscar revista de adultos
  const adultMagazine = await prisma.magazine.findUnique({
    where: { code: 'ADU-01' }
  });

  if (!adultMagazine) {
    console.log('❌ Revista ADU-01 não encontrada');
    return;
  }

  // Criar tipo de variação: "Tipo de Usuário"
  const userType = await prisma.magazineVariantType.create({
    data: {
      magazineId: adultMagazine.id,
      name: 'Tipo de Usuário',
      position: 1,
      required: true,
      options: {
        create: [
          { name: 'Aluno', position: 1 },
          { name: 'Professor', position: 2 }
        ]
      }
    },
    include: { options: true }
  });

  // Criar tipo de variação: "Tipo de Capa"
  const coverType = await prisma.magazineVariantType.create({
    data: {
      magazineId: adultMagazine.id,
      name: 'Tipo de Capa',
      position: 2,
      required: true,
      options: {
        create: [
          { name: 'Normal', position: 1 },
          { name: 'Capa Dura', position: 2 },
          { name: 'Letra Grande', position: 3 },
          { name: 'Livro de Apoio', position: 4 }
        ]
      }
    },
    include: { options: true }
  });

  // Criar combinações com preços específicos
  const userTypeAluno = userType.options.find(o => o.name === 'Aluno');
  const userTypeProfessor = userType.options.find(o => o.name === 'Professor');
  const coverNormal = coverType.options.find(o => o.name === 'Normal');
  const coverCapaDura = coverType.options.find(o => o.name === 'Capa Dura');
  const coverLetraGrande = coverType.options.find(o => o.name === 'Letra Grande');
  const coverLivroApoio = coverType.options.find(o => o.name === 'Livro de Apoio');

  const combinations = [
    {
      name: 'Aluno - Normal',
      code: 'ADU-001',
      variantData: { [userType.id]: userTypeAluno.id, [coverType.id]: coverNormal.id },
      price: 8.50
    },
    {
      name: 'Aluno - Capa Dura',
      code: 'ADU-002',
      variantData: { [userType.id]: userTypeAluno.id, [coverType.id]: coverCapaDura.id },
      price: 13.50
    },
    {
      name: 'Aluno - Letra Grande',
      code: 'ADU-003',
      variantData: { [userType.id]: userTypeAluno.id, [coverType.id]: coverLetraGrande.id },
      price: 11.50
    },
    {
      name: 'Aluno - Livro de Apoio',
      code: 'ADU-004',
      variantData: { [userType.id]: userTypeAluno.id, [coverType.id]: coverLivroApoio.id },
      price: 12.50
    },
    {
      name: 'Professor - Normal',
      code: 'ADU-005',
      variantData: { [userType.id]: userTypeProfessor.id, [coverType.id]: coverNormal.id },
      price: 10.50
    },
    {
      name: 'Professor - Capa Dura',
      code: 'ADU-006',
      variantData: { [userType.id]: userTypeProfessor.id, [coverType.id]: coverCapaDura.id },
      price: 15.50
    },
    {
      name: 'Professor - Letra Grande',
      code: 'ADU-007',
      variantData: { [userType.id]: userTypeProfessor.id, [coverType.id]: coverLetraGrande.id },
      price: 13.50
    },
    {
      name: 'Professor - Livro de Apoio',
      code: 'ADU-008',
      variantData: { [userType.id]: userTypeProfessor.id, [coverType.id]: coverLivroApoio.id },
      price: 14.50
    }
  ];

  for (const combo of combinations) {
    await prisma.magazineVariantCombination.create({
      data: {
        magazineId: adultMagazine.id,
        ...combo
      }
    });
  }

  console.log('✅ Variações e combinações adicionadas com sucesso!');
  console.log(`   - ${userType.name}: ${userType.options.map(o => o.name).join(', ')}`);
  console.log(`   - ${coverType.name}: ${coverType.options.map(o => o.name).join(', ')}`);
  console.log(`   - ${combinations.length} combinações de preços criadas`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Erro:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

