import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Staff name is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    specialty: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    experienceYears: {
      type: Number,
      default: 5,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isSeeded: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Staff', staffSchema);
