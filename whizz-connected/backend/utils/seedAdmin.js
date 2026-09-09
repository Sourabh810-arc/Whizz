// Run with: npm run seed:admin
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  await connectDB();
  const exists = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (exists) {
    console.log('Admin already exists');
    process.exit(0);
  }
  await User.create({
    name: process.env.ADMIN_NAME || 'Whizz Admin',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
  });
  console.log('✅ Admin user created:', process.env.ADMIN_EMAIL);
  process.exit(0);
})();
