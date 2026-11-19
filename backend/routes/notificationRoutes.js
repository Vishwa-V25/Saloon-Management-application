import { Router } from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  triggerReminders,
} from '../controllers/notificationController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.post('/reminders/run', requireRole('owner'), triggerReminders);

export default router;
