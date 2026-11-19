import crypto from 'crypto';
import Appointment from '../models/Appointment.js';
import Payment from '../models/Payment.js';
import Transaction from '../models/Transaction.js';
import Service from '../models/Service.js';
import Staff from '../models/Staff.js';
import User from '../models/User.js';
import WalkInProfile from '../models/WalkInProfile.js';
import { notifyUser } from '../services/notificationService.js';

function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}
import {
  getISTDateString,
  getISTTimeString,
  getISTMonthPrefix,
  getISTOffsetDateString,
} from '../utils/timezone.js';

const SALON_NAME = 'Maison Aurum';

function generateReferenceId() {
  const datePart = getISTDateString().replace(/-/g, '');
  const randPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TXN-${datePart}-${randPart}`;
}

function buildThankYouMessage(serviceName, amount) {
  return `Thank you for visiting ${SALON_NAME}! Your ${serviceName} has been completed successfully. Payment received: ₹${amount}. We appreciate your support. Hope to see you again!`;
}

export async function collectPaymentForAppointment(req, res) {
  try {
    const { additionalCharges = 0, discount = 0, paymentMethod, notes = '' } = req.body;

    if (!['Cash', 'UPI', 'Card'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Valid payment method (Cash, UPI, or Card) is required.' });
    }

    const addCharges = Number(additionalCharges);
    const discountAmt = Number(discount);
    if (Number.isNaN(addCharges) || addCharges < 0) {
      return res.status(400).json({ message: 'Additional charges must be 0 or greater.' });
    }
    if (Number.isNaN(discountAmt) || discountAmt < 0) {
      return res.status(400).json({ message: 'Discount must be 0 or greater.' });
    }

    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('customer', 'name email phone notificationPreferences')
      .populate('service', 'name price duration')
      .populate('staff', 'name title');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    if (appointment.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot collect payment for a cancelled appointment.' });
    }
    if (appointment.paymentStatus === 'Paid' || appointment.status === 'Completed') {
      return res.status(409).json({
        message: 'Payment has already been collected for this appointment.',
      });
    }

    const existingPaid = await Payment.findOne({ appointment: appointment._id, status: 'Paid' });
    if (existingPaid) {
      return res.status(409).json({
        message: 'Duplicate payment prevented: a Paid record already exists for this appointment.',
      });
    }

    const originalPrice = Number(appointment.price || appointment.service?.price || 0);
    const finalAmount = Math.max(0, Number((originalPrice + addCharges - discountAmt).toFixed(2)));
    const istDate = getISTDateString();
    const now = new Date();

    const customerName =
      appointment.customer?.name || appointment.walkInCustomer?.name || 'Guest';
    const customerPhone =
      appointment.customer?.phone || appointment.walkInCustomer?.phone || '';
    const serviceName = appointment.service?.name || 'Salon Service';

    const payment = await Payment.create({
      appointment: appointment._id,
      customer: appointment.customer?._id || null,
      customerName,
      customerPhone,
      service: appointment.service._id,
      serviceName,
      staff: appointment.staff?._id || null,
      originalPrice,
      additionalCharges: addCharges,
      discount: discountAmt,
      finalAmount,
      paymentMethod,
      status: 'Paid',
      isWalkIn: Boolean(appointment.isWalkIn),
      paidAt: now,
      istDate,
      notes: notes.trim(),
    });

    const transaction = await Transaction.create({
      payment: payment._id,
      appointment: appointment._id,
      referenceId: generateReferenceId(),
      type: 'PAYMENT',
      amount: finalAmount,
      paymentMethod,
      customerName,
      serviceName,
      status: 'Paid',
      isWalkIn: Boolean(appointment.isWalkIn),
      recordedBy: req.user._id,
      occurredAt: now,
      istDate,
    });

    appointment.status = 'Completed';
    appointment.paymentStatus = 'Paid';
    appointment.paymentMethod = paymentMethod;
    appointment.finalAmount = finalAmount;
    appointment.completedAt = now;
    await appointment.save();

    // Send mandatory in-app + optional WhatsApp thank-you notification for registered customer
    if (appointment.customer) {
      await notifyUser({
        recipientUser: appointment.customer,
        type: 'SERVICE_COMPLETED',
        title: 'Thank You for Visiting Maison Aurum',
        message: buildThankYouMessage(serviceName, finalAmount),
        appointmentId: appointment._id,
      });
    }

    res.status(201).json({
      appointment,
      payment,
      transaction,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'Duplicate payment prevented: this appointment is already paid.',
      });
    }
    res.status(500).json({ message: err.message || 'Failed to collect payment.' });
  }
}

export async function createWalkInPayment(req, res) {
  try {
    const {
      customerName = '',
      phone = '',
      serviceId,
      staffId,
      amount,
      paymentMethod,
      notes = '',
    } = req.body;

    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: 'Please enter a valid 10–15 digit mobile number.' });
    }
    if (!serviceId || !staffId) {
      return res.status(400).json({ message: 'Service and assigned staff member are required.' });
    }
    if (!['Cash', 'UPI', 'Card'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Valid payment method (Cash, UPI, or Card) is required.' });
    }

    const [service, staff] = await Promise.all([
      Service.findById(serviceId),
      Staff.findById(staffId),
    ]);

    if (!service) {
      return res.status(404).json({ message: 'Selected service not found.' });
    }
    if (!staff) {
      return res.status(404).json({ message: 'Selected staff member not found.' });
    }

    const finalAmount = amount !== undefined && amount !== '' ? Number(amount) : Number(service.price);
    if (Number.isNaN(finalAmount) || finalAmount <= 0) {
      return res.status(400).json({ message: 'Service amount must be greater than 0.' });
    }

    const cleanPhone = phone.trim();
    const digits = cleanPhone.replace(/\D/g, '');
    const last10 = digits.slice(-10);

    // Match existing registered customer by phone if present (without forcing account creation)
    const allCustomers = await User.find({ role: { $in: ['customer', 'user'] } });
    const matchedUser = allCustomers.find((u) => {
      const uDigits = (u.phone || '').replace(/\D/g, '');
      return uDigits && (uDigits === digits || uDigits.slice(-10) === last10);
    });

    const resolvedName =
      customerName.trim() || matchedUser?.name || 'Walk-in Guest';

    if (!matchedUser) {
      await WalkInProfile.findOneAndUpdate(
        { phone: cleanPhone },
        {
          name: resolvedName,
          phone: cleanPhone,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const now = new Date();
    const istDate = getISTDateString(now);
    const istTime = getISTTimeString(now);

    const appointment = await Appointment.create({
      customer: matchedUser?._id || null,
      isWalkIn: true,
      walkInCustomer: {
        name: resolvedName,
        phone: cleanPhone,
      },
      service: service._id,
      staff: staff._id,
      date: istDate,
      timeSlot: istTime,
      status: 'Completed',
      paymentStatus: 'Paid',
      paymentMethod,
      price: finalAmount,
      finalAmount,
      duration: service.duration,
      completedAt: now,
      notes: notes.trim() || 'Walk-in service',
    });

    const payment = await Payment.create({
      appointment: appointment._id,
      customer: matchedUser?._id || null,
      customerName: resolvedName,
      customerPhone: cleanPhone,
      service: service._id,
      serviceName: service.name,
      staff: staff._id,
      originalPrice: service.price,
      additionalCharges: Math.max(0, finalAmount - service.price),
      discount: Math.max(0, service.price - finalAmount),
      finalAmount,
      paymentMethod,
      status: 'Paid',
      isWalkIn: true,
      paidAt: now,
      istDate,
      notes: notes.trim(),
    });

    const transaction = await Transaction.create({
      payment: payment._id,
      appointment: appointment._id,
      referenceId: generateReferenceId(),
      type: 'PAYMENT',
      amount: finalAmount,
      paymentMethod,
      customerName: resolvedName,
      serviceName: service.name,
      status: 'Paid',
      isWalkIn: true,
      recordedBy: req.user._id,
      occurredAt: now,
      istDate,
    });

    const thankYouMsg = buildThankYouMessage(service.name, finalAmount);

    if (matchedUser) {
      await notifyUser({
        recipientUser: matchedUser,
        type: 'SERVICE_COMPLETED',
        title: 'Thank You for Visiting Maison Aurum',
        message: thankYouMsg,
        appointmentId: appointment._id,
      });
    }

    res.status(201).json({
      appointment,
      payment,
      transaction,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to record walk-in payment.' });
  }
}

export async function getTransactionsAndSummary(req, res) {
  try {
    const { method, date } = req.query;
    const filter = {};
    if (method && method !== 'All') filter.paymentMethod = method;
    if (date) filter.istDate = date;

    const [transactions, allSuccessfulTxns] = await Promise.all([
      Transaction.find(filter).sort({ occurredAt: -1 }).limit(200).lean(),
      Transaction.find({ status: 'Paid' }).lean(),
    ]);

    const todayIST = getISTDateString();
    const weekStartIST = getISTOffsetDateString(-6);
    const monthPrefixIST = getISTMonthPrefix();

    const dailyRevenue = allSuccessfulTxns
      .filter((t) => t.istDate === todayIST)
      .reduce((sum, t) => sum + t.amount, 0);

    const weeklyRevenue = allSuccessfulTxns
      .filter((t) => t.istDate >= weekStartIST && t.istDate <= todayIST)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyRevenue = allSuccessfulTxns
      .filter((t) => t.istDate.startsWith(monthPrefixIST))
      .reduce((sum, t) => sum + t.amount, 0);

    const cashTotal = allSuccessfulTxns
      .filter((t) => t.paymentMethod === 'Cash')
      .reduce((sum, t) => sum + t.amount, 0);

    const upiTotal = allSuccessfulTxns
      .filter((t) => t.paymentMethod === 'UPI')
      .reduce((sum, t) => sum + t.amount, 0);

    const cardTotal = allSuccessfulTxns
      .filter((t) => t.paymentMethod === 'Card')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      transactions,
      summary: {
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenue,
        cashTotal,
        upiTotal,
        cardTotal,
        totalTransactions: allSuccessfulTxns.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load transactions.' });
  }
}

export async function refundPayment(req, res) {
  try {
    const { reason = 'Owner controlled refund' } = req.body;
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }
    if (payment.status === 'Refunded') {
      return res.status(400).json({ message: 'Payment has already been refunded.' });
    }

    payment.status = 'Refunded';
    await payment.save();

    await Appointment.findByIdAndUpdate(payment.appointment, {
      paymentStatus: 'Refunded',
    });

    const refundTxn = await Transaction.create({
      payment: payment._id,
      appointment: payment.appointment,
      referenceId: generateReferenceId(),
      type: 'REFUND',
      amount: -Math.abs(payment.finalAmount),
      paymentMethod: payment.paymentMethod,
      customerName: payment.customerName,
      serviceName: payment.serviceName,
      status: 'Refunded',
      isWalkIn: payment.isWalkIn,
      reason,
      recordedBy: req.user._id,
      occurredAt: new Date(),
      istDate: getISTDateString(),
    });

    res.json({ payment, refundTransaction: refundTxn });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to process refund.' });
  }
}
