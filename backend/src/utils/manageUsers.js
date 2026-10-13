require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas');

    const args = process.argv.slice(2);
    const action = args[0] || 'list';

    if (action === 'list') {
      const users = await User.find({}, { name: 1, email: 1, role: 1, createdAt: 1 });
      console.log('\n📋 Current registered accounts in database:');
      if (users.length === 0) {
        console.log('   (No users found in database)');
      } else {
        users.forEach((u, i) => {
          console.log(`   ${i + 1}. [${u.role.toUpperCase()}] ${u.name} - Email: ${u.email}`);
        });
      }
      console.log('\nTo set your real accounts, run:');
      console.log('node src/utils/manageUsers.js set-users <ownerEmail> <ownerPassword> <staffEmail> <staffPassword>');
      process.exit(0);
    }

    if (action === 'set-users') {
      const ownerEmail = args[1];
      const ownerPassword = args[2];
      const staffEmail = args[3];
      const staffPassword = args[4];

      if (!ownerEmail || !ownerPassword || !staffEmail || !staffPassword) {
        console.error('❌ Missing arguments! Usage:');
        console.error('node src/utils/manageUsers.js set-users <ownerEmail> <ownerPassword> <staffEmail> <staffPassword>');
        process.exit(1);
      }

      // 1. Delete all existing users (removes any dummy accounts)
      await User.deleteMany({});
      console.log('🧹 Removed all previous accounts.');

      // 2. Create Owner (role: admin)
      const owner = await User.create({
        name: 'Restaurant Owner',
        email: ownerEmail.trim().toLowerCase(),
        password: ownerPassword,
        role: 'admin'
      });
      console.log(`👑 Created Owner: ${owner.email} (Role: admin)`);

      // 3. Create Staff (role: staff)
      const staff = await User.create({
        name: 'Kitchen Staff',
        email: staffEmail.trim().toLowerCase(),
        password: staffPassword,
        role: 'staff'
      });
      console.log(`👨‍🍳 Created Staff: ${staff.email} (Role: staff)`);

      console.log('\n🎉 Successfully updated! Exactly 2 accounts now exist in MongoDB Atlas.');
      process.exit(0);
    }

    console.log(`Unknown action "${action}". Use "list" or "set-users".`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
