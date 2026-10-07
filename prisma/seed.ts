import { PrismaClient } from "@prisma/client";
import { addMinutes, addHours } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clean old records
  await prisma.payment.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.closure.deleteMany();
  await prisma.cafeSetting.deleteMany();

  // 1. Cafe Settings
  const settings = await prisma.cafeSetting.create({
    data: {
      name: "The Roasted Bean Café & Roastery",
      tagline: "Artisanal Brews • Woodfire Eats • Warm Ambiance",
      description:
        "Specialty micro-roastery and gourmet kitchen located in the heart of Bangalore. Serving single-origin brews, freshly baked artisan pastries, and handcrafted European-fusion dining.",
      address: "104 Indiranagar 100ft Road, Bangalore, Karnataka 560038",
      phone: "+91 98765 43210",
      email: "hello@theroastedbean.com",
      openingTime: "08:00",
      closingTime: "23:00",
      businessDayCutoffHour: 4,
      timezone: "Asia/Kolkata",
      defaultReservationDurationMinutes: 90,
      bufferBeforeMinutes: 15,
      bufferAfterMinutes: 15,
      gracePeriodMinutes: 15,
      taxRatePercent: 5.0,
      serviceChargePercent: 5.0,
      currencySymbol: "₹",
    },
  });
  console.log("✅ Cafe settings created:", settings.name);

  // 2. Tables
  const tables = await Promise.all([
    prisma.table.create({
      data: {
        tableNumber: "T-01",
        name: "Garden Corner Booth",
        capacityMin: 2,
        capacityMax: 4,
        section: "INDOOR",
        description: "Cozy plush booth with ambient pendant lighting and green planters.",
        photoUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80",
      },
    }),
    prisma.table.create({
      data: {
        tableNumber: "T-02",
        name: "Espresso Bar High Top",
        capacityMin: 1,
        capacityMax: 2,
        section: "INDOOR",
        description: "Front-row seats next to the La Marzocco espresso bar and slow-drip station.",
        photoUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
      },
    }),
    prisma.table.create({
      data: {
        tableNumber: "T-03",
        name: "Sunlit Courtyard Patio",
        capacityMin: 2,
        capacityMax: 4,
        section: "OUTDOOR",
        description: "Breezy open-air courtyard shaded by jacaranda trees and fairy lights.",
        photoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
      },
    }),
    prisma.table.create({
      data: {
        tableNumber: "T-04",
        name: "Pergola Long Table",
        capacityMin: 4,
        capacityMax: 6,
        section: "OUTDOOR",
        description: "Spacious wooden table under the pergola, ideal for family brunches.",
        photoUrl: "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=800&auto=format&fit=crop&q=80",
      },
    }),
    prisma.table.create({
      data: {
        tableNumber: "T-05",
        name: "Rooftop Terrace Vista",
        capacityMin: 2,
        capacityMax: 4,
        section: "TERRACE",
        description: "Elevated rooftop seating overlooking the skyline, perfect for sunset dates.",
        photoUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop&q=80",
      },
    }),
    prisma.table.create({
      data: {
        tableNumber: "T-06",
        name: "Private Tasting Alcove",
        capacityMin: 6,
        capacityMax: 10,
        section: "INDOOR",
        description: "Acoustically treated private alcove for business discussions and group dining.",
        photoUrl: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&auto=format&fit=crop&q=80",
      },
    }),
    prisma.table.create({
      data: {
        tableNumber: "T-07",
        name: "Balcony Bloom Table",
        capacityMin: 2,
        capacityMax: 3,
        section: "BALCONY",
        description: "Intimate two-seater on the first-floor balcony overlooking the garden.",
        photoUrl: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&auto=format&fit=crop&q=80",
      },
    }),
    prisma.table.create({
      data: {
        tableNumber: "T-08",
        name: "Bistro Heritage Table",
        capacityMin: 4,
        capacityMax: 8,
        section: "INDOOR",
        description: "Classic marble-top bistro table with vintage Parisian rattan armchairs.",
        photoUrl: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&auto=format&fit=crop&q=80",
      },
    }),
  ]);
  console.log(`✅ Created ${tables.length} tables.`);

  // 3. Menu Categories
  const catCoffee = await prisma.category.create({
    data: { name: "Specialty Coffee & Brews", sortOrder: 1, icon: "Coffee" },
  });
  const catTeas = await prisma.category.create({
    data: { name: "Artisanal Teas & Coolers", sortOrder: 2, icon: "CupSoda" },
  });
  const catBreakfast = await prisma.category.create({
    data: { name: "All-Day Breakfast & Brunch", sortOrder: 3, icon: "EggFried" },
  });
  const catMains = await prisma.category.create({
    data: { name: "Gourmet Sandwiches & Mains", sortOrder: 4, icon: "Utensils" },
  });
  const catDesserts = await prisma.category.create({
    data: { name: "Pastries & Artisanal Desserts", sortOrder: 5, icon: "Cake" },
  });

  // 4. Menu Items
  const menuItems = await Promise.all([
    // Coffee
    prisma.menuItem.create({
      data: {
        categoryId: catCoffee.id,
        name: "Single-Origin Pour Over (Coorg Peaberry)",
        description: "Slow-dripped filter coffee with notes of citrus, dark caramel, and jasmine floral notes.",
        price: 240,
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        prepTimeMinutes: 6,
        photoUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
      },
    }),
    prisma.menuItem.create({
      data: {
        categoryId: catCoffee.id,
        name: "Velvet Spanish Latte",
        description: "Double espresso pulled over condensed milk and silky micro-foamed whole milk with cinnamon dusting.",
        price: 260,
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: true,
        prepTimeMinutes: 5,
        photoUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80",
      },
    }),
    prisma.menuItem.create({
      data: {
        categoryId: catCoffee.id,
        name: "Cold Brew Tonic with Orange Zest",
        description: "18-hour cold steeped Arabica charged with botanical tonic water and flamed citrus peel.",
        price: 280,
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        prepTimeMinutes: 4,
        photoUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80",
      },
    }),
    prisma.menuItem.create({
      data: {
        categoryId: catCoffee.id,
        name: "Salted Caramel Oat Cortado",
        description: "Equal parts intense double ristretto and steamed creamy oat milk infused with sea-salt caramel.",
        price: 250,
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        prepTimeMinutes: 5,
        photoUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80",
      },
    }),

    // Teas & Coolers
    prisma.menuItem.create({
      data: {
        categoryId: catTeas.id,
        name: "Yuzu & Mint Sparkling Cooler",
        description: "Japanese citrus extract, crushed mountain mint, sparkling water, and raw cane sugar syrup.",
        price: 220,
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        prepTimeMinutes: 4,
        photoUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80",
      },
    }),
    prisma.menuItem.create({
      data: {
        categoryId: catTeas.id,
        name: "Hibiscus Rose Petal Cold Tea",
        description: "Tangy dried hibiscus flowers steeped with wild organic rose petals and fresh pomegranate arils.",
        price: 210,
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        prepTimeMinutes: 4,
        photoUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80",
      },
    }),

    // Breakfast & Brunch
    prisma.menuItem.create({
      data: {
        categoryId: catBreakfast.id,
        name: "Truffle Mushroom Scrambled Brioche",
        description: "Creamy cage-free eggs with sautéed wild portobello mushrooms, black truffle oil, on toasted brioche.",
        price: 390,
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        prepTimeMinutes: 12,
        photoUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80",
      },
    }),
    prisma.menuItem.create({
      data: {
        categoryId: catBreakfast.id,
        name: "Hass Avocado & Burrata Sourdough",
        description: "Charred sourdough topped with chunky crushed avocado, fresh artisanal burrata, cherry tomatoes, and balsamic glaze.",
        price: 440,
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        prepTimeMinutes: 10,
        photoUrl: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=600&auto=format&fit=crop&q=80",
      },
    }),
    prisma.menuItem.create({
      data: {
        categoryId: catBreakfast.id,
        name: "Fluffy Japanese Ricotta Pancakes",
        description: "Soufflé-style pancakes served with whipped honeycomb butter, pure maple syrup, and seasonal berries.",
        price: 360,
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        prepTimeMinutes: 15,
        photoUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop&q=80",
      },
    }),

    // Gourmet Mains & Sandwiches
    prisma.menuItem.create({
      data: {
        categoryId: catMains.id,
        name: "Smoked Herbed Chicken Panini",
        description: "Hickory-smoked chicken breast, roasted bell peppers, aged white cheddar, and house basil pesto on focaccia.",
        price: 420,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        prepTimeMinutes: 14,
        photoUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80",
      },
    }),
    prisma.menuItem.create({
      data: {
        categoryId: catMains.id,
        name: "Wild Forest Mushroom & Truffle Fettuccine",
        description: "Handmade egg pasta tossed in a rich parmesan truffle cream reduction with thyme roasted mushrooms.",
        price: 480,
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        prepTimeMinutes: 15,
        photoUrl: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&auto=format&fit=crop&q=80",
      },
    }),
    prisma.menuItem.create({
      data: {
        categoryId: catMains.id,
        name: "Grilled Halloumi & Mediterranean Burger",
        description: "Crispy grilled halloumi patty with charred aubergine, sun-dried tomato relish, arugula, and hand-cut truffle fries.",
        price: 410,
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        prepTimeMinutes: 14,
        photoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
      },
    }),

    // Desserts
    prisma.menuItem.create({
      data: {
        categoryId: catDesserts.id,
        name: "San Sebastián Burnt Basque Cheesecake",
        description: "Ultra-creamy Spanish cheesecake with caramelized golden crust, accompanied by dark berry compote.",
        price: 320,
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: true,
        prepTimeMinutes: 3,
        photoUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=80",
      },
    }),
    prisma.menuItem.create({
      data: {
        categoryId: catDesserts.id,
        name: "Belgian Dark Chocolate Molten Fondant",
        description: "Warm 70% Callebaut dark chocolate cake with flowing molten core and Madagascan vanilla bean gelato.",
        price: 340,
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        prepTimeMinutes: 10,
        photoUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80",
      },
    }),
  ]);
  console.log(`✅ Created ${menuItems.length} menu items.`);

  // 5. Active Sample Visit on Table T-01 (Ready for Live Demo)
  const t01 = tables[0];
  const now = new Date();
  
  const sampleVisit = await prisma.visit.create({
    data: {
      visitCode: "7492", // Demo visit code
      tableId: t01.id,
      guestName: "Arjun Verma",
      guestCount: 2,
      status: "ACTIVE",
      checkedInAt: new Date(now.getTime() - 25 * 60 * 1000), // 25 mins ago
    },
  });

  // Sample Order 1 (Round 1: Coffees & Starters - Served)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: "ORD-9101",
      visitId: sampleVisit.id,
      tableId: t01.id,
      round: 1,
      status: "SERVED",
      placedAt: new Date(now.getTime() - 22 * 60 * 1000),
      acceptedAt: new Date(now.getTime() - 20 * 60 * 1000),
      servedAt: new Date(now.getTime() - 12 * 60 * 1000),
      items: {
        create: [
          {
            menuItemId: menuItems[1].id, // Spanish latte
            itemNameSnapshot: menuItems[1].name,
            unitPriceSnapshot: menuItems[1].price,
            quantity: 2,
            subtotalSnapshot: menuItems[1].price * 2,
            customInstructions: "Extra oat milk, less sweet please",
          },
          {
            menuItemId: menuItems[7].id, // Avocado sourdough
            itemNameSnapshot: menuItems[7].name,
            unitPriceSnapshot: menuItems[7].price,
            quantity: 1,
            subtotalSnapshot: menuItems[7].price,
          },
        ],
      },
    },
  });

  // Sample Order 2 (Round 2: Mains - Preparing)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: "ORD-9102",
      visitId: sampleVisit.id,
      tableId: t01.id,
      round: 2,
      status: "PREPARING",
      placedAt: new Date(now.getTime() - 8 * 60 * 1000),
      acceptedAt: new Date(now.getTime() - 6 * 60 * 1000),
      items: {
        create: [
          {
            menuItemId: menuItems[9].id, // Chicken Panini
            itemNameSnapshot: menuItems[9].name,
            unitPriceSnapshot: menuItems[9].price,
            quantity: 1,
            subtotalSnapshot: menuItems[9].price,
            customInstructions: "Cut into 4 pieces",
          },
        ],
      },
    },
  });

  // Create Bill for Visit
  const subtotal = 260 * 2 + 440 + 420; // 1380
  const tax = subtotal * 0.05; // 69
  const serviceCharge = subtotal * 0.05; // 69
  const total = subtotal + tax + serviceCharge; // 1518

  await prisma.bill.create({
    data: {
      billNumber: "BILL-2026-0001",
      visitId: sampleVisit.id,
      tableId: t01.id,
      subtotal,
      taxRatePercent: 5.0,
      taxAmount: tax,
      serviceChargePercent: 5.0,
      serviceCharge,
      totalAmount: total,
      status: "UNPAID",
    },
  });

  console.log("✅ Created active sample visit with orders & bill on Table T-01 (Visit Code: 7492).");

  // 6. Upcoming Sample Reservations
  await prisma.reservation.create({
    data: {
      bookingReference: "RES-8319-K9A1",
      securityToken: "demo_token_priya_123",
      guestName: "Priya Sharma",
      guestPhone: "+91 99887 76655",
      guestEmail: "priya.sharma@example.com",
      guestCount: 4,
      occasion: "BIRTHDAY",
      specialRequest: "Can we have a quiet corner table with celebratory candle on dessert?",
      specialRequestApproved: false,
      status: "REQUESTED",
      requestedTableId: tables[2].id, // Table T-03
      tableId: tables[2].id,
      startDateTime: addHours(now, 2),
      endDateTime: addMinutes(addHours(now, 2), 90),
      durationMinutes: 90,
    },
  });

  await prisma.reservation.create({
    data: {
      bookingReference: "RES-4920-W3B8",
      securityToken: "demo_token_rohan_456",
      guestName: "Rohan & Meera",
      guestPhone: "+91 91234 56789",
      guestEmail: "rohan.meera@example.com",
      guestCount: 2,
      occasion: "ANNIVERSARY",
      specialRequest: "Window or terrace view requested.",
      specialRequestApproved: true,
      status: "CONFIRMED",
      requestedTableId: tables[4].id, // Table T-05 Terrace
      tableId: tables[4].id,
      startDateTime: addHours(now, 4),
      endDateTime: addMinutes(addHours(now, 4), 90),
      durationMinutes: 90,
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
