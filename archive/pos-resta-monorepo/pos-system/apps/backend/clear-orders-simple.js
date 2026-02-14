// Prosty skrypt do czyszczenia zamówień
// Uruchom: node clear-orders-simple.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Czyszczenie zamówień...');
  
  const count = await prisma.order.count();
  console.log(`📊 Znaleziono ${count} zamówień`);
  
  if (count > 0) {
    await prisma.order.deleteMany({});
    console.log(`✅ Usunięto ${count} zamówień`);
  } else {
    console.log('✅ Brak zamówień do usunięcia');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);