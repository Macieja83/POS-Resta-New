import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏢 Adding company settings...');

  // Create default company settings for Słupsk
  const companySettings = await prisma.companySettings.upsert({
    where: { id: 'default-company' },
    update: {},
    create: {
      id: 'default-company',
      name: 'Restauracja POS',
      address: 'ul. Szczecinska 83, 76-200 Słupsk, Polska',
      latitude: 54.46,
      longitude: 17.02,
      phone: '+48 123 456 789',
      email: 'kontakt@restauracja.pl',
      website: 'https://www.restauracja.pl'
    }
  });

  console.log('✅ Company settings created:', companySettings);
}

main()
  .catch((e) => {
    console.error('❌ Error creating company settings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
