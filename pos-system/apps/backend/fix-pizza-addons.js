const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixPizzaAddons() {
  try {
    console.log('🍕 Naprawiam dodatki do pizzy...');

    // 1. Znajdź grupę "Dodatki do Pizzy"
    const pizzaAddonGroup = await prisma.addonGroup.findFirst({
      where: { name: 'Dodatki do Pizzy' }
    });

    if (!pizzaAddonGroup) {
      console.error('❌ Nie znaleziono grupy "Dodatki do Pizzy"');
      return;
    }

    console.log('✅ Znaleziono grupę dodatków do pizzy:', pizzaAddonGroup.id);

    // 2. Usuń istniejące dodatki do pizzy
    await prisma.addonItem.deleteMany({
      where: { groupId: pizzaAddonGroup.id }
    });

    console.log('🗑️ Usunięto stare dodatki do pizzy');

    // 3. Dodaj nowe dodatki mięsne (3/4/6 zł)
    const meatAddons = [
      'Szynka',
      'Salami', 
      'Boczek',
      'Bekon',
      'Kurczak (grillowany lub gotowany)',
      'Wołowina (w niektórych pizzach jako dodatek mięsny)',
      'Tuńczyk (z puszki lub grillowany)',
      'Krewetki'
    ];

    for (let i = 0; i < meatAddons.length; i++) {
      await prisma.addonItem.create({
        data: {
          groupId: pizzaAddonGroup.id,
          name: meatAddons[i],
          price: 3, // Cena dla najmniejszego rozmiaru (20 cm)
          isOnline: true,
          sortOrder: i + 1
        }
      });
    }

    console.log('🥩 Dodano dodatki mięsne (3/4/6 zł)');

    // 4. Dodaj dodatki warzywne (2/3/4 zł)
    const vegetableAddons = [
      'Pieczarki',
      'Papryka',
      'Cebula',
      'Cebula czerwona',
      'Czosnek',
      'Brokuły',
      'Oliwki (czarne lub zielone)',
      'Pomidor (świeży, krojony)',
      'Kukurydza',
      'Jalapeño',
      'Ananas'
    ];

    for (let i = 0; i < vegetableAddons.length; i++) {
      await prisma.addonItem.create({
        data: {
          groupId: pizzaAddonGroup.id,
          name: vegetableAddons[i],
          price: 2, // Cena dla najmniejszego rozmiaru (20 cm)
          isOnline: true,
          sortOrder: meatAddons.length + i + 1
        }
      });
    }

    console.log('🥦 Dodano dodatki warzywne (2/3/4 zł)');

    // 5. Znajdź kategorię Pizza
    const pizzaCategory = await prisma.category.findFirst({
      where: { name: 'Pizza' }
    });

    if (!pizzaCategory) {
      console.error('❌ Nie znaleziono kategorii Pizza');
      return;
    }

    console.log('✅ Znaleziono kategorię Pizza:', pizzaCategory.id);

    // 6. Pobierz rozmiary pizzy
    const pizzaSizes = await prisma.size.findMany({
      where: { categoryId: pizzaCategory.id },
      orderBy: { name: 'asc' }
    });

    console.log('📏 Rozmiary pizzy:', pizzaSizes.map(s => s.name));

    // 7. Utwórz nową grupę dla dodatków mięsnych
    const meatAddonGroup = await prisma.addonGroup.create({
      data: {
        name: 'Dodatki mięsne do Pizzy',
        isOnline: true
      }
    });

    // 8. Dodaj dodatki mięsne z ceną bazową
    for (let i = 0; i < meatAddons.length; i++) {
      await prisma.addonItem.create({
        data: {
          groupId: meatAddonGroup.id,
          name: meatAddons[i],
          price: 3, // Cena bazowa dla 20 cm
          isOnline: true,
          sortOrder: i + 1
        }
      });
    }

    console.log('🥩 Utworzono grupę dodatków mięsnych (3/4/6 zł)');

    // 9. Utwórz nową grupę dla dodatków warzywnych
    const vegetableAddonGroup = await prisma.addonGroup.create({
      data: {
        name: 'Dodatki warzywne do Pizzy',
        isOnline: true
      }
    });

    // 10. Dodaj dodatki warzywne z ceną bazową
    for (let i = 0; i < vegetableAddons.length; i++) {
      await prisma.addonItem.create({
        data: {
          groupId: vegetableAddonGroup.id,
          name: vegetableAddons[i],
          price: 2, // Cena bazowa dla 20 cm
          isOnline: true,
          sortOrder: i + 1
        }
      });
    }

    console.log('🥦 Utworzono grupę dodatków warzywnych (2/3/4 zł)');

    // 11. Przypisz nowe grupy do kategorii Pizza
    await prisma.groupAssignment.createMany({
      data: [
        { groupId: meatAddonGroup.id, categoryId: pizzaCategory.id },
        { groupId: vegetableAddonGroup.id, categoryId: pizzaCategory.id }
      ]
    });

    console.log('🔗 Przypisano nowe grupy dodatków do kategorii Pizza');

    // 12. Usuń starą grupę "Dodatki do Pizzy" jeśli nie jest używana
    const oldGroupAssignments = await prisma.groupAssignment.findMany({
      where: { groupId: pizzaAddonGroup.id }
    });

    if (oldGroupAssignments.length === 0) {
      await prisma.addonItem.deleteMany({
        where: { groupId: pizzaAddonGroup.id }
      });
      await prisma.addonGroup.delete({
        where: { id: pizzaAddonGroup.id }
      });
      console.log('🗑️ Usunięto starą grupę "Dodatki do Pizzy"');
    }

    console.log('🎉 Dodatki do pizzy zostały pomyślnie zaktualizowane!');
    console.log('📊 Statystyki:');
    console.log(`- Dodatki mięsne: ${meatAddons.length} (3/4/6 zł)`);
    console.log(`- Dodatki warzywne: ${vegetableAddons.length} (2/3/4 zł)`);
    console.log(`- Rozmiary pizzy: ${pizzaSizes.length}`);

  } catch (error) {
    console.error('❌ Błąd podczas aktualizacji dodatków do pizzy:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom skrypt
fixPizzaAddons()
  .then(() => {
    console.log('✅ Skrypt zakończony pomyślnie');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Błąd:', error);
    process.exit(1);
  });
