import Staff from '../models/Staff.js';

export async function getStaff(req, res) {
  try {
    const staff = await Staff.find({ isAvailable: true }).sort({ experienceYears: -1 });
    res.json({ staff });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load stylists.' });
  }
}
