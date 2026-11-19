import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Rent & Utilities', 'Salon Supplies', 'Staff Payroll', 'Marketing', 'Maintenance', 'Other'],
      default: 'Salon Supplies',
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [1, 'Amount must be greater than 0'],
    },
    istDate: {
      type: String, // YYYY-MM-DD in Asia/Kolkata
      required: true,
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isSeeded: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Expense', expenseSchema);
