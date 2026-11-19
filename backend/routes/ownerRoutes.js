import { Router } from 'express';
import {
  getCustomers,
  getOverviewAnalytics,
  getExpenses,
  createExpense,
  deleteExpense,
} from '../controllers/ownerController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/customers', protect, requireRole('owner', 'demo_owner'), getCustomers);
router.get('/analytics', protect, requireRole('owner', 'demo_owner'), getOverviewAnalytics);
router.get('/expenses', protect, requireRole('owner', 'demo_owner'), getExpenses);
router.post('/expenses', protect, requireRole('owner'), createExpense);
router.delete('/expenses/:id', protect, requireRole('owner'), deleteExpense);

export default router;
