require('dotenv').config();
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const User = require('../models/User');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

const seedDatabase = async () => {
  const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartserve';
  console.log(`🌱 Connecting to MongoDB Atlas for seeding: ${connUri}...`);

  try {
    await mongoose.connect(connUri);
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing data
    await User.deleteMany({});
    await Table.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    console.log('🧹 Cleared existing collections');

    // 1. Seed Users (Admin & Staff)
    const adminUser = await User.create({
      name: 'Restaurant Manager',
      email: 'admin@smartserve.com',
      password: 'admin123456',
      role: 'admin'
    });

    const staffUser = await User.create({
      name: 'Head Chef Marco',
      email: 'staff@smartserve.com',
      password: 'staff123456',
      role: 'staff'
    });

    console.log('👤 Users created:');
    console.log(`   Admin: admin@smartserve.com / admin123456`);
    console.log(`   Staff: staff@smartserve.com / staff123456`);

    // 2. Seed Tables with QR Codes
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const tablesToCreate = [
      { tableNumber: 1, capacity: 2, status: 'available' },
      { tableNumber: 2, capacity: 4, status: 'available' },
      { tableNumber: 3, capacity: 4, status: 'available' },
      { tableNumber: 4, capacity: 6, status: 'available' },
      { tableNumber: 5, capacity: 2, status: 'available' },
      { tableNumber: 6, capacity: 8, status: 'available' },
      { tableNumber: 7, capacity: 4, status: 'available' },
      { tableNumber: 8, capacity: 4, status: 'available' }
    ];

    for (const t of tablesToCreate) {
      const tableUrl = `${frontendBaseUrl}/table/${t.tableNumber}`;
      const qrCodeDataUrl = await QRCode.toDataURL(tableUrl, {
        width: 360,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });

      await Table.create({
        ...t,
        tableUrl,
        qrCodeDataUrl
      });
    }
    console.log(`🍽️  Created ${tablesToCreate.length} restaurant tables with QR codes`);

    // 3. Seed Menu Items
    const menuItems = [
      // Starters
      {
        name: 'Paneer Tikka Angara',
        description: 'Tender cottage cheese cubes marinated in Kashmiri chili and aromatic spices, roasted in clay oven.',
        price: 280,
        category: 'Starters',
        imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true,
        preparationTime: 15,
        spicyLevel: 2,
        rating: 4.9
      },
      {
        name: 'Smoky BBQ Chicken Wings',
        description: 'Crispy chicken wings glazed with hickory smoked house BBQ sauce and toasted sesame seeds.',
        price: 340,
        category: 'Starters',
        imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=60',
        isVeg: false,
        isAvailable: true,
        preparationTime: 15,
        spicyLevel: 1,
        rating: 4.8
      },
      {
        name: 'Crispy Corn & Water Chestnut Salt-Pepper',
        description: 'Golden sweet corn tossed with scallions, fresh garlic, crushed peppers, and oriental spices.',
        price: 240,
        category: 'Starters',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true,
        preparationTime: 12,
        spicyLevel: 1,
        rating: 4.7
      },

      // Mains
      {
        name: 'Signature Butter Chicken',
        description: 'Succulent tandoori chicken cooked in rich velvety satin tomato, butter, and cashew gravy.',
        price: 420,
        category: 'Mains',
        imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&auto=format&fit=crop&q=60',
        isVeg: false,
        isAvailable: true,
        preparationTime: 20,
        spicyLevel: 1,
        rating: 5.0
      },
      {
        name: 'Dal Makhani Bukhara',
        description: 'Black lentils slow cooked overnight over charcoal fire with churned butter and fresh cream.',
        price: 320,
        category: 'Mains',
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true,
        preparationTime: 15,
        spicyLevel: 0,
        rating: 4.9
      },
      {
        name: 'Awadhi Dum Biryani',
        description: 'Fragrant aged basmati rice layered with spiced marinated vegetables/paneer, saffron, and fried onions.',
        price: 360,
        category: 'Mains',
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true,
        preparationTime: 22,
        spicyLevel: 2,
        rating: 4.8
      },
      {
        name: 'Creamy Truffle Fettuccine Alfredo',
        description: 'Artisanal pasta tossed in white parmesan garlic emulsion infused with black truffle oil.',
        price: 390,
        category: 'Mains',
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=500&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true,
        preparationTime: 18,
        spicyLevel: 0,
        rating: 4.7
      },

      // Chef's Specials
      {
        name: 'Woodfired Burrata Margherita Pizza',
        description: 'Hand-stretched sourdough pizza, San Marzano tomato sauce, fresh creamy burrata, and basil.',
        price: 490,
        category: "Chef's Specials",
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true,
        preparationTime: 20,
        spicyLevel: 0,
        rating: 4.9
      },
      {
        name: 'Tender Lamb Galouti Sliders',
        description: 'Melt-in-mouth spiced minced lamb patties served on toasted brioche buns with mint labneh.',
        price: 460,
        category: "Chef's Specials",
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=60',
        isVeg: false,
        isAvailable: true,
        preparationTime: 20,
        spicyLevel: 2,
        rating: 4.8
      },

      // Beverages
      {
        name: 'Fresh Alphonso Mango Mint Cooler',
        description: 'Crushed sweet Ratnagiri mango puree shaken with garden mint, soda, and lime juice.',
        price: 180,
        category: 'Beverages',
        imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true,
        preparationTime: 8,
        spicyLevel: 0,
        rating: 4.9
      },
      {
        name: 'Artisan Cold Brew Coffee',
        description: 'Single origin Arabica beans steeped for 18 hours, served over crystal clear ice rock.',
        price: 190,
        category: 'Beverages',
        imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true,
        preparationTime: 5,
        spicyLevel: 0,
        rating: 4.8
      },
      {
        name: 'Masala Shikanji Soda',
        description: 'Traditional spiced Indian street lemonade with black salt, cumin, and mint sprigs.',
        price: 140,
        category: 'Beverages',
        imageUrl: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true,
        preparationTime: 5,
        spicyLevel: 0,
        rating: 4.6
      },

      // Desserts
      {
        name: 'Sizzling Belgian Chocolate Brownie',
        description: 'Warm walnut fudge brownie served on a cast iron skillet with vanilla gelato and hot ganache.',
        price: 260,
        category: 'Desserts',
        imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true,
        preparationTime: 10,
        spicyLevel: 0,
        rating: 5.0
      },
      {
        name: 'Kesar Pista Rasmalai',
        description: 'Soft cottage cheese dumplings poached in saffron cardamom milk broth garnished with pistachios.',
        price: 220,
        category: 'Desserts',
        imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop&q=60',
        isVeg: true,
        isAvailable: true,
        preparationTime: 5,
        spicyLevel: 0,
        rating: 4.8
      }
    ];

    const createdItems = await MenuItem.insertMany(menuItems);
    console.log(`🍛 Created ${createdItems.length} gourmet menu items`);

    // 4. Seed Initial Sample Orders for live analytics
    const sampleOrders = [
      {
        orderNumber: 'ORD-7102',
        tableNumber: 3,
        items: [
          {
            menuItem: createdItems[0]._id,
            name: createdItems[0].name,
            price: createdItems[0].price,
            quantity: 2,
            isVeg: true,
            specialInstructions: 'Make it extra crisp please'
          },
          {
            menuItem: createdItems[9]._id,
            name: createdItems[9].name,
            price: createdItems[9].price,
            quantity: 2,
            isVeg: true,
            specialInstructions: 'Less ice'
          }
        ],
        subtotal: 560 + 360,
        taxAmount: Math.round((560 + 360) * 0.05),
        totalAmount: (560 + 360) + Math.round((560 + 360) * 0.05),
        orderStatus: 'Preparing',
        paymentStatus: 'Paid',
        paymentMethod: 'Razorpay',
        customerNotes: 'Celebrating an anniversary!',
        razorpayPaymentId: 'pay_sample_test_101',
        estimatedPrepTime: 15
      },
      {
        orderNumber: 'ORD-5481',
        tableNumber: 2,
        items: [
          {
            menuItem: createdItems[3]._id,
            name: createdItems[3].name,
            price: createdItems[3].price,
            quantity: 1,
            isVeg: false,
            specialInstructions: 'Medium spicy'
          },
          {
            menuItem: createdItems[4]._id,
            name: createdItems[4].name,
            price: createdItems[4].price,
            quantity: 1,
            isVeg: true,
            specialInstructions: ''
          }
        ],
        subtotal: 420 + 320,
        taxAmount: Math.round((420 + 320) * 0.05),
        totalAmount: (420 + 320) + Math.round((420 + 320) * 0.05),
        orderStatus: 'Pending',
        paymentStatus: 'Pending',
        paymentMethod: 'Counter',
        customerNotes: '',
        estimatedPrepTime: 20
      }
    ];

    await Order.insertMany(sampleOrders);
    console.log(`📦 Seeded ${sampleOrders.length} active demo orders`);

    console.log('🎉 Seeding successfully completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
