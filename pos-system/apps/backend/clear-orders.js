const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearOrders() {
  try {
    console.log('🧹 Rozpoczynam czyszczenie zamówień...');
    
    // Sprawdź ile jest zamówień
    const orderCount = await prisma.order.count();
    console.log(`📊 Znaleziono ${orderCount} zamówień do usunięcia`);
    
    if (orderCount === 0) {
      console.log('✅ Brak zamówień do usunięcia');
      return;
    }
    
    // Usuń wszystkie zamówienia (OrderItem i Delivery zostaną usunięte automatycznie przez CASCADE)
    const result = await prisma.order.deleteMany({});
    
    console.log(`✅ Usunięto ${result.count} zamówień`);
    console.log('🎉 Czyszczenie zakończone pomyślnie!');
    
  } catch (error) {
    console.error('❌ Błąd podczas czyszczenia zamówień:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearOrders();
