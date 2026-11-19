import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: [0, 'Original price cannot be negative'],
    },
    additionalCharges: {
      type: Number,
      default: 0,
      min: [0, 'Additional charges cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    finalAmount: {
      type: Number,
      required: true,
      min: [0, 'Final amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card'],
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: ['Paid', 'Refunded'],
      default: 'Paid',
    },
    isWalkIn: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    istDate: {
      type: String, // YYYY-MM-DD in Asia/Kolkata
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

// Prevent duplicate Paid payment records for the same appointment
paymentSchema.index(
  { appointment: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'Paid' },
  }
);

export default mongoose.model('Payment', paymentSchema);
