import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCompanyLocation() {
  console.log('🏢 Updating company location to Szczecinska 83...');

  const updated = await prisma.companySettings.update({
    where: { id: 'default-company' },
    data: {
      name: 'Restauracja POS',
      address: 'ul. Szczecinska 83, 76-200 Słupsk, Polska',
      latitude: 54.466,
      longitude: 17.025,
      phone: '+48 123 456 789',
      email: 'kontakt@restauracja.pl',
      website: 'https://www.restauracja.pl'
    }
  });

  console.log('✅ Updated company location:', updated);
  await prisma.$disconnect();
}

updateCompanyLocation().catch(console.error);
