const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupOldAddons() {
  try {
    console.log('🧹 Czyszczę stare dodatki do pizzy...');

    // 1. Znajdź starą grupę "Dodatki do Pizzy"
    const oldPizzaAddonGroup = await prisma.addonGroup.findFirst({
      where: { name: 'Dodatki do Pizzy' }
    });

    if (oldPizzaAddonGroup) {
      console.log('🗑️ Usuwam starą grupę "Dodatki do Pizzy"');
      
      // Usuń wszystkie dodatki z tej grupy
      await prisma.addonItem.deleteMany({
        where: { groupId: oldPizzaAddonGroup.id }
      });

      // Usuń przypisania grupy do kategorii
      await prisma.groupAssignment.deleteMany({
        where: { groupId: oldPizzaAddonGroup.id }
      });

      // Usuń grupę
      await prisma.addonGroup.delete({
        where: { id: oldPizzaAddonGroup.id }
      });

      console.log('✅ Stara grupa "Dodatki do Pizzy" została usunięta');
    }

    // 2. Sprawdź nowe grupy
    const meatGroup = await prisma.addonGroup.findFirst({
      where: { name: 'Dodatki mięsne do Pizzy' }
    });

    const vegetableGroup = await prisma.addonGroup.findFirst({
      where: { name: 'Dodatki warzywne do Pizzy' }
    });

    if (meatGroup && vegetableGroup) {
      console.log('✅ Nowe grupy dodatków istnieją:');
      console.log(`- ${meatGroup.name}: ${meatGroup.id}`);
      console.log(`- ${vegetableGroup.name}: ${vegetableGroup.id}`);
    }

    console.log('🎉 Czyszczenie zakończone pomyślnie!');

  } catch (error) {
    console.error('❌ Błąd podczas czyszczenia:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom skrypt
cleanupOldAddons()
  .then(() => {
    console.log('✅ Skrypt zakończony pomyślnie');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Błąd:', error);
    process.exit(1);
  });











