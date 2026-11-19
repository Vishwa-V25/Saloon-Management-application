import { Router } from 'express';
import {
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
  cancelMyAppointment,
  getAllAppointments,
  updateAppointmentStatus,
} from '../controllers/appointmentController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/slots', getAvailableSlots);
router.post('/', protect, requireRole('customer', 'user', 'demo_owner'), createAppointment);
router.get('/my', protect, requireRole('customer', 'user', 'demo_owner'), getMyAppointments);
router.patch('/:id/cancel', protect, requireRole('customer', 'user', 'demo_owner'), cancelMyAppointment);

router.get('/', protect, requireRole('owner', 'demo_owner'), getAllAppointments);
router.patch('/:id/status', protect, requireRole('owner', 'demo_owner'), updateAppointmentStatus);

export default router;
