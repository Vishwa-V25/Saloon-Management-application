import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    referenceId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['PAYMENT', 'REFUND'],
      default: 'PAYMENT',
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card'],
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
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
    reason: {
      type: String,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    occurredAt: {
      type: Date,
      default: Date.now,
    },
    istDate: {
      type: String, // YYYY-MM-DD in Asia/Kolkata
      required: true,
      index: true,
    },
    isSeeded: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
