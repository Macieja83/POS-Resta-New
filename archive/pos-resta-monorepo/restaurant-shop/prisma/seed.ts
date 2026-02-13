import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Pizza',
        slug: 'pizza',
        position: 1,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Burgery',
        slug: 'burgery',
        position: 2,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Sałatki',
        slug: 'salatki',
        position: 3,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Napoje',
        slug: 'napoje',
        position: 4,
        isActive: true,
      },
    }),
  ])

  console.log('✅ Categories created')

  // Create modifier groups
  const modifierGroups = await Promise.all([
    prisma.modifierGroup.create({
      data: {
        name: 'Rozmiar pizzy',
        minSelect: 1,
        maxSelect: 1,
        required: true,
        items: {
          create: [
            { name: 'Mała (30cm)', price: 0 },
            { name: 'Średnia (35cm)', price: 5 },
            { name: 'Duża (40cm)', price: 10 },
          ],
        },
      },
    }),
    prisma.modifierGroup.create({
      data: {
        name: 'Dodatki do pizzy',
        minSelect: 0,
        maxSelect: 0,
        required: false,
        items: {
          create: [
            { name: 'Extra ser', price: 3 },
            { name: 'Extra mięso', price: 5 },
            { name: 'Dodatkowe warzywa', price: 2 },
          ],
        },
      },
    }),
    prisma.modifierGroup.create({
      data: {
        name: 'Rozmiar burgera',
        minSelect: 1,
        maxSelect: 1,
        required: true,
        items: {
          create: [
            { name: 'Standard', price: 0 },
            { name: 'Duży', price: 4 },
          ],
        },
      },
    }),
  ])

  console.log('✅ Modifier groups created')

  // Create products
  const pizzaCategory = categories[0]
  const burgerCategory = categories[1]
  const saladCategory = categories[2]
  const drinkCategory = categories[3]

  const products = await Promise.all([
    // Pizza products
    prisma.product.create({
      data: {
        name: 'Margherita',
        slug: 'pizza-margherita',
        description: 'Klasyczna pizza z pomidorami, mozzarellą i bazylią',
        imageUrl: '/images/pizza-margherita.jpg',
        vatRate: 0.23,
        isActive: true,
        categoryId: pizzaCategory.id,
        prepTimeMin: 15,
        allergens: ['gluten', 'laktoza'],
        variants: {
          create: [
            { name: 'Mała', price: 25.99, isActive: true },
            { name: 'Średnia', price: 32.99, isActive: true },
            { name: 'Duża', price: 39.99, isActive: true },
          ],
        },
        modifiers: {
          connect: [
            { id: modifierGroups[0].id },
            { id: modifierGroups[1].id },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Pepperoni',
        slug: 'pizza-pepperoni',
        description: 'Pizza z salami pepperoni i mozzarellą',
        imageUrl: '/images/pizza-pepperoni.jpg',
        vatRate: 0.23,
        isActive: true,
        categoryId: pizzaCategory.id,
        prepTimeMin: 18,
        allergens: ['gluten', 'laktoza'],
        variants: {
          create: [
            { name: 'Mała', price: 28.99, isActive: true },
            { name: 'Średnia', price: 35.99, isActive: true },
            { name: 'Duża', price: 42.99, isActive: true },
          ],
        },
        modifiers: {
          connect: [
            { id: modifierGroups[0].id },
            { id: modifierGroups[1].id },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Quattro Stagioni',
        slug: 'pizza-quattro-stagioni',
        description: 'Pizza z szynką, pieczarkami, karczochami i oliwkami',
        imageUrl: '/images/pizza-quattro-stagioni.jpg',
        vatRate: 0.23,
        isActive: true,
        categoryId: pizzaCategory.id,
        prepTimeMin: 20,
        allergens: ['gluten', 'laktoza'],
        variants: {
          create: [
            { name: 'Mała', price: 32.99, isActive: true },
            { name: 'Średnia', price: 39.99, isActive: true },
            { name: 'Duża', price: 46.99, isActive: true },
          ],
        },
        modifiers: {
          connect: [
            { id: modifierGroups[0].id },
            { id: modifierGroups[1].id },
          ],
        },
      },
    }),

    // Burger products
    prisma.product.create({
      data: {
        name: 'Classic Burger',
        slug: 'classic-burger',
        description: 'Klasyczny burger z wołowiną, sałatą, pomidorem i cebulą',
        imageUrl: '/images/classic-burger.jpg',
        vatRate: 0.23,
        isActive: true,
        categoryId: burgerCategory.id,
        prepTimeMin: 12,
        allergens: ['gluten', 'jaja'],
        variants: {
          create: [
            { name: 'Standard', price: 24.99, isActive: true },
            { name: 'Duży', price: 28.99, isActive: true },
          ],
        },
        modifiers: {
          connect: [{ id: modifierGroups[2].id }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cheese Burger',
        slug: 'cheese-burger',
        description: 'Burger z wołowiną, serem cheddar, sałatą i sosem BBQ',
        imageUrl: '/images/cheese-burger.jpg',
        vatRate: 0.23,
        isActive: true,
        categoryId: burgerCategory.id,
        prepTimeMin: 15,
        allergens: ['gluten', 'jaja', 'laktoza'],
        variants: {
          create: [
            { name: 'Standard', price: 26.99, isActive: true },
            { name: 'Duży', price: 30.99, isActive: true },
          ],
        },
        modifiers: {
          connect: [{ id: modifierGroups[2].id }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Chicken Burger',
        slug: 'chicken-burger',
        description: 'Burger z kurczakiem, sałatą, pomidorem i sosem czosnkowym',
        imageUrl: '/images/chicken-burger.jpg',
        vatRate: 0.23,
        isActive: true,
        categoryId: burgerCategory.id,
        prepTimeMin: 14,
        allergens: ['gluten', 'jaja'],
        variants: {
          create: [
            { name: 'Standard', price: 22.99, isActive: true },
            { name: 'Duży', price: 26.99, isActive: true },
          ],
        },
        modifiers: {
          connect: [{ id: modifierGroups[2].id }],
        },
      },
    }),

    // Salad products
    prisma.product.create({
      data: {
        name: 'Sałatka Cezar',
        slug: 'salatka-cezar',
        description: 'Sałatka z rukolą, parmezanem, grzankami i sosem cezar',
        imageUrl: '/images/salatka-cezar.jpg',
        vatRate: 0.08,
        isActive: true,
        categoryId: saladCategory.id,
        prepTimeMin: 8,
        allergens: ['gluten', 'jaja', 'laktoza'],
        variants: {
          create: [{ name: 'Standard', price: 18.99, isActive: true }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sałatka Grecka',
        slug: 'salatka-grecka',
        description: 'Sałatka z pomidorami, ogórkami, oliwkami i fetą',
        imageUrl: '/images/salatka-grecka.jpg',
        vatRate: 0.08,
        isActive: true,
        categoryId: saladCategory.id,
        prepTimeMin: 6,
        allergens: ['laktoza'],
        variants: {
          create: [{ name: 'Standard', price: 16.99, isActive: true }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sałatka z Kurczakiem',
        slug: 'salatka-z-kurczakiem',
        description: 'Sałatka z grillowanym kurczakiem, warzywami i sosem jogurtowym',
        imageUrl: '/images/salatka-z-kurczakiem.jpg',
        vatRate: 0.08,
        isActive: true,
        categoryId: saladCategory.id,
        prepTimeMin: 10,
        allergens: ['laktoza'],
        variants: {
          create: [{ name: 'Standard', price: 20.99, isActive: true }],
        },
      },
    }),

    // Drink products
    prisma.product.create({
      data: {
        name: 'Coca-Cola',
        slug: 'coca-cola',
        description: 'Coca-Cola 0.33L',
        imageUrl: '/images/coca-cola.jpg',
        vatRate: 0.23,
        isActive: true,
        categoryId: drinkCategory.id,
        prepTimeMin: 1,
        allergens: [],
        variants: {
          create: [{ name: '0.33L', price: 4.99, isActive: true }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Woda mineralna',
        slug: 'woda-mineralna',
        description: 'Woda mineralna niegazowana 0.5L',
        imageUrl: '/images/woda-mineralna.jpg',
        vatRate: 0.08,
        isActive: true,
        categoryId: drinkCategory.id,
        prepTimeMin: 1,
        allergens: [],
        variants: {
          create: [{ name: '0.5L', price: 3.99, isActive: true }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sok pomarańczowy',
        slug: 'sok-pomaranczowy',
        description: 'Sok pomarańczowy 100% 0.25L',
        imageUrl: '/images/sok-pomaranczowy.jpg',
        vatRate: 0.08,
        isActive: true,
        categoryId: drinkCategory.id,
        prepTimeMin: 1,
        allergens: [],
        variants: {
          create: [{ name: '0.25L', price: 5.99, isActive: true }],
        },
      },
    }),
  ])

  console.log('✅ Products created')

  // Create delivery zone
  await prisma.deliveryZone.create({
    data: {
      name: 'Gdańsk - Centrum',
      radiusKm: 5.0,
      centerLat: 54.3520, // Gdańsk coordinates
      centerLng: 18.6466,
      fee: 9.99,
      minCart: 0,
      freeOver: 120.0,
      isActive: true,
    },
  })

  console.log('✅ Delivery zone created')

  // Create opening hours (Monday to Sunday, 11:00-22:00)
  const weekdays = [1, 2, 3, 4, 5, 6, 0] // Monday to Sunday
  await Promise.all(
    weekdays.map((weekday) =>
      prisma.openingHour.create({
        data: {
          weekday,
          openAt: '11:00',
          closeAt: '22:00',
          isClosed: false,
        },
      })
    )
  )

  console.log('✅ Opening hours created')

  // Create coupon
  await prisma.coupon.create({
    data: {
      code: 'WITAJ10',
      percentOff: 10,
      active: true,
      validFrom: new Date(),
      validTo: new Date('2024-12-31'),
      minCart: 50.0,
    },
  })

  console.log('✅ Coupon created')

  console.log('🎉 Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
