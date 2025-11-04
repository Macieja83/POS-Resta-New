const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedMenu() {
  try {
    console.log('🌱 Rozpoczynam dodawanie menu...');

    // 1. Utwórz kategorie
    console.log('📁 Tworzę kategorie...');
    
    const startery = await prisma.category.create({
      data: {
        name: 'Startery / Dodatki',
        vatRate: 0.23,
        isDefault: false,
        isOnline: true
      }
    });

    const stripsy = await prisma.category.create({
      data: {
        name: 'Stripsy',
        vatRate: 0.23,
        isDefault: false,
        isOnline: true
      }
    });

    const skrzydelka = await prisma.category.create({
      data: {
        name: 'Skrzydełka',
        vatRate: 0.23,
        isDefault: false,
        isOnline: true
      }
    });

    const naladowaneFrytki = await prisma.category.create({
      data: {
        name: 'Naładowane Frytki',
        vatRate: 0.23,
        isDefault: false,
        isOnline: true
      }
    });

    const salatki = await prisma.category.create({
      data: {
        name: 'Sałatki',
        vatRate: 0.23,
        isDefault: false,
        isOnline: true
      }
    });

    const pizza = await prisma.category.create({
      data: {
        name: 'Pizza',
        vatRate: 0.23,
        isDefault: false,
        isOnline: true
      }
    });

    const burgeryWolowe = await prisma.category.create({
      data: {
        name: 'Burgery Wołowe',
        vatRate: 0.23,
        isDefault: false,
        isOnline: true
      }
    });

    const kanapkiKurczak = await prisma.category.create({
      data: {
        name: 'Kanapki & Kurczak Burgery',
        vatRate: 0.23,
        isDefault: false,
        isOnline: true
      }
    });

    console.log('✅ Kategorie utworzone');

    // 2. Dodaj rozmiary do kategorii
    console.log('📏 Dodaję rozmiary...');

    // Rozmiary dla Stripsy (5/10/20 szt)
    await prisma.size.createMany({
      data: [
        { categoryId: stripsy.id, name: '5 szt', isDefaultInCategory: true, isOnline: true },
        { categoryId: stripsy.id, name: '10 szt', isDefaultInCategory: false, isOnline: true },
        { categoryId: stripsy.id, name: '20 szt', isDefaultInCategory: false, isOnline: true }
      ]
    });

    // Rozmiary dla Skrzydełka (8/16/32 szt)
    await prisma.size.createMany({
      data: [
        { categoryId: skrzydelka.id, name: '8 szt', isDefaultInCategory: true, isOnline: true },
        { categoryId: skrzydelka.id, name: '16 szt', isDefaultInCategory: false, isOnline: true },
        { categoryId: skrzydelka.id, name: '32 szt', isDefaultInCategory: false, isOnline: true }
      ]
    });

    // Rozmiary dla Pizza (20/30/40 cm)
    await prisma.size.createMany({
      data: [
        { categoryId: pizza.id, name: '20 cm', isDefaultInCategory: true, isOnline: true },
        { categoryId: pizza.id, name: '30 cm', isDefaultInCategory: false, isOnline: true },
        { categoryId: pizza.id, name: '40 cm', isDefaultInCategory: false, isOnline: true }
      ]
    });

    console.log('✅ Rozmiary dodane');

    // 3. Utwórz grupy dodatków
    console.log('🎯 Tworzę grupy dodatków...');

    const dodatkiDoPizzy = await prisma.addonGroup.create({
      data: {
        name: 'Dodatki do Pizzy',
        isOnline: true
      }
    });

    const dodatkiDoBurgerow = await prisma.addonGroup.create({
      data: {
        name: 'Dodatki do Burgerów',
        isOnline: true
      }
    });

    const sosy = await prisma.addonGroup.create({
      data: {
        name: 'Sosy',
        isOnline: true
      }
    });

    console.log('✅ Grupy dodatków utworzone');

    // 4. Dodaj pozycje do grup dodatków
    console.log('🍕 Dodaję dodatki do pizzy...');

    await prisma.addonItem.createMany({
      data: [
        { groupId: dodatkiDoPizzy.id, name: 'Baza (sos, ser)', price: 0, isOnline: true, sortOrder: 1 },
        { groupId: dodatkiDoPizzy.id, name: 'Dodatek mięsny', price: 2, isOnline: true, sortOrder: 2 },
        { groupId: dodatkiDoPizzy.id, name: 'Dodatek warzywny', price: 2, isOnline: true, sortOrder: 3 },
        { groupId: dodatkiDoPizzy.id, name: 'Extra ser', price: 3, isOnline: true, sortOrder: 4 }
      ]
    });

    console.log('🍔 Dodaję dodatki do burgerów...');

    await prisma.addonItem.createMany({
      data: [
        { groupId: dodatkiDoBurgerow.id, name: 'Napój 0,2 l', price: 6, isOnline: true, sortOrder: 1 },
        { groupId: dodatkiDoBurgerow.id, name: 'Extra wołowina', price: 10, isOnline: true, sortOrder: 2 },
        { groupId: dodatkiDoBurgerow.id, name: 'Grillowany boczek', price: 5, isOnline: true, sortOrder: 3 },
        { groupId: dodatkiDoBurgerow.id, name: 'Extra ser', price: 5, isOnline: true, sortOrder: 4 },
        { groupId: dodatkiDoBurgerow.id, name: 'Zestaw: kanapka/burger + frytki/bataty + mix sałat/coleslaw', price: 10, isOnline: true, sortOrder: 5 }
      ]
    });

    console.log('🥫 Dodaję sosy...');

    await prisma.addonItem.createMany({
      data: [
        { groupId: sosy.id, name: 'Czosnkowy', price: 3, isOnline: true, sortOrder: 1 },
        { groupId: sosy.id, name: 'Czosnkowy ostry', price: 3, isOnline: true, sortOrder: 2 },
        { groupId: sosy.id, name: 'Tzatziki mayo', price: 3, isOnline: true, sortOrder: 3 },
        { groupId: sosy.id, name: 'Sweet Chilli', price: 3, isOnline: true, sortOrder: 4 },
        { groupId: sosy.id, name: 'Teriyaki mayo', price: 3, isOnline: true, sortOrder: 5 },
        { groupId: sosy.id, name: 'Ketchup', price: 3, isOnline: true, sortOrder: 6 },
        { groupId: sosy.id, name: 'Pomidorowy', price: 3, isOnline: true, sortOrder: 7 },
        { groupId: sosy.id, name: 'Musztarda', price: 3, isOnline: true, sortOrder: 8 },
        { groupId: sosy.id, name: 'Oliwa', price: 3, isOnline: true, sortOrder: 9 },
        { groupId: sosy.id, name: 'BBQ', price: 3, isOnline: true, sortOrder: 10 }
      ]
    });

    console.log('✅ Dodatki dodane');

    // 5. Przypisz grupy dodatków do kategorii
    console.log('🔗 Przypisuję grupy dodatków do kategorii...');

    await prisma.groupAssignment.createMany({
      data: [
        { groupId: dodatkiDoPizzy.id, categoryId: pizza.id },
        { groupId: dodatkiDoBurgerow.id, categoryId: burgeryWolowe.id },
        { groupId: dodatkiDoBurgerow.id, categoryId: kanapkiKurczak.id },
        { groupId: sosy.id, categoryId: pizza.id },
        { groupId: sosy.id, categoryId: burgeryWolowe.id },
        { groupId: sosy.id, categoryId: kanapkiKurczak.id }
      ]
    });

    console.log('✅ Grupy dodatków przypisane');

    // 6. Dodaj pozycje menu - Startery
    console.log('🍤 Dodaję startery...');

    const starteryItems = [
      { name: 'Krewetki w tempurze', price: 28 },
      { name: 'Z sosem sweet chilli 5 szt.', price: 9 },
      { name: 'Frytki', price: 12 },
      { name: 'Frytki z batatów', price: 15 },
      { name: 'Krążki cebulowe 10 szt.', price: 15 },
      { name: 'Garlic Pizza Bread', price: 19 },
      { name: 'Nachosy zapiekane z serem', price: 18 },
      { name: 'Jalapeño', price: 0 },
      { name: 'Coleslaw', price: 8 },
      { name: 'Mix sałat', price: 8 }
    ];

    for (const item of starteryItems) {
      await prisma.dish.create({
        data: {
          name: item.name,
          categoryId: startery.id
        }
      });
    }

    console.log('✅ Startery dodane');

    // 7. Dodaj Stripsy z rozmiarami
    console.log('🍗 Dodaję stripsy...');

    const stripsyItems = [
      { name: 'Klasyczne Stripsy', prices: [23, 39, 55] },
      { name: 'Buffalo Stripsy', prices: [24, 40, 56] }
    ];

    for (const item of stripsyItems) {
      const dish = await prisma.dish.create({
        data: {
          name: item.name,
          categoryId: stripsy.id
        }
      });

      // Pobierz rozmiary dla kategorii stripsy
      const sizes = await prisma.size.findMany({
        where: { categoryId: stripsy.id },
        orderBy: { name: 'asc' }
      });

      // Dodaj ceny dla każdego rozmiaru
      for (let i = 0; i < sizes.length && i < item.prices.length; i++) {
        await prisma.dishSize.create({
          data: {
            dishId: dish.id,
            sizeId: sizes[i].id,
            price: item.prices[i]
          }
        });
      }
    }

    console.log('✅ Stripsy dodane');

    // 8. Dodaj Skrzydełka z rozmiarami
    console.log('🍗 Dodaję skrzydełka...');

    const skrzydelkaItems = [
      { name: 'Buffalo Wings', prices: [24, 39, 56] },
      { name: 'BBQ Wings', prices: [24, 39, 56] },
      { name: 'Klasyk Wings', prices: [23, 36, 53] }
    ];

    for (const item of skrzydelkaItems) {
      const dish = await prisma.dish.create({
        data: {
          name: item.name,
          categoryId: skrzydelka.id
        }
      });

      // Pobierz rozmiary dla kategorii skrzydełka
      const sizes = await prisma.size.findMany({
        where: { categoryId: skrzydelka.id },
        orderBy: { name: 'asc' }
      });

      // Dodaj ceny dla każdego rozmiaru
      for (let i = 0; i < sizes.length && i < item.prices.length; i++) {
        await prisma.dishSize.create({
          data: {
            dishId: dish.id,
            sizeId: sizes[i].id,
            price: item.prices[i]
          }
        });
      }
    }

    console.log('✅ Skrzydełka dodane');

    // 9. Dodaj Naładowane Frytki
    console.log('🍟 Dodaję naładowane frytki...');

    const naladowaneFrytkiItems = [
      { name: 'Fryty Buffalo', price: 30 },
      { name: 'Fryty z Wołowiną', price: 37 },
      { name: 'Fryty z Grillowanym Halloumi', price: 35 }
    ];

    for (const item of naladowaneFrytkiItems) {
      await prisma.dish.create({
        data: {
          name: item.name,
          categoryId: naladowaneFrytki.id
        }
      });
    }

    console.log('✅ Naładowane frytki dodane');

    // 10. Dodaj Sałatki
    console.log('🥗 Dodaję sałatki...');

    const salatkiItems = [
      { name: 'Grillowany kurczak', price: 32 },
      { name: 'Łosoś pieczony Teriyaki', price: 36 },
      { name: 'Grillowany Halloumi', price: 29 }
    ];

    for (const item of salatkiItems) {
      await prisma.dish.create({
        data: {
          name: item.name,
          categoryId: salatki.id
        }
      });
    }

    console.log('✅ Sałatki dodane');

    // 11. Dodaj Pizze z rozmiarami
    console.log('🍕 Dodaję pizze...');

    const pizzaItems = [
      { name: 'Margarita', prices: [18, 36, 49] },
      { name: 'Capricciosa', prices: [19, 38, 52] },
      { name: 'Hawaii', prices: [19, 38, 52] },
      { name: 'Pepperoni', prices: [19, 38, 52] },
      { name: 'Padre', prices: [20, 40, 53] },
      { name: 'Primo', prices: [20, 40, 53] },
      { name: 'Vege', prices: [19, 38, 51] },
      { name: 'Mafioso', prices: [20, 41, 52] },
      { name: 'Roma', prices: [20, 41, 54] },
      { name: 'Pollo', prices: [20, 41, 54] },
      { name: 'Panchetta', prices: [20, 40, 53] },
      { name: 'Sicilia', prices: [21, 42, 55] },
      { name: 'Diabolo', prices: [21, 41, 54] },
      { name: 'Perugia', prices: [21, 41, 54] },
      { name: 'Acapulco', prices: [20, 41, 54] },
      { name: 'Straniera', prices: [20, 41, 54] },
      { name: 'Broccoli', prices: [20, 41, 54] },
      { name: 'Tuna Love', prices: [21, 42, 55] },
      { name: 'Mexicana', prices: [20, 41, 54] },
      { name: 'Ombo', prices: [20, 41, 55] }
    ];

    for (const item of pizzaItems) {
      const dish = await prisma.dish.create({
        data: {
          name: item.name,
          categoryId: pizza.id
        }
      });

      // Pobierz rozmiary dla kategorii pizza
      const sizes = await prisma.size.findMany({
        where: { categoryId: pizza.id },
        orderBy: { name: 'asc' }
      });

      // Dodaj ceny dla każdego rozmiaru
      for (let i = 0; i < sizes.length && i < item.prices.length; i++) {
        await prisma.dishSize.create({
          data: {
            dishId: dish.id,
            sizeId: sizes[i].id,
            price: item.prices[i]
          }
        });
      }
    }

    console.log('✅ Pizze dodane');

    // 12. Dodaj Burgery Wołowe
    console.log('🍔 Dodaję burgery wołowe...');

    const burgeryWoloweItems = [
      { name: 'Klasyk Burger', price: 35 },
      { name: 'Chees Burger', price: 36 },
      { name: 'Hot & Spice Burger', price: 37 },
      { name: 'Tutto Signature', price: 38 },
      { name: 'Gringo Burger', price: 37 },
      { name: 'Eggy Pop Burger', price: 38 },
      { name: 'Big Boy Burger', price: 38 }
    ];

    for (const item of burgeryWoloweItems) {
      await prisma.dish.create({
        data: {
          name: item.name,
          categoryId: burgeryWolowe.id
        }
      });
    }

    console.log('✅ Burgery wołowe dodane');

    // 13. Dodaj Kanapki & Kurczak Burgery
    console.log('🥪 Dodaję kanapki i kurczak burgery...');

    const kanapkiKurczakItems = [
      { name: 'Klasyk Chick Burger', price: 35 },
      { name: 'Buffalo Chick Sandwich', price: 36 },
      { name: 'Angry Bird Burger', price: 37 },
      { name: 'Koło Chick Burger', price: 35 },
      { name: 'Fat Chick Sandwich', price: 37 },
      { name: 'Philadelphia Beef Sandwich', price: 38 },
      { name: 'Hallo Mi Sandwich', price: 35 }
    ];

    for (const item of kanapkiKurczakItems) {
      await prisma.dish.create({
        data: {
          name: item.name,
          categoryId: kanapkiKurczak.id
        }
      });
    }

    console.log('✅ Kanapki i kurczak burgery dodane');

    console.log('🎉 Menu zostało pomyślnie dodane!');
    console.log('📊 Statystyki:');
    console.log(`- Kategorie: 8`);
    console.log(`- Rozmiary: 9 (3 dla stripsy, 3 dla skrzydełka, 3 dla pizzy)`);
    console.log(`- Grupy dodatków: 3`);
    console.log(`- Dodatki: 19`);
    console.log(`- Pozycje menu: 47`);

  } catch (error) {
    console.error('❌ Błąd podczas dodawania menu:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom skrypt
seedMenu()
  .then(() => {
    console.log('✅ Skrypt zakończony pomyślnie');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Błąd:', error);
    process.exit(1);
  });











