import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isWalkIn: {
      type: Boolean,
      default: false,
    },
    walkInCustomer: {
      name: { type: String, default: '', trim: true },
      phone: { type: String, default: '', trim: true },
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: [true, 'Appointment date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    timeSlot: {
      type: String, // HH:mm (24h, e.g. "10:00", "14:30")
      required: [true, 'Time slot is required'],
    },
    status: {
      type: String,
      enum: [
        'Booked',
        'Pending',
        'Confirmed',
        'In Progress',
        'Payment Pending',
        'Paid',
        'Completed',
        'Cancelled',
      ],
      default: 'Booked',
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Payment Pending', 'Paid', 'Refunded'],
      default: 'Unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', ''],
      default: '',
    },
    price: {
      type: Number,
      required: true,
    },
    finalAmount: {
      type: Number,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: '',
      trim: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    isSeeded: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent double booking for online appointments with the same staff member, date, and timeSlot when not Cancelled
appointmentSchema.index(
  { staff: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isWalkIn: false,
      status: { $in: ['Booked', 'Pending', 'Confirmed', 'In Progress', 'Payment Pending', 'Paid', 'Completed'] },
    },
  }
);

export default mongoose.model('Appointment', appointmentSchema);
