import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import Staff from '../models/Staff.js';
import { SALON_SLOTS, formatSlotLabel } from '../utils/timeSlots.js';
import { notifyUser, notifyOwners } from '../services/notificationService.js';
import { getISTDateString } from '../utils/timezone.js';

const ACTIVE_BOOKING_STATUSES = [
  'Booked',
  'Pending',
  'Confirmed',
  'In Progress',
  'Payment Pending',
  'Paid',
  'Completed',
];

export async function getAvailableSlots(req, res) {
  try {
    const { date, staffId } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date query parameter (YYYY-MM-DD) is required.' });
    }

    const activeFilter = {
      date,
      isWalkIn: false,
      status: { $in: ACTIVE_BOOKING_STATUSES },
    };

    if (staffId && staffId !== 'any') {
      const booked = await Appointment.find({ ...activeFilter, staff: staffId }).select('timeSlot');
      const bookedSet = new Set(booked.map((a) => a.timeSlot));

      const slots = SALON_SLOTS.map((slot) => ({
        timeSlot: slot,
        label: formatSlotLabel(slot),
        available: !bookedSet.has(slot),
      }));
      return res.json({ slots });
    }

    // If 'any' staff selected, a slot is available if at least one available stylist is free
    const allStaff = await Staff.find({ isAvailable: true }).select('_id');
    const booked = await Appointment.find(activeFilter).select('timeSlot staff');

    const slotCounts = {};
    for (const appt of booked) {
      slotCounts[appt.timeSlot] = (slotCounts[appt.timeSlot] || 0) + 1;
    }

    const slots = SALON_SLOTS.map((slot) => ({
      timeSlot: slot,
      label: formatSlotLabel(slot),
      available: (slotCounts[slot] || 0) < allStaff.length,
    }));

    res.json({ slots });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load available time slots.' });
  }
}

export async function createAppointment(req, res) {
  try {
    const { serviceId, staffId, date, timeSlot, notes } = req.body;
    if (!serviceId || !date || !timeSlot) {
      return res.status(400).json({ message: 'Service, date, and time slot are required.' });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.isAvailable) {
      return res.status(404).json({ message: 'Selected service is not currently available.' });
    }

    let chosenStaff = null;
    if (staffId && staffId !== 'any') {
      chosenStaff = await Staff.findById(staffId);
      if (!chosenStaff || !chosenStaff.isAvailable) {
        return res.status(404).json({ message: 'Selected stylist is not available.' });
      }
      const conflict = await Appointment.findOne({
        staff: chosenStaff._id,
        date,
        timeSlot,
        isWalkIn: false,
        status: { $in: ACTIVE_BOOKING_STATUSES },
      });
      if (conflict) {
        return res.status(409).json({
          message: `${chosenStaff.name} is already booked at ${formatSlotLabel(timeSlot)} on ${date}. Please choose another time or stylist.`,
        });
      }
    } else {
      // Auto-assign first available stylist for that slot
      const allStaff = await Staff.find({ isAvailable: true });
      const bookedStaffIds = await Appointment.find({
        date,
        timeSlot,
        isWalkIn: false,
        status: { $in: ACTIVE_BOOKING_STATUSES },
      }).distinct('staff');
      const bookedSet = new Set(bookedStaffIds.map((id) => id.toString()));
      chosenStaff = allStaff.find((s) => !bookedSet.has(s._id.toString()));
      if (!chosenStaff) {
        return res.status(409).json({
          message: `All stylists are booked at ${formatSlotLabel(timeSlot)} on ${date}. Please select another time slot.`,
        });
      }
    }

    const appointment = await Appointment.create({
      customer: req.user._id,
      service: service._id,
      staff: chosenStaff._id,
      date,
      timeSlot,
      status: 'Booked',
      paymentStatus: 'Unpaid',
      price: service.price,
      duration: service.duration,
      notes: notes || '',
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('service', 'name category duration price image')
      .populate('staff', 'name title specialty avatar')
      .populate('customer', 'name email phone');

    // Notify owner(s) of new booking
    await notifyOwners({
      type: 'NEW_BOOKING',
      title: 'New Appointment Request',
      message: `${req.user.name} booked ${service.name} with ${chosenStaff.name} for ${date} at ${formatSlotLabel(timeSlot)}.`,
      appointmentId: appointment._id,
    });

    res.status(201).json({ appointment: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'This stylist and time slot was just booked. Please select another slot.',
      });
    }
    res.status(400).json({ message: err.message || 'Failed to create appointment.' });
  }
}

export async function getMyAppointments(req, res) {
  try {
    const appointments = await Appointment.find({ customer: req.user._id })
      .populate('service', 'name category duration price image')
      .populate('staff', 'name title specialty avatar')
      .sort({ date: -1, timeSlot: -1 });

    const today = getISTDateString();

    const summary = {
      totalBookings: appointments.length,
      totalVisits: appointments.filter((a) => a.status === 'Completed').length,
      upcomingCount: appointments.filter(
        (a) =>
          a.date >= today &&
          ['Booked', 'Pending', 'Confirmed', 'In Progress', 'Payment Pending'].includes(a.status)
      ).length,
      pendingCount: appointments.filter((a) => ['Booked', 'Pending'].includes(a.status)).length,
      confirmedCount: appointments.filter((a) => a.status === 'Confirmed').length,
      completedCount: appointments.filter((a) => a.status === 'Completed').length,
      cancelledCount: appointments.filter((a) => a.status === 'Cancelled').length,
    };

    res.json({ appointments, summary });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load your appointments.' });
  }
}

export async function cancelMyAppointment(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    if (!appointment.customer || appointment.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to cancel this appointment.' });
    }
    if (['Completed', 'Cancelled'].includes(appointment.status)) {
      return res.status(400).json({ message: `Cannot cancel an appointment that is already ${appointment.status}.` });
    }

    appointment.status = 'Cancelled';
    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('service', 'name category duration price image')
      .populate('staff', 'name title specialty avatar');

    const slotLabel = formatSlotLabel(appointment.timeSlot);
    const svcName = populated.service?.name || 'Salon Service';

    // Notify both customer and owner(s) on cancellation
    await Promise.all([
      notifyUser({
        recipientUser: req.user,
        type: 'BOOKING_CANCELLED',
        title: 'Appointment Cancelled',
        message: `Your ${svcName} appointment on ${appointment.date} at ${slotLabel} has been cancelled.`,
        appointmentId: appointment._id,
      }),
      notifyOwners({
        type: 'BOOKING_CANCELLED',
        title: 'Client Cancelled Appointment',
        message: `${req.user.name} cancelled their ${svcName} appointment on ${appointment.date} at ${slotLabel}.`,
        appointmentId: appointment._id,
      }),
    ]);

    res.json({ appointment: populated });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to cancel appointment.' });
  }
}

export async function getAllAppointments(req, res) {
  try {
    const { date, status, search } = req.query;
    const filter = {};
    if (date) filter.date = date;
    if (status && status !== 'All') filter.status = status;

    let appointments = await Appointment.find(filter)
      .populate('customer', 'name email phone')
      .populate('service', 'name category duration price')
      .populate('staff', 'name title')
      .sort({ date: -1, timeSlot: -1 });

    if (search) {
      const q = search.toLowerCase();
      appointments = appointments.filter(
        (a) =>
          a.customer?.name?.toLowerCase().includes(q) ||
          a.customer?.email?.toLowerCase().includes(q) ||
          a.walkInCustomer?.name?.toLowerCase().includes(q) ||
          a.walkInCustomer?.phone?.toLowerCase().includes(q) ||
          a.service?.name?.toLowerCase().includes(q) ||
          a.staff?.name?.toLowerCase().includes(q)
      );
    }

    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load appointments.' });
  }
}

export async function updateAppointmentStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = [
      'Booked',
      'Pending',
      'Confirmed',
      'In Progress',
      'Payment Pending',
      'Paid',
      'Completed',
      'Cancelled',
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid appointment status.' });
    }

    const existing = await Appointment.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    if (req.user.role === 'demo_owner') {
      const isOwnedByDemo =
        existing.customer && existing.customer.toString() === req.user._id.toString();
      if (!isOwnedByDemo) {
        return res.status(403).json({
          message: 'Demo Owner has read-only access and can only modify their own appointments.',
        });
      }
      if (['Paid', 'Payment Pending', 'Completed'].includes(status)) {
        return res.status(403).json({
          message: 'Demo Owner cannot modify payment or financial statuses.',
        });
      }
    }

    if (status === 'Completed' && existing.paymentStatus !== 'Paid') {
      return res.status(400).json({
        message: 'Payment must be collected and confirmed before marking the appointment as Completed.',
      });
    }

    const updateFields = { status };
    if (status === 'Payment Pending' && existing.paymentStatus === 'Unpaid') {
      updateFields.paymentStatus = 'Payment Pending';
    }
    if (status === 'Completed' && !existing.completedAt) {
      updateFields.completedAt = new Date();
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    )
      .populate('customer', 'name email phone notificationPreferences')
      .populate('service', 'name category duration price')
      .populate('staff', 'name title');

    const slotLabel = formatSlotLabel(appointment.timeSlot);
    const svcName = appointment.service?.name || 'Salon Service';

    if (status === 'Confirmed' && appointment.customer) {
      await notifyUser({
        recipientUser: appointment.customer,
        type: 'BOOKING_CONFIRMED',
        title: 'Appointment Confirmed',
        message: `Your ${svcName} appointment with ${appointment.staff?.name || 'our stylist'} on ${appointment.date} at ${slotLabel} is confirmed.`,
        appointmentId: appointment._id,
      });
    } else if (status === 'Cancelled' && appointment.customer) {
      await Promise.all([
        notifyUser({
          recipientUser: appointment.customer,
          type: 'BOOKING_CANCELLED',
          title: 'Appointment Cancelled',
          message: `Your ${svcName} appointment on ${appointment.date} at ${slotLabel} has been cancelled by the salon.`,
          appointmentId: appointment._id,
        }),
        notifyOwners({
          type: 'BOOKING_CANCELLED',
          title: 'Appointment Cancelled',
          message: `Appointment for ${appointment.customer.name} (${svcName}) on ${appointment.date} at ${slotLabel} was marked Cancelled.`,
          appointmentId: appointment._id,
        }),
      ]);
    }

    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update appointment status.' });
  }
}
