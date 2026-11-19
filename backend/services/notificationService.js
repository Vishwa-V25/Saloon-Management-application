import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { getISTDateString, getISTOffsetDateString } from '../utils/timezone.js';

/**
 * Creates a mandatory in-app notification in MongoDB for the recipient.
 */
export async function notifyUser({ recipientUser, type, title, message, appointmentId = null }) {
  if (!recipientUser?._id) return null;

  return Notification.create({
    recipient: recipientUser._id,
    appointment: appointmentId,
    type,
    title,
    message,
    isRead: false,
  });
}

/**
 * Sends an in-app notification to all salon owner accounts.
 */
export async function notifyOwners({ type, title, message, appointmentId = null }) {
  const owners = await User.find({ role: 'owner' });
  const results = [];
  for (const owner of owners) {
    results.push(
      await notifyUser({
        recipientUser: owner,
        type,
        title,
        message,
        appointmentId,
      })
    );
  }
  return results;
}

/**
 * Generates deduplicated appointment reminder notifications for Confirmed appointments
 * occurring today or tomorrow (IST). Notifies both the customer and the owner.
 */
export async function processAppointmentReminders() {
  const todayStr = getISTDateString();
  const tomorrowStr = getISTOffsetDateString(1);

  const upcomingConfirmed = await Appointment.find({
    status: 'Confirmed',
    date: { $in: [todayStr, tomorrowStr] },
  })
    .populate('customer')
    .populate('service', 'name')
    .populate('staff', 'name');

  let createdCount = 0;

  for (const appt of upcomingConfirmed) {
    if (!appt.customer) continue;

    const existingCustomerReminder = await Notification.findOne({
      appointment: appt._id,
      recipient: appt.customer._id,
      type: 'APPOINTMENT_REMINDER',
    });

    if (!existingCustomerReminder) {
      const whenLabel = appt.date === todayStr ? 'today' : 'tomorrow';
      await notifyUser({
        recipientUser: appt.customer,
        type: 'APPOINTMENT_REMINDER',
        title: 'Upcoming Appointment Reminder',
        message: `Reminder: Your ${appt.service?.name || 'salon'} appointment with ${
          appt.staff?.name || 'your stylist'
        } is ${whenLabel} (${appt.date}) at ${appt.timeSlot}.`,
        appointmentId: appt._id,
      });
      createdCount += 1;
    }

    const owners = await User.find({ role: 'owner' });
    for (const owner of owners) {
      const existingOwnerReminder = await Notification.findOne({
        appointment: appt._id,
        recipient: owner._id,
        type: 'APPOINTMENT_REMINDER',
      });
      if (!existingOwnerReminder) {
        const whenLabel = appt.date === todayStr ? 'today' : 'tomorrow';
        await notifyUser({
          recipientUser: owner,
          type: 'APPOINTMENT_REMINDER',
          title: 'Upcoming Client Appointment',
          message: `Reminder: ${appt.customer.name} is scheduled for ${
            appt.service?.name || 'a service'
          } ${whenLabel} (${appt.date}) at ${appt.timeSlot} with ${appt.staff?.name || 'staff'}.`,
          appointmentId: appt._id,
        });
        createdCount += 1;
      }
    }
  }

  return { checked: upcomingConfirmed.length, createdCount };
}
