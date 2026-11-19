import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Staff from '../models/Staff.js';
import Appointment from '../models/Appointment.js';
import Payment from '../models/Payment.js';
import Transaction from '../models/Transaction.js';
import Expense from '../models/Expense.js';
import WalkInProfile from '../models/WalkInProfile.js';
import Notification from '../models/Notification.js';
import { getISTDateString, getISTOffsetDateString } from '../utils/timezone.js';

dotenv.config({ path: new URL('../.env', import.meta.url) });

const TEST_DB_URI =
  process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/maison_aurum_testing';

const CUSTOMERS_DATA = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@testing.in', phone: '+91 98201 11201', regMonthsAgo: 6, targetBookings: 9 },
  { name: 'Priya Patel', email: 'priya.patel@testing.in', phone: '+91 98201 11202', regMonthsAgo: 6, targetBookings: 8 },
  { name: 'Rohan Verma', email: 'rohan.verma@testing.in', phone: '+91 98201 11203', regMonthsAgo: 6, targetBookings: 9 },
  { name: 'Ananya Iyer', email: 'ananya.iyer@testing.in', phone: '+91 98201 11204', regMonthsAgo: 6, targetBookings: 8 },
  { name: 'Vikram Nair', email: 'vikram.nair@testing.in', phone: '+91 98201 11205', regMonthsAgo: 6, targetBookings: 7 },
  { name: 'Meera Krishnan', email: 'meera.k@testing.in', phone: '+91 98201 11206', regMonthsAgo: 5, targetBookings: 8 },
  { name: 'Siddharth Rao', email: 'siddharth.rao@testing.in', phone: '+91 98201 11207', regMonthsAgo: 5, targetBookings: 7 },
  { name: 'Kavya Deshmukh', email: 'kavya.d@testing.in', phone: '+91 98201 11208', regMonthsAgo: 5, targetBookings: 8 },
  { name: 'Aditya Kulkarni', email: 'aditya.k@testing.in', phone: '+91 98201 11209', regMonthsAgo: 5, targetBookings: 7 },
  { name: 'Neha Malhotra', email: 'neha.m@testing.in', phone: '+91 98201 11210', regMonthsAgo: 4, targetBookings: 7 },
  { name: 'Arjun Menon', email: 'arjun.menon@testing.in', phone: '+91 98201 11211', regMonthsAgo: 4, targetBookings: 6 },
  { name: 'Divya Joshi', email: 'divya.joshi@testing.in', phone: '+91 98201 11212', regMonthsAgo: 4, targetBookings: 7 },
  { name: 'Karan Kapoor', email: 'karan.kapoor@testing.in', phone: '+91 98201 11213', regMonthsAgo: 4, targetBookings: 6 },
  { name: 'Sneha Reddy', email: 'sneha.reddy@testing.in', phone: '+91 98201 11214', regMonthsAgo: 3, targetBookings: 7 },
  { name: 'Rahul Banerjee', email: 'rahul.b@testing.in', phone: '+91 98201 11215', regMonthsAgo: 3, targetBookings: 6 },
  { name: 'Pooja Choudhary', email: 'pooja.c@testing.in', phone: '+91 98201 11216', regMonthsAgo: 3, targetBookings: 6 },
  { name: 'Nikhil Sinha', email: 'nikhil.sinha@testing.in', phone: '+91 98201 11217', regMonthsAgo: 2, targetBookings: 6 },
  { name: 'Riya Sengupta', email: 'riya.s@testing.in', phone: '+91 98201 11218', regMonthsAgo: 2, targetBookings: 6 },
  { name: 'Varun Khanna', email: 'varun.khanna@testing.in', phone: '+91 98201 11219', regMonthsAgo: 1, targetBookings: 5 },
  { name: 'Ishita Bose', email: 'ishita.bose@testing.in', phone: '+91 98201 11220', regMonthsAgo: 1, targetBookings: 5 },
];

const CANCELLATION_REASONS = [
  'Customer unavailable',
  'Schedule conflict',
  'Personal reasons',
  'Last-minute cancellation',
];

const PAYMENT_METHODS = ['UPI', 'UPI', 'UPI', 'Card', 'Card', 'Cash', 'Cash'];

export async function cleanHistoryData() {
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

export async function seedSalonHistory() {
  const existing = await Appointment.countDocuments({ isSeeded: true });
  if (existing > 0) {
    return {
      seeded: false,
      message: 'Testing history already exists. Run "npm run seed:history:clean" to remove it first.',
    };
  }

  const seedPassword = process.env.SEED_CUSTOMER_PASSWORD || crypto.randomBytes(12).toString('hex');

  // 1. Insert 20 unique customers with staggered registration dates across 6 months
  const customers = [];
  for (let i = 0; i < CUSTOMERS_DATA.length; i++) {
    const c = CUSTOMERS_DATA[i];
    const existingUser = await User.findOne({ email: c.email });
    if (existingUser) {
      customers.push(existingUser);
      continue;
    }

    const regDayOffset = Math.max(-178, -(c.regMonthsAgo * 29) + (i % 7));
    const regDate = new Date(`${getISTOffsetDateString(regDayOffset)}T10:30:00+05:30`);
    const created = new User({
      name: c.name,
      email: c.email,
      phone: c.phone,
      password: seedPassword,
      role: 'customer',
      isSeeded: true,
      createdAt: regDate,
      updatedAt: regDate,
    });
    await created.save();
    customers.push(created);
  }

  // 2. Insert 4 Master Stylists / Barbers (or reuse if present)
  let staffMembers = await Staff.find({ isSeeded: true });
  if (staffMembers.length === 0) {
    staffMembers = await Staff.insertMany([
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
  }

  // 3. Insert 10 Salon Services in INR
  let services = await Service.find({ isSeeded: true });
  if (services.length === 0) {
    services = await Service.insertMany([
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
  }

  // 4. Generate 6 Months of Booking History (~140 bookings, 5-9 per customer)
  const slots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  const usedSlotKeys = new Set();
  const todayStr = getISTDateString();
  const nowIST = new Date(`${todayStr}T12:00:00+05:30`);

  const appointmentsToInsert = [];
  const paymentCandidates = [];

  let globalSeq = 0;

  for (let cIdx = 0; cIdx < customers.length; cIdx++) {
    const cust = customers[cIdx];
    const meta = CUSTOMERS_DATA[cIdx];
    const maxOffsetDays = Math.min(175, meta.regMonthsAgo * 29 - 1);

    for (let b = 0; b < meta.targetBookings; b++) {
      globalSeq += 1;

      // Spread bookings across customer's active months + 1 upcoming/today slot for some customers
      let dayOffset;
      if (b === meta.targetBookings - 1 && cIdx < 14) {
        // Recent/Today/Upcoming booking for active pipeline (Accepted / Pending / Completed)
        dayOffset = (cIdx % 5) - 1; // -1, 0, 1, 2, 3
      } else {
        // Spread evenly across customer's registration history (with organic jitter)
        const fraction = (b + 0.35) / meta.targetBookings;
        dayOffset = -Math.max(1, Math.round(maxOffsetDays * (1 - fraction)) + ((globalSeq * 3) % 5));
      }

      let dateStr = getISTOffsetDateString(dayOffset);
      let stfIdx = (cIdx + b * 2) % staffMembers.length;
      let slotIdx = (cIdx * 3 + b * 2) % slots.length;

      // Ensure no { staff, date, timeSlot } collision
      let attempts = 0;
      while (usedSlotKeys.has(`${stfIdx}-${dateStr}-${slots[slotIdx]}`) && attempts < 40) {
        slotIdx = (slotIdx + 1) % slots.length;
        if (slotIdx === 0) stfIdx = (stfIdx + 1) % staffMembers.length;
        attempts += 1;
      }
      if (usedSlotKeys.has(`${stfIdx}-${dateStr}-${slots[slotIdx]}`)) {
        dayOffset -= 1;
        dateStr = getISTOffsetDateString(dayOffset);
      }

      const slot = slots[slotIdx];
      usedSlotKeys.add(`${stfIdx}-${dateStr}-${slot}`);

      const svcIdx = (cIdx * 2 + b * 3 + (globalSeq % 3)) % services.length;
      const svc = services[svcIdx];
      const staff = staffMembers[stfIdx];

      // Determine status realistically (past vs today/future)
      let status = 'Completed';
      if (dayOffset > 0) {
        status = (cIdx + b) % 2 === 0 ? 'Confirmed' : 'Booked';
      } else if (dayOffset === 0) {
        status = cIdx % 3 === 0 ? 'Completed' : cIdx % 3 === 1 ? 'Confirmed' : 'Booked';
      } else {
        // Past bookings: varied cancellation rate (~12% to ~20% depending on month)
        const cancelMod = (Math.abs(dayOffset) + cIdx) % 9;
        if (cancelMod === 2 || (Math.abs(dayOffset) > 90 && cancelMod === 6)) {
          status = 'Cancelled';
        }
      }

      const apptTime = new Date(`${dateStr}T${slot}:00+05:30`);
      const createdAt = new Date(apptTime.getTime() - 2 * 24 * 60 * 60 * 1000);
      const updatedAt = new Date(apptTime.getTime() + 60 * 60 * 1000);

      let paymentStatus = 'Unpaid';
      let paymentMethod = '';
      let finalAmount = null;
      let completedAt = null;
      let cancelledAt = null;
      let cancellationReason = '';

      if (status === 'Completed') {
        paymentStatus = 'Paid';
        paymentMethod = PAYMENT_METHODS[globalSeq % PAYMENT_METHODS.length];
        // Realistic price variation (occasional ₹150 add-on or ₹100 loyalty discount)
        const addOn = globalSeq % 5 === 0 ? 200 : 0;
        const discount = globalSeq % 7 === 0 ? 100 : 0;
        finalAmount = Math.max(100, svc.price + addOn - discount);
        completedAt = updatedAt;

        paymentCandidates.push({
          seq: globalSeq,
          customer: cust._id,
          customerName: cust.name,
          customerPhone: cust.phone,
          service: svc._id,
          serviceName: svc.name,
          staff: staff._id,
          originalPrice: svc.price,
          additionalCharges: addOn,
          discount,
          finalAmount,
          paymentMethod,
          paidAt: completedAt,
          istDate: dateStr,
        });
      } else if (status === 'Cancelled') {
        cancelledAt = new Date(apptTime.getTime() - 6 * 60 * 60 * 1000);
        cancellationReason = CANCELLATION_REASONS[globalSeq % CANCELLATION_REASONS.length];
      }

      appointmentsToInsert.push({
        customer: cust._id,
        service: svc._id,
        staff: staff._id,
        date: dateStr,
        timeSlot: slot,
        status,
        paymentStatus,
        paymentMethod,
        price: svc.price,
        finalAmount,
        duration: svc.duration,
        completedAt,
        cancelledAt,
        cancellationReason,
        notes: status === 'Cancelled' ? cancellationReason : '',
        isSeeded: true,
        createdAt,
        updatedAt,
      });
    }
  }

  const insertedAppts = await Appointment.insertMany(appointmentsToInsert);

  // 5. Create Payment & Transaction records strictly for Completed appointments
  let candidateIdx = 0;
  const paymentsToInsert = [];
  for (const appt of insertedAppts) {
    if (appt.status !== 'Completed') continue;
    const p = paymentCandidates[candidateIdx++];
    paymentsToInsert.push({
      appointment: appt._id,
      customer: p.customer,
      customerName: p.customerName,
      customerPhone: p.customerPhone,
      service: p.service,
      serviceName: p.serviceName,
      staff: p.staff,
      originalPrice: p.originalPrice,
      additionalCharges: p.additionalCharges,
      discount: p.discount,
      finalAmount: p.finalAmount,
      paymentMethod: p.paymentMethod,
      status: 'Paid',
      isWalkIn: false,
      paidAt: p.paidAt,
      istDate: p.istDate,
      isSeeded: true,
    });
  }

  const insertedPayments = await Payment.insertMany(paymentsToInsert);
  let txnCounter = 2001;
  const transactionsToInsert = insertedPayments.map((p) => ({
    payment: p._id,
    appointment: p.appointment,
    referenceId: `TXN-HIST-${txnCounter++}`,
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
  }));
  await Transaction.insertMany(transactionsToInsert);

  // 6. Monthly Operational Expenses across all 6 months
  const expensesToInsert = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(nowIST.getFullYear(), nowIST.getMonth() - m, 5);
    const istDate1 = getISTDateString(d);
    const d2 = new Date(nowIST.getFullYear(), nowIST.getMonth() - m, 12);
    const istDate2 = getISTDateString(d2);
    expensesToInsert.push(
      {
        title: 'Botanical & Color Stock',
        category: 'Salon Supplies',
        amount: 6500 + (5 - m) * 450,
        istDate: istDate1,
        isSeeded: true,
      },
      {
        title: 'Studio Rent & Utilities',
        category: 'Rent & Utilities',
        amount: 12000,
        istDate: istDate2,
        isSeeded: true,
      }
    );
  }
  await Expense.insertMany(expensesToInsert);

  return {
    seeded: true,
    database: mongoose.connection.name,
    counts: {
      customers: customers.length,
      staff: staffMembers.length,
      services: services.length,
      appointments: insertedAppts.length,
      completed: insertedAppts.filter((a) => a.status === 'Completed').length,
      accepted: insertedAppts.filter((a) => a.status === 'Confirmed').length,
      pending: insertedAppts.filter((a) => a.status === 'Booked').length,
      cancelled: insertedAppts.filter((a) => a.status === 'Cancelled').length,
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
      console.error('Refusing to seed testing history in production without --allow-prod.');
      process.exit(1);
    }

    await mongoose.connect(TEST_DB_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
    console.log(`Connected to testing database: ${mongoose.connection.name}`);

    const res = isClean ? await cleanHistoryData() : await seedSalonHistory();
    console.log(isClean ? 'Cleaned testing history:' : 'Salon 6-month history seeded:', res);

    await mongoose.disconnect();
    process.exit(0);
  })().catch((err) => {
    console.error('seedSalonHistory error:', err.message);
    process.exit(1);
  });
}
