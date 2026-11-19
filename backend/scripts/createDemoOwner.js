import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config({ path: new URL('../.env', import.meta.url) });

async function createDemoOwner() {
  const name = process.env.DEMO_OWNER_NAME || 'Demo Owner';
  const email = process.env.DEMO_OWNER_EMAIL;
  const phone = process.env.DEMO_OWNER_PHONE || '+91 90000 11111';
  const password = process.env.DEMO_OWNER_PASSWORD;

  if (!email || !password) {
    console.error('Missing required environment variables: DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('DEMO_OWNER_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    if (existing.role !== 'demo_owner') {
      console.error(`Account ${existing.email} already exists with role '${existing.role}'. Aborting.`);
      await disconnectDB();
      process.exit(1);
    }
    console.log(`Demo owner account already exists for ${existing.email}. No duplicate created.`);
    await disconnectDB();
    process.exit(0);
  }

  const demoOwner = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    password,
    role: 'demo_owner',
    isSeeded: false,
  });

  console.log(`Demo owner account created: ${demoOwner.email} (${demoOwner._id})`);
  await disconnectDB();
  process.exit(0);
}

createDemoOwner().catch((err) => {
  console.error('Failed to create demo owner:', err.message);
  process.exit(1);
});
