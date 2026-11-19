import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Staff from '../models/Staff.js';
import Appointment from '../models/Appointment.js';
import Payment from '../models/Payment.js';
import Transaction from '../models/Transaction.js';
import Expense from '../models/Expense.js';
import WalkInProfile from '../models/WalkInProfile.js';
import Notification from '../models/Notification.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { getISTOffsetDateString } from '../utils/timezone.js';

dotenv.config({ path: new URL('../.env', import.meta.url) });

const CUSTOMER_NAMES = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@testclient.in', phone: '+91 98201 11201' },
  { name: 'Priya Patel', email: 'priya.patel@testclient.in', phone: '+91 98201 11202' },
  { name: 'Rohan Verma', email: 'rohan.verma@testclient.in', phone: '+91 98201 11203' },
  { name: 'Ananya Iyer', email: 'ananya.iyer@testclient.in', phone: '+91 98201 11204' },
  { name: 'Vikram Nair', email: 'vikram.nair@testclient.in', phone: '+91 98201 11205' },
  { name: 'Meera Krishnan', email: 'meera.k@testclient.in', phone: '+91 98201 11206' },
  { name: 'Siddharth Rao', email: 'siddharth.rao@testclient.in', phone: '+91 98201 11207' },
  { name: 'Kavya Deshmukh', email: 'kavya.d@testclient.in', phone: '+91 98201 11208' },
  { name: 'Aditya Kulkarni', email: 'aditya.k@testclient.in', phone: '+91 98201 11209' },
  { name: 'Neha Malhotra', email: 'neha.m@testclient.in', phone: '+91 98201 11210' },
  { name: 'Arjun Menon', email: 'arjun.menon@testclient.in', phone: '+91 98201 11211' },
  { name: 'Divya Joshi', email: 'divya.joshi@testclient.in', phone: '+91 98201 11212' },
  { name: 'Karan Kapoor', email: 'karan.kapoor@testclient.in', phone: '+91 98201 11213' },
  { name: 'Sneha Reddy', email: 'sneha.reddy@testclient.in', phone: '+91 98201 11214' },
  { name: 'Rahul Banerjee', email: 'rahul.b@testclient.in', phone: '+91 98201 11215' },
  { name: 'Pooja Choudhary', email: 'pooja.c@testclient.in', phone: '+91 98201 11216' },
  { name: 'Nikhil Sinha', email: 'nikhil.sinha@testclient.in', phone: '+91 98201 11217' },
  { name: 'Riya Sengupta', email: 'riya.s@testclient.in', phone: '+91 98201 11218' },
  { name: 'Varun Khanna', email: 'varun.khanna@testclient.in', phone: '+91 98201 11219' },
  { name: 'Ishita Bose', email: 'ishita.bose@testclient.in', phone: '+91 98201 11220' },
];

export async function cleanSeededData() {
  const results = await Promise.all([
    Notification.deleteMany({ isSeeded: true }),
    Transaction.deleteMany({ isSeeded: true }),
    Payment.deleteMany({ isSeeded: true }),
    Expense.deleteMany({ isSeeded: true }),
    Appointment.deleteMany({ isSeeded: true }),
    WalkInProfile.deleteMany({ isSeeded: true }),
    Service.deleteMany({ isSeeded: true }),
    Staff.deleteMany({ isSeeded: true }),
    User.deleteMany({ isSeeded: true }),
  ]);
  const totalDeleted = results.reduce((sum, r) => sum + (r.deletedCount || 0), 0);
  return { cleaned: true, totalDeleted };
}

export async function seedTestingDataset() {
  const existingSeeded = await Appointment.countDocuments({ isSeeded: true });
  if (existingSeeded > 0) {
    return {
      seeded: false,
      message: 'Seeded testing dataset already exists. Run "npm run seed:clean" first to reset.',
    };
  }

  const seedPassword = process.env.SEED_CUSTOMER_PASSWORD || crypto.randomBytes(12).toString('hex');

  // 1. 20 Realistic Customer Records
  const customers = [];
  for (const c of CUSTOMER_NAMES) {
    const existingUser = await User.findOne({ email: c.email });
    if (existingUser) {
      customers.push(existingUser);
    } else {
      customers.push(
        await User.create({
          ...c,
          password: seedPassword,
          role: 'customer',
          isSeeded: true,
        })
      );
    }
  }

  // 2. 4 Master Stylists / Barbers
  const staffMembers = await Staff.insertMany([
    {
      name: 'Julian Vance',
      title: 'Master Creative Stylist',
      specialty: 'Precision Cuts & Editorial Styling',
      experienceYears: 11,
      isSeeded: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Elena Rostova',
      title: 'Lead Colorist',
      specialty: 'Balayage, Gloss & Silk Treatments',
      experienceYears: 9,
      isSeeded: true,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Marcus Thorne',
      title: 'Master Barber',
      specialty: 'Bespoke Beard Sculpt & Hot Towel Shave',
      experienceYears: 8,
      isSeeded: true,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Camille Laurent',
      title: 'Holistic Hair & Scalp Specialist',
      specialty: 'Botanical Rituals & Keratin Therapy',
      experienceYears: 7,
      isSeeded: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
  ]);

  // 3. 10 Salon Services in INR
  const services = await Service.insertMany([
    {
      name: 'Signature Precision Cut & Finish',
      category: 'Haircut & Styling',
      description: 'Bespoke consultation, relaxing scalp cleanse, architectural haircut, and signature blowout finish.',
      duration: 60,
      price: 1200,
      isPopular: true,
      isAvailable: true,
      specialOfferText: 'Most Requested',
      isSeeded: true,
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Royal Beard Sculpt & Hot Towel',
      category: 'Beard & Grooming',
      description: 'Detailed straight-razor linework, aromatic eucalyptus steam towels, and organic cedarwood beard oil.',
      duration: 45,
      price: 650,
      isPopular: true,
      isAvailable: true,
      isSeeded: true,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Balayage & Gloss Illumination',
      category: 'Color & Treatments',
      description: 'Hand-painted dimensional color paired with a bond-building gloss treatment for luminous shine.',
      duration: 150,
      price: 4800,
      isPopular: true,
      isAvailable: true,
      specialOfferText: '15% Off Tue–Thu',
      isSeeded: true,
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Keratin Silk Infusion',
      category: 'Color & Treatments',
      description: 'Formaldehyde-free smoothing ritual that eliminates frizz and restores mirror-like softness.',
      duration: 120,
      price: 4200,
      isPopular: false,
      isAvailable: true,
      isSeeded: true,
      image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Executive Grooming Package',
      category: 'Beard & Grooming',
      description: 'Tailored scissor-over-comb cut, royal beard sculpt, charcoal facial mask, and neck massage.',
      duration: 90,
      price: 1800,
      isPopular: true,
      isAvailable: true,
      specialOfferText: 'Save ₹300',
      isSeeded: true,
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Botanical Scalp & Hair Ritual',
      category: 'Spa & Rituals',
      description: 'Micro-mist hydration, exfoliating rosemary scalp therapy, and deep restorative lipid masque.',
      duration: 60,
      price: 1500,
      isPopular: false,
      isAvailable: true,
      isSeeded: true,
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Luxury Blowout & Silk Press',
      category: 'Haircut & Styling',
      description: 'Volume-infused round-brush styling or sleek silk press with thermal protection and shine mist.',
      duration: 45,
      price: 900,
      isPopular: false,
      isAvailable: true,
      isSeeded: true,
      image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Bridal & Editorial Styling',
      category: 'Bridal & Packages',
      description: 'Red-carpet or bridal updo architecture with customized pin-work and all-night hold.',
      duration: 90,
      price: 5500,
      isPopular: false,
      isAvailable: true,
      isSeeded: true,
      image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Single-Process Root & Tone',
      category: 'Color & Treatments',
      description: 'Seamless root coverage and customized toning glaze for rich, uniform color longevity.',
      duration: 90,
      price: 2400,
      isPopular: false,
      isAvailable: true,
      isSeeded: true,
      image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Aurum Gold Spa Day Package',
      category: 'Bridal & Packages',
      description: 'Full signature cut, botanical scalp ritual, gloss treatment, and refreshment experience.',
      duration: 180,
      price: 6500,
      isPopular: true,
      isAvailable: true,
      specialOfferText: 'VIP Signature',
      isSeeded: true,
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    },
  ]);

  // 4. 6 Months of Realistic Booking History (~66 bookings, zero staff/date/slot collisions)
  const slots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  const usedSlotKeys = new Set();
  const appointmentSpecs = [];

  // Past 175 days: ~56 historical bookings (increasing frequency closer to current month for realistic growth)
  const pastOffsets = [
    -172, -165, -158, -152, -145, -138, -130, -124, -118, -112,
    -105, -98, -92, -88, -82, -76, -70, -65, -60, -56,
    -52, -48, -44, -40, -36, -33, -30, -27, -25, -22,
    -20, -18, -16, -14, -13, -11, -10, -9, -8, -7,
    -6, -5, -4, -4, -3, -3, -2, -2, -1, -1,
    -1, -15, -28, -42, -55, -85,
  ];

  pastOffsets.forEach((dayOffset, idx) => {
    const custIdx = idx % customers.length;
    const svcIdx = (idx * 3 + 1) % services.length;
    const stfIdx = idx % staffMembers.length;
    let slotIdx = (idx * 2) % slots.length;

    const dateStr = getISTOffsetDateString(dayOffset);
    while (usedSlotKeys.has(`${stfIdx}-${dateStr}-${slots[slotIdx]}`)) {
      slotIdx = (slotIdx + 1) % slots.length;
    }
    const slot = slots[slotIdx];
    usedSlotKeys.add(`${stfIdx}-${dateStr}-${slot}`);

    // ~14% cancelled, ~86% completed for past bookings
    const status = idx % 7 === 5 ? 'Cancelled' : 'Completed';
    appointmentSpecs.push({ custIdx, svcIdx, stfIdx, dateStr, slot, status });
  });

  // Today & Upcoming 5 days: 10 active bookings across lifecycle stages
  const activeSpecs = [
    { custIdx: 0, svcIdx: 0, stfIdx: 0, day: 0, slot: '10:00', status: 'Completed' },
    { custIdx: 1, svcIdx: 4, stfIdx: 2, day: 0, slot: '11:00', status: 'In Progress' },
    { custIdx: 2, svcIdx: 2, stfIdx: 1, day: 0, slot: '14:00', status: 'Confirmed' },
    { custIdx: 3, svcIdx: 1, stfIdx: 2, day: 0, slot: '16:00', status: 'Booked' },
    { custIdx: 4, svcIdx: 5, stfIdx: 3, day: 0, slot: '17:00', status: 'Payment Pending' },
    { custIdx: 5, svcIdx: 7, stfIdx: 0, day: 1, slot: '11:00', status: 'Confirmed' },
    { custIdx: 6, svcIdx: 3, stfIdx: 3, day: 1, slot: '15:00', status: 'Booked' },
    { custIdx: 7, svcIdx: 9, stfIdx: 1, day: 2, slot: '12:00', status: 'Confirmed' },
    { custIdx: 8, svcIdx: 6, stfIdx: 0, day: 3, slot: '13:00', status: 'Booked' },
    { custIdx: 9, svcIdx: 8, stfIdx: 1, day: 4, slot: '16:00', status: 'Cancelled' },
  ];

  for (const s of activeSpecs) {
    const dateStr = getISTOffsetDateString(s.day);
    appointmentSpecs.push({
      custIdx: s.custIdx,
      svcIdx: s.svcIdx,
      stfIdx: s.stfIdx,
      dateStr,
      slot: s.slot,
      status: s.status,
    });
  }

  const appointmentsToInsert = appointmentSpecs.map((spec) => {
    const svc = services[spec.svcIdx];
    const isCompleted = spec.status === 'Completed';
    const isPayPending = spec.status === 'Payment Pending';
    return {
      customer: customers[spec.custIdx]._id,
      service: svc._id,
      staff: staffMembers[spec.stfIdx]._id,
      date: spec.dateStr,
      timeSlot: spec.slot,
      status: spec.status,
      paymentStatus: isCompleted ? 'Paid' : isPayPending ? 'Payment Pending' : 'Unpaid',
      price: svc.price,
      finalAmount: isCompleted ? svc.price : null,
      duration: svc.duration,
      completedAt: isCompleted ? new Date(`${spec.dateStr}T${spec.slot}:00+05:30`) : null,
      isSeeded: true,
    };
  });

  const insertedAppts = await Appointment.insertMany(appointmentsToInsert);

  // 5. Corresponding Payments & Transactions for Completed Appointments
  const methods = ['UPI', 'Card', 'Cash'];
  let txnSeq = 1001;
  const paymentsToInsert = [];
  const transactionsToInsert = [];

  for (let i = 0; i < insertedAppts.length; i++) {
    const appt = insertedAppts[i];
    if (appt.status !== 'Completed') continue;

    const spec = appointmentSpecs[i];
    const cust = customers[spec.custIdx];
    const svc = services[spec.svcIdx];
    const method = methods[i % methods.length];
    const paidAt = new Date(`${appt.date}T${appt.timeSlot}:00+05:30`);

    paymentsToInsert.push({
      appointment: appt._id,
      customer: cust._id,
      customerName: cust.name,
      customerPhone: cust.phone,
      service: svc._id,
      serviceName: svc.name,
      staff: staffMembers[spec.stfIdx]._id,
      originalPrice: svc.price,
      additionalCharges: 0,
      discount: 0,
      finalAmount: svc.price,
      paymentMethod: method,
      status: 'Paid',
      isWalkIn: false,
      paidAt,
      istDate: appt.date,
      isSeeded: true,
    });
  }

  const insertedPayments = await Payment.insertMany(paymentsToInsert);
  for (const p of insertedPayments) {
    transactionsToInsert.push({
      payment: p._id,
      appointment: p.appointment,
      referenceId: `TXN-SEED-${txnSeq++}`,
      type: 'PAYMENT',
      amount: p.finalAmount,
      paymentMethod: p.paymentMethod,
      customerName: p.customerName,
      serviceName: p.serviceName,
      status: 'Paid',
      isWalkIn: false,
      occurredAt: p.paidAt,
      istDate: p.istDate,
      isSeeded: true,
    });
  }
  await Transaction.insertMany(transactionsToInsert);

  // 6. Realistic Monthly Expenses across the 6 months
  const expensesToInsert = [];
  for (let m = 5; m >= 0; m--) {
    const dayOffset = -m * 30 - 5;
    const istDate = getISTOffsetDateString(dayOffset);
    expensesToInsert.push(
      {
        title: 'Salon Supplies & Botanicals',
        category: 'Salon Supplies',
        amount: 3200 + m * 150,
        istDate,
        isSeeded: true,
      },
      {
        title: 'Studio Utilities & Maintenance',
        category: 'Rent & Utilities',
        amount: 4500,
        istDate: getISTOffsetDateString(dayOffset + 2),
        isSeeded: true,
      }
    );
  }
  await Expense.insertMany(expensesToInsert);

  return {
    seeded: true,
    counts: {
      customers: customers.length,
      staff: staffMembers.length,
      services: services.length,
      appointments: insertedAppts.length,
      payments: insertedPayments.length,
      transactions: transactionsToInsert.length,
      expenses: expensesToInsert.length,
    },
  };
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  (async () => {
    const isClean = process.argv.includes('--clean');
    const allowProd = process.argv.includes('--allow-prod');

    if (process.env.NODE_ENV === 'production' && !allowProd && !isClean) {
      console.error('Refusing to seed test data in production without --allow-prod.');
      process.exit(1);
    }

    await connectDB();
    const res = isClean ? await cleanSeededData() : await seedTestingDataset();
    console.log(isClean ? 'Cleaned seeded data:' : 'Seed complete:', res);
    await disconnectDB();
    process.exit(0);
  })().catch((err) => {
    console.error('Seed script error:', err.message);
    process.exit(1);
  });
}
