import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config({ path: new URL('../.env', import.meta.url) });

async function createInitialOwner() {
  const name = process.env.INITIAL_OWNER_NAME;
  const email = process.env.INITIAL_OWNER_EMAIL;
  const phone = process.env.INITIAL_OWNER_PHONE;
  const password = process.env.INITIAL_OWNER_PASSWORD;

  if (!name || !email || !phone || !password) {
    console.error(
      'Missing required environment variables: INITIAL_OWNER_NAME, INITIAL_OWNER_EMAIL, INITIAL_OWNER_PHONE, INITIAL_OWNER_PASSWORD'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('INITIAL_OWNER_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    console.log(`Owner account already exists for ${existing.email}. No changes made.`);
    await disconnectDB();
    process.exit(0);
  }

  const owner = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    password,
    role: 'owner',
    isSeeded: false,
  });

  console.log(`Initial owner account created: ${owner.email} (${owner._id})`);
  await disconnectDB();
  process.exit(0);
}

createInitialOwner().catch((err) => {
  console.error('Failed to create initial owner:', err.message);
  process.exit(1);
});
