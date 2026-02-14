import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting complete database seeding...');

  // Clear existing data (in correct order due to foreign key constraints)
  await prisma.groupAssignment.deleteMany();
  await prisma.modifier.deleteMany();
  await prisma.addonItem.deleteMany();
  await prisma.addonGroup.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.dishSize.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.size.deleteMany();
  await prisma.category.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.address.deleteMany();
  await prisma.employee.deleteMany();

  console.log('🧹 Cleared existing data');

  // Create employees
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        name: 'Jan Kowalski',
        email: 'jan.kowalski@example.com',
        phone: '+48123456789',
        role: 'MANAGER',
        loginCode: '1234',
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Anna Nowak',
        email: 'anna.nowak@example.com',
        phone: '+48987654321',
        role: 'DRIVER',
        loginCode: '5678',
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Piotr Wiśniewski',
        email: 'piotr.wisniewski@example.com',
        phone: '+48555666777',
        role: 'COOK',
        loginCode: '9012',
      },
    }),
  ]);

  console.log('✅ Created employees:', employees.length);

  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Maria Kowalska',
        phone: '+48111111111',
        email: 'maria.kowalska@example.com',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Tomasz Nowak',
        phone: '+48222222222',
        email: 'tomasz.nowak@example.com',
      },
    }),
  ]);

  console.log('✅ Created customers:', customers.length);

  // Create addresses
  const addresses = await Promise.all([
    prisma.address.create({
      data: {
        street: 'ul. Marszałkowska 1',
        city: 'Warszawa',
        postalCode: '00-001',
        latitude: 52.2297,
        longitude: 21.0122,
      },
    }),
    prisma.address.create({
      data: {
        street: 'ul. Krakowskie Przedmieście 5',
        city: 'Warszawa',
        postalCode: '00-068',
        latitude: 52.2397,
        longitude: 21.0122,
      },
    }),
  ]);

  console.log('✅ Created addresses:', addresses.length);

  // ===== COMPLETE MENU SEED DATA =====

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Startery / Dodatki',
        vatRate: 8.0,
        isDefault: false,
        isOnline: true,
        imageUrl: 'https://example.com/starters.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Stripsy',
        vatRate: 8.0,
        isDefault: false,
        isOnline: true,
        imageUrl: 'https://example.com/strips.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Skrzydełka',
        vatRate: 8.0,
        isDefault: false,
        isOnline: true,
        imageUrl: 'https://example.com/wings.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Naładowane Frytki',
        vatRate: 8.0,
        isDefault: false,
        isOnline: true,
        imageUrl: 'https://example.com/loaded-fries.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Sałatki',
        vatRate: 8.0,
        isDefault: false,
        isOnline: true,
        imageUrl: 'https://example.com/salads.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Pizza',
        vatRate: 8.0,
        isDefault: true,
        isOnline: true,
        imageUrl: 'https://example.com/pizza.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Burgery Wołowe',
        vatRate: 8.0,
        isDefault: false,
        isOnline: true,
        imageUrl: 'https://example.com/beef-burgers.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Kanapki & Kurczak Burgery',
        vatRate: 8.0,
        isDefault: false,
        isOnline: true,
        imageUrl: 'https://example.com/chicken-burgers.jpg',
      },
    }),
  ]);

  console.log('✅ Created categories:', categories.length);

  // Create sizes for each category
  const pizzaSizes = await Promise.all([
    prisma.size.create({
      data: {
        categoryId: categories[5].id, // Pizza
        name: '20cm',
        isDefaultInCategory: false,
        isOnline: true,
      },
    }),
    prisma.size.create({
      data: {
        categoryId: categories[5].id, // Pizza
        name: '30cm',
        isDefaultInCategory: true,
        isOnline: true,
      },
    }),
    prisma.size.create({
      data: {
        categoryId: categories[5].id, // Pizza
        name: '40cm',
        isDefaultInCategory: false,
        isOnline: true,
      },
    }),
  ]);

  const stripsSizes = await Promise.all([
    prisma.size.create({
      data: {
        categoryId: categories[1].id, // Stripsy
        name: '5 szt.',
        isDefaultInCategory: false,
        isOnline: true,
      },
    }),
    prisma.size.create({
      data: {
        categoryId: categories[1].id, // Stripsy
        name: '10 szt.',
        isDefaultInCategory: true,
        isOnline: true,
      },
    }),
    prisma.size.create({
      data: {
        categoryId: categories[1].id, // Stripsy
        name: '20 szt.',
        isDefaultInCategory: false,
        isOnline: true,
      },
    }),
  ]);

  const wingsSizes = await Promise.all([
    prisma.size.create({
      data: {
        categoryId: categories[2].id, // Skrzydełka
        name: '8 szt.',
        isDefaultInCategory: false,
        isOnline: true,
      },
    }),
    prisma.size.create({
      data: {
        categoryId: categories[2].id, // Skrzydełka
        name: '16 szt.',
        isDefaultInCategory: true,
        isOnline: true,
      },
    }),
    prisma.size.create({
      data: {
        categoryId: categories[2].id, // Skrzydełka
        name: '32 szt.',
        isDefaultInCategory: false,
        isOnline: true,
      },
    }),
  ]);

  // Default sizes for other categories
  const defaultSizes = await Promise.all([
    prisma.size.create({
      data: {
        categoryId: categories[0].id, // Startery
        name: 'Domyślny',
        isDefaultInCategory: true,
        isOnline: true,
      },
    }),
    prisma.size.create({
      data: {
        categoryId: categories[3].id, // Naładowane Frytki
        name: 'Domyślny',
        isDefaultInCategory: true,
        isOnline: true,
      },
    }),
    prisma.size.create({
      data: {
        categoryId: categories[4].id, // Sałatki
        name: 'Domyślny',
        isDefaultInCategory: true,
        isOnline: true,
      },
    }),
    prisma.size.create({
      data: {
        categoryId: categories[6].id, // Burgery Wołowe
        name: 'Domyślny',
        isDefaultInCategory: true,
        isOnline: true,
      },
    }),
    prisma.size.create({
      data: {
        categoryId: categories[7].id, // Kanapki & Kurczak Burgery
        name: 'Domyślny',
        isDefaultInCategory: true,
        isOnline: true,
      },
    }),
  ]);

  console.log('✅ Created sizes:', pizzaSizes.length + stripsSizes.length + wingsSizes.length + defaultSizes.length);

  // Create dishes for each category
  console.log('🍕 Creating pizza dishes...');
  const pizzaDishes = await Promise.all([
    // Pizza dishes with ingredients
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Margarita',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Capricciosa',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Hawaii',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Pepperoni',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Padre',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Primo',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Vege',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Mafioso',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Roma',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Pollo',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Panchetta',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Sicilia',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Diabolo',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Perugia',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Acapulco',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Straniera',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Broccoli',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Tuna Love',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Mexicana',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[5].id,
        name: 'Ombo',
        isOnline: true,
      },
    }),
  ]);

  // Create pizza prices for each size
  const pizzaPrices = [
    [18, 36, 49], // Margarita
    [19, 38, 52], // Capricciosa
    [19, 38, 52], // Hawaii
    [19, 38, 52], // Pepperoni
    [20, 40, 53], // Padre
    [20, 40, 53], // Primo
    [19, 38, 51], // Vege
    [20, 41, 52], // Mafioso
    [20, 41, 54], // Roma
    [20, 41, 54], // Pollo
    [20, 40, 53], // Panchetta
    [21, 42, 55], // Sicilia
    [21, 41, 54], // Diabolo
    [21, 41, 54], // Perugia
    [20, 41, 54], // Acapulco
    [20, 41, 54], // Straniera
    [20, 41, 54], // Broccoli
    [21, 42, 55], // Tuna Love
    [20, 41, 54], // Mexicana
    [20, 41, 55], // Ombo
  ];

  for (let i = 0; i < pizzaDishes.length; i++) {
    const dish = pizzaDishes[i];
    const prices = pizzaPrices[i];
    
    for (let j = 0; j < pizzaSizes.length && j < prices.length; j++) {
      await prisma.dishSize.create({
        data: {
          dishId: dish.id,
          sizeId: pizzaSizes[j].id,
          price: prices[j],
          vatSource: 'INHERIT',
          isOnline: true,
        },
      });
    }
  }

  console.log('✅ Created pizza dishes with prices');

  // Create pizza ingredients
  const pizzaIngredients = [
    // Margarita - sos, ser
    { dishId: pizzaDishes[0].id, ingredients: ['sos', 'ser'] },
    // Capricciosa - sos, ser, szynka, pieczarki
    { dishId: pizzaDishes[1].id, ingredients: ['sos', 'ser', 'szynka', 'pieczarki'] },
    // Hawaii - sos, ser, szynka, ananas
    { dishId: pizzaDishes[2].id, ingredients: ['sos', 'ser', 'szynka', 'ananas'] },
    // Pepperoni - sos, ser, salami, jalapeños
    { dishId: pizzaDishes[3].id, ingredients: ['sos', 'ser', 'salami', 'jalapeños'] },
    // Padre - sos, ser, pieczarki, cebula, papryka, kukurydza
    { dishId: pizzaDishes[4].id, ingredients: ['sos', 'ser', 'pieczarki', 'cebula', 'papryka', 'kukurydza'] },
    // Primo - sos, ser, szynka, cebula, jalapeños
    { dishId: pizzaDishes[5].id, ingredients: ['sos', 'ser', 'szynka', 'cebula', 'jalapeños'] },
    // Vege - sos, ser, pieczarki, pomidor, papryka, cebula, kukurydza
    { dishId: pizzaDishes[6].id, ingredients: ['sos', 'ser', 'pieczarki', 'pomidor', 'papryka', 'cebula', 'kukurydza'] },
    // Mafioso - sos, ser, szynka, jalapeños, papryka, cebula, kukurydza
    { dishId: pizzaDishes[7].id, ingredients: ['sos', 'ser', 'szynka', 'jalapeños', 'papryka', 'cebula', 'kukurydza'] },
    // Roma - sos, ser, bekon, czosnek, krewetki, oliwki
    { dishId: pizzaDishes[8].id, ingredients: ['sos', 'ser', 'bekon', 'czosnek', 'krewetki', 'oliwki'] },
    // Pollo - sos, ser, kurczak, papryka, czosnek
    { dishId: pizzaDishes[9].id, ingredients: ['sos', 'ser', 'kurczak', 'papryka', 'czosnek'] },
    // Panchetta - sos, ser, bekon, czosnek, pieczarki, papryka, cebula
    { dishId: pizzaDishes[10].id, ingredients: ['sos', 'ser', 'bekon', 'czosnek', 'pieczarki', 'papryka', 'cebula'] },
    // Sicilia - sos, ser, szynka, salami, boczek
    { dishId: pizzaDishes[11].id, ingredients: ['sos', 'ser', 'szynka', 'salami', 'boczek'] },
    // Diabolo - sos, ser, szynka, pieczarki, jalapeño, sos chilli
    { dishId: pizzaDishes[12].id, ingredients: ['sos', 'ser', 'szynka', 'pieczarki', 'jalapeño', 'sos chilli'] },
    // Perugia - sos, ser, pomidor, bekon, jajko
    { dishId: pizzaDishes[13].id, ingredients: ['sos', 'ser', 'pomidor', 'bekon', 'jajko'] },
    // Acapulco - sos, ser, kurczak, ananas, kukurydza
    { dishId: pizzaDishes[14].id, ingredients: ['sos', 'ser', 'kurczak', 'ananas', 'kukurydza'] },
    // Straniera - sos, ser, kurczak, pomidor, pieczarki, cebula
    { dishId: pizzaDishes[15].id, ingredients: ['sos', 'ser', 'kurczak', 'pomidor', 'pieczarki', 'cebula'] },
    // Broccoli - sos, ser, szynka, cebula, brokuły, papryka
    { dishId: pizzaDishes[16].id, ingredients: ['sos', 'ser', 'szynka', 'cebula', 'brokuły', 'papryka'] },
    // Tuna Love - sos, ser, tuńczyk, cebula, oliwki
    { dishId: pizzaDishes[17].id, ingredients: ['sos', 'ser', 'tuńczyk', 'cebula', 'oliwki'] },
    // Mexicana - sos, ser, salami, kukurydza, papryka, cebula, jalapeño
    { dishId: pizzaDishes[18].id, ingredients: ['sos', 'ser', 'salami', 'kukurydza', 'papryka', 'cebula', 'jalapeño'] },
    // Ombo - sos, ser, pieczarki, papryka, kukurydza, ananas
    { dishId: pizzaDishes[19].id, ingredients: ['sos', 'ser', 'pieczarki', 'papryka', 'kukurydza', 'ananas'] },
  ];

  for (const pizza of pizzaIngredients) {
    for (const ingredient of pizza.ingredients) {
      await prisma.ingredient.create({
        data: {
          dishId: pizza.dishId,
          name: ingredient,
        },
      });
    }
  }

  console.log('✅ Created pizza ingredients');

  // Create other dishes
  console.log('🍟 Creating other dishes...');
  
  // Startery / Dodatki
  const starterDishes = await Promise.all([
    prisma.dish.create({
      data: {
        categoryId: categories[0].id,
        name: 'Krewetki w tempurze',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[0].id,
        name: 'Z sosem sweet chilli 5 szt.',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[0].id,
        name: 'Frytki',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[0].id,
        name: 'Frytki z batatów',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[0].id,
        name: 'Krążki cebulowe 10 szt.',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[0].id,
        name: 'Garlic Pizza Bread',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[0].id,
        name: 'Nachosy zapiekane z serem',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[0].id,
        name: 'Jalapeño',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[0].id,
        name: 'Coleslaw',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[0].id,
        name: 'Mix sałat',
        isOnline: true,
      },
    }),
  ]);

  // Create starter prices
  const starterPrices = [28, 9, 12, 15, 15, 19, 18, 0, 8, 8];
  for (let i = 0; i < starterDishes.length; i++) {
    await prisma.dishSize.create({
      data: {
        dishId: starterDishes[i].id,
        sizeId: defaultSizes[0].id,
        price: starterPrices[i],
        vatSource: 'INHERIT',
        isOnline: true,
      },
    });
  }

  // Stripsy
  const stripsDishes = await Promise.all([
    prisma.dish.create({
      data: {
        categoryId: categories[1].id,
        name: 'Klasyczne Stripsy',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[1].id,
        name: 'Buffalo Stripsy',
        isOnline: true,
      },
    }),
  ]);

  // Create strips prices
  const stripsPrices = [
    [23, 39, 55], // Klasyczne Stripsy
    [24, 40, 56], // Buffalo Stripsy
  ];

  for (let i = 0; i < stripsDishes.length; i++) {
    const dish = stripsDishes[i];
    const prices = stripsPrices[i];
    
    for (let j = 0; j < stripsSizes.length && j < prices.length; j++) {
      await prisma.dishSize.create({
        data: {
          dishId: dish.id,
          sizeId: stripsSizes[j].id,
          price: prices[j],
          vatSource: 'INHERIT',
          isOnline: true,
        },
      });
    }
  }

  // Skrzydełka
  const wingsDishes = await Promise.all([
    prisma.dish.create({
      data: {
        categoryId: categories[2].id,
        name: 'Buffalo Wings',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[2].id,
        name: 'BBQ Wings',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[2].id,
        name: 'Klasyk Wings',
        isOnline: true,
      },
    }),
  ]);

  // Create wings prices
  const wingsPrices = [
    [24, 39, 56], // Buffalo Wings
    [24, 39, 56], // BBQ Wings
    [23, 36, 53], // Klasyk Wings
  ];

  for (let i = 0; i < wingsDishes.length; i++) {
    const dish = wingsDishes[i];
    const prices = wingsPrices[i];
    
    for (let j = 0; j < wingsSizes.length && j < prices.length; j++) {
      await prisma.dishSize.create({
        data: {
          dishId: dish.id,
          sizeId: wingsSizes[j].id,
          price: prices[j],
          vatSource: 'INHERIT',
          isOnline: true,
        },
      });
    }
  }

  // Naładowane Frytki
  const loadedFriesDishes = await Promise.all([
    prisma.dish.create({
      data: {
        categoryId: categories[3].id,
        name: 'Fryty Buffalo',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[3].id,
        name: 'Fryty z Wołowiną',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[3].id,
        name: 'Fryty z Grillowanym Halloumi',
        isOnline: true,
      },
    }),
  ]);

  // Create loaded fries prices
  const loadedFriesPrices = [30, 37, 35];
  for (let i = 0; i < loadedFriesDishes.length; i++) {
    await prisma.dishSize.create({
      data: {
        dishId: loadedFriesDishes[i].id,
        sizeId: defaultSizes[1].id,
        price: loadedFriesPrices[i],
        vatSource: 'INHERIT',
        isOnline: true,
      },
    });
  }

  // Sałatki
  const saladDishes = await Promise.all([
    prisma.dish.create({
      data: {
        categoryId: categories[4].id,
        name: 'Grillowany kurczak',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[4].id,
        name: 'Łosoś pieczony Teriyaki',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[4].id,
        name: 'Grillowany Halloumi',
        isOnline: true,
      },
    }),
  ]);

  // Create salad prices
  const saladPrices = [32, 36, 29];
  for (let i = 0; i < saladDishes.length; i++) {
    await prisma.dishSize.create({
      data: {
        dishId: saladDishes[i].id,
        sizeId: defaultSizes[2].id,
        price: saladPrices[i],
        vatSource: 'INHERIT',
        isOnline: true,
      },
    });
  }

  // Burgery Wołowe
  const beefBurgerDishes = await Promise.all([
    prisma.dish.create({
      data: {
        categoryId: categories[6].id,
        name: 'Klasyk Burger',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[6].id,
        name: 'Chees Burger',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[6].id,
        name: 'Hot & Spice Burger',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[6].id,
        name: 'Tutto Signature',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[6].id,
        name: 'Gringo Burger',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[6].id,
        name: 'Eggy Pop Burger',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[6].id,
        name: 'Big Boy Burger',
        isOnline: true,
      },
    }),
  ]);

  // Create beef burger prices
  const beefBurgerPrices = [35, 36, 37, 38, 37, 38, 38];
  for (let i = 0; i < beefBurgerDishes.length; i++) {
    await prisma.dishSize.create({
      data: {
        dishId: beefBurgerDishes[i].id,
        sizeId: defaultSizes[3].id,
        price: beefBurgerPrices[i],
        vatSource: 'INHERIT',
        isOnline: true,
      },
    });
  }

  // Kanapki & Kurczak Burgery
  const chickenBurgerDishes = await Promise.all([
    prisma.dish.create({
      data: {
        categoryId: categories[7].id,
        name: 'Klasyk Chick Burger',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[7].id,
        name: 'Buffalo Chick Sandwich',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[7].id,
        name: 'Angry Bird Burger',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[7].id,
        name: 'Koło Chick Burger',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[7].id,
        name: 'Fat Chick Sandwich',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[7].id,
        name: 'Philadelphia Beef Sandwich',
        isOnline: true,
      },
    }),
    prisma.dish.create({
      data: {
        categoryId: categories[7].id,
        name: 'Hallo Mi Sandwich',
        isOnline: true,
      },
    }),
  ]);

  // Create chicken burger prices
  const chickenBurgerPrices = [35, 36, 37, 35, 37, 38, 35];
  for (let i = 0; i < chickenBurgerDishes.length; i++) {
    await prisma.dishSize.create({
      data: {
        dishId: chickenBurgerDishes[i].id,
        sizeId: defaultSizes[4].id,
        price: chickenBurgerPrices[i],
        vatSource: 'INHERIT',
        isOnline: true,
      },
    });
  }

  console.log('✅ Created all dishes with prices');

  // Create addon groups
  const addonGroups = await Promise.all([
    prisma.addonGroup.create({
      data: {
        name: 'Dodatki mięsne do pizzy',
        isOnline: true,
      },
    }),
    prisma.addonGroup.create({
      data: {
        name: 'Dodatki warzywne do pizzy',
        isOnline: true,
      },
    }),
    prisma.addonGroup.create({
      data: {
        name: 'Dodatki specjalne do pizzy',
        isOnline: true,
      },
    }),
    prisma.addonGroup.create({
      data: {
        name: 'Dodatkowe sosy',
        isOnline: true,
      },
    }),
    prisma.addonGroup.create({
      data: {
        name: 'Dodatki do burgerów',
        isOnline: true,
      },
    }),
  ]);

  console.log('✅ Created addon groups:', addonGroups.length);

  // Create addon items
  const addonItems = await Promise.all([
    // Dodatki mięsne do pizzy (3/4/6 zł)
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[0].id,
        name: 'Szynka',
        price: 3.0,
        isOnline: true,
        sortOrder: 1,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[0].id,
        name: 'Salami',
        price: 3.0,
        isOnline: true,
        sortOrder: 2,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[0].id,
        name: 'Boczek',
        price: 3.0,
        isOnline: true,
        sortOrder: 3,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[0].id,
        name: 'Bekon',
        price: 3.0,
        isOnline: true,
        sortOrder: 4,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[0].id,
        name: 'Kurczak',
        price: 3.0,
        isOnline: true,
        sortOrder: 5,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[0].id,
        name: 'Wołowina',
        price: 3.0,
        isOnline: true,
        sortOrder: 6,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[0].id,
        name: 'Tuńczyk',
        price: 3.0,
        isOnline: true,
        sortOrder: 7,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[0].id,
        name: 'Krewetki',
        price: 3.0,
        isOnline: true,
        sortOrder: 8,
      },
    }),
    
    // Dodatki warzywne do pizzy (2/3/4 zł)
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[1].id,
        name: 'Pieczarki',
        price: 2.0,
        isOnline: true,
        sortOrder: 1,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[1].id,
        name: 'Papryka',
        price: 2.0,
        isOnline: true,
        sortOrder: 2,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[1].id,
        name: 'Cebula',
        price: 2.0,
        isOnline: true,
        sortOrder: 3,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[1].id,
        name: 'Cebula czerwona',
        price: 2.0,
        isOnline: true,
        sortOrder: 4,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[1].id,
        name: 'Czosnek',
        price: 2.0,
        isOnline: true,
        sortOrder: 5,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[1].id,
        name: 'Brokuły',
        price: 2.0,
        isOnline: true,
        sortOrder: 6,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[1].id,
        name: 'Oliwki',
        price: 2.0,
        isOnline: true,
        sortOrder: 7,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[1].id,
        name: 'Pomidor',
        price: 2.0,
        isOnline: true,
        sortOrder: 8,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[1].id,
        name: 'Kukurydza',
        price: 2.0,
        isOnline: true,
        sortOrder: 9,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[1].id,
        name: 'Jalapeño',
        price: 2.0,
        isOnline: true,
        sortOrder: 10,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[1].id,
        name: 'Ananas',
        price: 2.0,
        isOnline: true,
        sortOrder: 11,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[1].id,
        name: 'Awokado',
        price: 2.0,
        isOnline: true,
        sortOrder: 12,
      },
    }),
    
    // Dodatki specjalne do pizzy
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[2].id,
        name: 'Sos chilli',
        price: 2.0,
        isOnline: true,
        sortOrder: 1,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[2].id,
        name: 'Sriracha',
        price: 2.0,
        isOnline: true,
        sortOrder: 2,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[2].id,
        name: 'Parmezan',
        price: 2.0,
        isOnline: true,
        sortOrder: 3,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[2].id,
        name: 'Guacamole',
        price: 2.0,
        isOnline: true,
        sortOrder: 4,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[2].id,
        name: 'Oregano',
        price: 1.0,
        isOnline: true,
        sortOrder: 5,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[2].id,
        name: 'Zioła prowansalskie',
        price: 1.0,
        isOnline: true,
        sortOrder: 6,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[2].id,
        name: 'Jajko',
        price: 2.0,
        isOnline: true,
        sortOrder: 7,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[2].id,
        name: 'Ser cheddar',
        price: 2.0,
        isOnline: true,
        sortOrder: 8,
      },
    }),
    
    // Dodatkowe sosy (3 zł / 50 ml)
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[3].id,
        name: 'Czosnkowy',
        price: 3.0,
        isOnline: true,
        sortOrder: 1,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[3].id,
        name: 'Czosnkowy ostry',
        price: 3.0,
        isOnline: true,
        sortOrder: 2,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[3].id,
        name: 'Tzatziki mayo',
        price: 3.0,
        isOnline: true,
        sortOrder: 3,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[3].id,
        name: 'Sweet Chilli',
        price: 3.0,
        isOnline: true,
        sortOrder: 4,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[3].id,
        name: 'Teriyaki mayo',
        price: 3.0,
        isOnline: true,
        sortOrder: 5,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[3].id,
        name: 'Ketchup',
        price: 3.0,
        isOnline: true,
        sortOrder: 6,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[3].id,
        name: 'Pomidorowy',
        price: 3.0,
        isOnline: true,
        sortOrder: 7,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[3].id,
        name: 'Musztarda',
        price: 3.0,
        isOnline: true,
        sortOrder: 8,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[3].id,
        name: 'Oliwa',
        price: 3.0,
        isOnline: true,
        sortOrder: 9,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[3].id,
        name: 'BBQ',
        price: 3.0,
        isOnline: true,
        sortOrder: 10,
      },
    }),
    
    // Dodatki do burgerów
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[4].id,
        name: 'Napój 0,2 l',
        price: 6.0,
        isOnline: true,
        sortOrder: 1,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[4].id,
        name: 'Extra wołowina',
        price: 10.0,
        isOnline: true,
        sortOrder: 2,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[4].id,
        name: 'Grillowany boczek',
        price: 5.0,
        isOnline: true,
        sortOrder: 3,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[4].id,
        name: 'Extra ser',
        price: 5.0,
        isOnline: true,
        sortOrder: 4,
      },
    }),
    prisma.addonItem.create({
      data: {
        groupId: addonGroups[4].id,
        name: 'Zestaw: kanapka/burger + frytki/bataty + mix sałat/coleslaw',
        price: 10.0,
        isOnline: true,
        sortOrder: 5,
      },
    }),
  ]);

  console.log('✅ Created addon items:', addonItems.length);

  // Create modifiers
  const modifiers = await Promise.all([
    prisma.modifier.create({
      data: {
        groupId: addonGroups[0].id, // Dodatki mięsne do pizzy
        selectionType: 'MULTI',
        minSelect: 0,
        maxSelect: 10,
        includedFreeQty: 0,
      },
    }),
    prisma.modifier.create({
      data: {
        groupId: addonGroups[1].id, // Dodatki warzywne do pizzy
        selectionType: 'MULTI',
        minSelect: 0,
        maxSelect: 10,
        includedFreeQty: 0,
      },
    }),
    prisma.modifier.create({
      data: {
        groupId: addonGroups[2].id, // Dodatki specjalne do pizzy
        selectionType: 'MULTI',
        minSelect: 0,
        maxSelect: 5,
        includedFreeQty: 0,
      },
    }),
    prisma.modifier.create({
      data: {
        groupId: addonGroups[3].id, // Dodatkowe sosy
        selectionType: 'MULTI',
        minSelect: 0,
        maxSelect: 3,
        includedFreeQty: 0,
      },
    }),
    prisma.modifier.create({
      data: {
        groupId: addonGroups[4].id, // Dodatki do burgerów
        selectionType: 'MULTI',
        minSelect: 0,
        maxSelect: 5,
        includedFreeQty: 0,
      },
    }),
  ]);

  console.log('✅ Created modifiers:', modifiers.length);

  // Create group assignments
  const groupAssignments = await Promise.all([
    prisma.groupAssignment.create({
      data: {
        groupId: addonGroups[0].id, // Dodatki mięsne do pizzy
        categoryId: categories[5].id, // Pizza category
      },
    }),
    prisma.groupAssignment.create({
      data: {
        groupId: addonGroups[1].id, // Dodatki warzywne do pizzy
        categoryId: categories[5].id, // Pizza category
      },
    }),
    prisma.groupAssignment.create({
      data: {
        groupId: addonGroups[2].id, // Dodatki specjalne do pizzy
        categoryId: categories[5].id, // Pizza category
      },
    }),
    prisma.groupAssignment.create({
      data: {
        groupId: addonGroups[3].id, // Dodatkowe sosy
        categoryId: categories[5].id, // Pizza category
      },
    }),
    prisma.groupAssignment.create({
      data: {
        groupId: addonGroups[4].id, // Dodatki do burgerów
        categoryId: categories[6].id, // Burgery Wołowe category
      },
    }),
    prisma.groupAssignment.create({
      data: {
        groupId: addonGroups[4].id, // Dodatki do burgerów
        categoryId: categories[7].id, // Kanapki & Kurczak Burgery category
      },
    }),
  ]);

  console.log('✅ Created group assignments:', groupAssignments.length);

  // Create sample orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        orderNumber: 'ORD-001',
        status: 'OPEN',
        type: 'DELIVERY',
        total: 45.00,
        notes: 'Proszę o szybką dostawę',
        promisedTime: 30,
        customerId: customers[0].id,
        assignedEmployeeId: employees[1].id, // Driver
        items: {
          create: [
            {
              name: 'Pizza Margherita',
              quantity: 1,
              price: 25.00,
              total: 25.00,
            },
            {
              name: 'Coca-Cola 0.5L',
              quantity: 2,
              price: 10.00,
              total: 20.00,
            },
          ],
        },
        delivery: {
          create: {
            addressId: addresses[0].id,
            estimatedTime: new Date(Date.now() + 30 * 60 * 1000),
          },
        },
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-002',
        status: 'IN_PROGRESS',
        type: 'TAKEAWAY',
        total: 32.00,
        promisedTime: 20,
        customerId: customers[1].id,
        assignedEmployeeId: employees[2].id, // Cook
        items: {
          create: [
            {
              name: 'Burger Classic',
              quantity: 1,
              price: 22.00,
              total: 22.00,
            },
            {
              name: 'Frytki',
              quantity: 1,
              price: 10.00,
              total: 10.00,
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-003',
        status: 'OPEN',
        type: 'DINE_IN',
        total: 55.00,
        promisedTime: 25,
        tableNumber: '5',
        customerId: customers[0].id,
        items: {
          create: [
            {
              name: 'Pizza Margherita',
              quantity: 1,
              price: 25.00,
              total: 25.00,
            },
            {
              name: 'Coca-Cola 0.5L',
              quantity: 3,
              price: 10.00,
              total: 30.00,
            },
          ],
        },
      },
    }),
  ]);

  console.log('✅ Created orders:', orders.length);

  console.log('🎉 Complete database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Categories: ${categories.length}`);
  console.log(`- Sizes: ${pizzaSizes.length + stripsSizes.length + wingsSizes.length + defaultSizes.length}`);
  console.log(`- Pizza Dishes: ${pizzaDishes.length}`);
  console.log(`- Other Dishes: ${starterDishes.length + stripsDishes.length + wingsDishes.length + loadedFriesDishes.length + saladDishes.length + beefBurgerDishes.length + chickenBurgerDishes.length}`);
  console.log(`- Addon Groups: ${addonGroups.length}`);
  console.log(`- Addon Items: ${addonItems.length}`);
  console.log(`- Modifiers: ${modifiers.length}`);
  console.log(`- Group Assignments: ${groupAssignments.length}`);
  console.log(`- Employees: ${employees.length}`);
  console.log(`- Customers: ${customers.length}`);
  console.log(`- Orders: ${orders.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
