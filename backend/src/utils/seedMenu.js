require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');

const menuItemsData = [
  // --- STARTERS ---
  {
    name: 'Paneer Tikka Angara',
    description: 'Charcoal-grilled cottage cheese cubes marinated in Kashmiri red chili, hung curd, and stone-ground spices.',
    price: 290,
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
    description: 'Crisp chicken wings glazed with hickory-smoked Kentucky BBQ glaze and toasted sesame seeds.',
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
    name: 'Crispy Corn & Water Chestnut',
    description: 'Golden sweet kernels and crunchy water chestnuts tossed with scallions, garlic, and cracked pepper.',
    price: 240,
    category: 'Starters',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isAvailable: true,
    preparationTime: 12,
    spicyLevel: 1,
    rating: 4.7
  },
  {
    name: 'Dahi Ke Sholay Kebabs',
    description: 'Velvety hung curd kebabs stuffed with bell peppers, mint, and pomegranate pearls, crisped to perfection.',
    price: 270,
    category: 'Starters',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isAvailable: true,
    preparationTime: 14,
    spicyLevel: 0,
    rating: 4.9
  },
  {
    name: 'Amritsari Fish Tikka',
    description: 'River sole fillets coated in ajwain-scented gram flour batter, golden fried and served with radish dip.',
    price: 390,
    category: 'Starters',
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=60',
    isVeg: false,
    isAvailable: true,
    preparationTime: 16,
    spicyLevel: 2,
    rating: 4.8
  },
  {
    name: 'Tandoori Malai Soya Chaap',
    description: 'Juicy soya chaap steeped in cashew-cream paste, green cardamom, and grilled in earthen tandoor.',
    price: 260,
    category: 'Starters',
    imageUrl: 'https://images.unsplash.com/photo-1628294895950-9805252327bc?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isAvailable: true,
    preparationTime: 15,
    spicyLevel: 0,
    rating: 4.7
  },

  // --- MAINS ---
  {
    name: 'Signature Butter Chicken',
    description: 'Tandoori roasted boneless chicken simmered in rich velvety tomato makhani with cashew butter.',
    price: 430,
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
    description: 'Slow-simmered black urad lentils infused with smoked butter and cream, cooked overnight over charcoal.',
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
    name: 'Paneer Lababdar',
    description: 'Fresh malai paneer cooked with caramelized onion gravy, crushed coriander seeds, and ginger juliennes.',
    price: 350,
    category: 'Mains',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isAvailable: true,
    preparationTime: 18,
    spicyLevel: 1,
    rating: 4.8
  },
  {
    name: 'Awadhi Dum Mutton Biryani',
    description: 'Tender baby goat cuts slow cooked on dum with aged fragrant basmati rice, saffron, and fried onions.',
    price: 490,
    category: 'Mains',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60',
    isVeg: false,
    isAvailable: true,
    preparationTime: 22,
    spicyLevel: 2,
    rating: 4.9
  },
  {
    name: 'Subz Dum Handi Biryani',
    description: 'Seasonal farm vegetables, paneer chunks, and aromatic rice cooked with kewra water and mint in clay handi.',
    price: 340,
    category: 'Mains',
    imageUrl: 'https://images.unsplash.com/photo-1642821373181-696a54913e9a?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isAvailable: true,
    preparationTime: 20,
    spicyLevel: 1,
    rating: 4.7
  },
  {
    name: 'Creamy Truffle Fettuccine Alfredo',
    description: 'Handmade fettuccine pasta in rich parmesan garlic cream sauce drizzled with imported white truffle oil.',
    price: 390,
    category: 'Mains',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isAvailable: true,
    preparationTime: 18,
    spicyLevel: 0,
    rating: 4.8
  },

  // --- CHEF'S SPECIALS ---
  {
    name: 'Woodfired Burrata Margherita Pizza',
    description: '72-hour cold fermented sourdough base, San Marzano marinara, creamy fresh burrata ball, and basil.',
    price: 520,
    category: "Chef's Specials",
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isAvailable: true,
    preparationTime: 20,
    spicyLevel: 0,
    rating: 4.9
  },
  {
    name: 'Smoked Lamb Galouti Sliders',
    description: 'Ultra-tender melt-in-mouth Awadhi spiced lamb patties in toasted brioche buns with mint labneh.',
    price: 460,
    category: "Chef's Specials",
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=60',
    isVeg: false,
    isAvailable: true,
    preparationTime: 18,
    spicyLevel: 2,
    rating: 4.9
  },
  {
    name: 'Wild Forest Truffle Risotto',
    description: 'Slow-stirred Carnaroli rice, porcini & shiitake mushrooms, aged Grana Padano, and thyme butter.',
    price: 470,
    category: "Chef's Specials",
    imageUrl: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isAvailable: true,
    preparationTime: 22,
    spicyLevel: 0,
    rating: 4.8
  },

  // --- BEVERAGES ---
  {
    name: 'Alphonso Mango Mint Cooler',
    description: 'Chilled Ratnagiri Alphonso mango pulp blended with garden mint, fresh lime juice, and sparkling soda.',
    price: 180,
    category: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isAvailable: true,
    preparationTime: 6,
    spicyLevel: 0,
    rating: 4.9
  },
  {
    name: 'Artisan Cold Brew Coffee',
    description: 'Single-estate Arabica steeped for 18 hours in cold filtered water, poured over handcrafted ice sphere.',
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
    name: 'Virgin Passionfruit Mojito',
    description: 'Muddled fresh lime wedges, wild mint sprigs, tangy passionfruit puree, topped with fizzy club soda.',
    price: 170,
    category: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isAvailable: true,
    preparationTime: 6,
    spicyLevel: 0,
    rating: 4.7
  },
  {
    name: 'Masala Shikanji Soda',
    description: 'Classic Indian spiced lemonade with roasted cumin, rock salt, mint extract, and splash of soda.',
    price: 140,
    category: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isAvailable: true,
    preparationTime: 5,
    spicyLevel: 0,
    rating: 4.6
  },

  // --- DESSERTS ---
  {
    name: 'Sizzling Belgian Brownie Platter',
    description: 'Decadent dark chocolate walnut brownie served on hot cast-iron with Madagascar vanilla gelato & fudge.',
    price: 270,
    category: 'Desserts',
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isAvailable: true,
    preparationTime: 10,
    spicyLevel: 0,
    rating: 5.0
  },
  {
    name: 'Kesar Pista Rasmalai (2 Pcs)',
    description: 'Delicate poached cottage cheese patties floating in chilled saffron-cardamom clotted milk broth with pistachios.',
    price: 220,
    category: 'Desserts',
    imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isAvailable: true,
    preparationTime: 5,
    spicyLevel: 0,
    rating: 4.9
  },
  {
    name: 'Blueberry Baked Cheesecake',
    description: 'Rich New York style cream cheese slice crowned with glossy wild Canadian blueberry compote.',
    price: 280,
    category: 'Desserts',
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isAvailable: true,
    preparationTime: 5,
    spicyLevel: 0,
    rating: 4.8
  }
];

const seedMenuItems = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas (smartserve)');

    // Replace menu items
    await MenuItem.deleteMany({});
    console.log('🧹 Cleared existing menu items');

    const inserted = await MenuItem.insertMany(menuItemsData);
    console.log(`🎉 Successfully seeded ${inserted.length} gourmet dishes across ${new Set(menuItemsData.map(i => i.category)).size} categories!`);

    inserted.forEach((item, index) => {
      console.log(`   ${index + 1}. [${item.category}] ${item.name} - ₹${item.price} (${item.isVeg ? 'VEG' : 'NON-VEG'})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding menu items:', error.message);
    process.exit(1);
  }
};

seedMenuItems();
