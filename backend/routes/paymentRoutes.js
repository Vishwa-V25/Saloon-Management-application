import { Router } from 'express';
import {
  collectPaymentForAppointment,
  createWalkInPayment,
  getTransactionsAndSummary,
  refundPayment,
} from '../controllers/paymentController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/collect/:appointmentId', protect, requireRole('owner'), collectPaymentForAppointment);
router.post('/walk-in', protect, requireRole('owner'), createWalkInPayment);
router.get('/transactions', protect, requireRole('owner', 'demo_owner'), getTransactionsAndSummary);
router.post('/:paymentId/refund', protect, requireRole('owner'), refundPayment);

export default router;
