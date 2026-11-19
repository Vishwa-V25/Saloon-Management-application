import mongoose from 'mongoose';

const walkInProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'Walk-in Guest',
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
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

export default mongoose.model('WalkInProfile', walkInProfileSchema);
