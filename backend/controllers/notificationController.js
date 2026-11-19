import Notification from '../models/Notification.js';
import { processAppointmentReminders } from '../services/notificationService.js';

export async function getMyNotifications(req, res) {
  try {
    await processAppointmentReminders();

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({
      notifications,
      unreadCount,
      preferences: {
        inAppEnabled: true,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load notifications.' });
  }
}

export async function markAsRead(req, res) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to mark notification as read.' });
  }
}

export async function markAllAsRead(req, res) {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to mark notifications as read.' });
  }
}

export async function triggerReminders(req, res) {
  try {
    const result = await processAppointmentReminders();
    res.json({ message: 'Appointment reminders processed.', ...result });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to process reminders.' });
  }
}
