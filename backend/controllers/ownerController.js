import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Payment from '../models/Payment.js';
import Transaction from '../models/Transaction.js';
import WalkInProfile from '../models/WalkInProfile.js';
import Expense from '../models/Expense.js';
import {
  getISTDateString,
  getISTMonthPrefix,
  getISTOffsetDateString,
} from '../utils/timezone.js';

export async function getCustomers(req, res) {
  try {
    const [customers, walkIns, appointments] = await Promise.all([
      User.find({ role: { $in: ['customer', 'user'] } }).sort({ createdAt: -1 }).lean(),
      WalkInProfile.find().sort({ createdAt: -1 }).lean(),
      Appointment.find()
        .populate('service', 'name price duration')
        .populate('staff', 'name')
        .sort({ date: -1, timeSlot: -1 })
        .lean(),
    ]);

    const apptsByCustomer = {};
    const apptsByWalkInPhone = {};

    for (const appt of appointments) {
      if (appt.customer) {
        const cid = appt.customer.toString();
        if (!apptsByCustomer[cid]) apptsByCustomer[cid] = [];
        apptsByCustomer[cid].push(appt);
      } else if (appt.isWalkIn && appt.walkInCustomer?.phone) {
        const phoneKey = appt.walkInCustomer.phone.trim();
        if (!apptsByWalkInPhone[phoneKey]) apptsByWalkInPhone[phoneKey] = [];
        apptsByWalkInPhone[phoneKey].push(appt);
      }
    }

    const registeredList = customers.map((c) => {
      const history = apptsByCustomer[c._id.toString()] || [];
      const completedVisits = history.filter((h) => h.status === 'Completed').length;
      const totalSpent = history
        .filter((h) => h.status === 'Completed' && h.paymentStatus === 'Paid')
        .reduce((sum, h) => sum + (h.finalAmount ?? h.price ?? 0), 0);

      return {
        id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        isWalkInOnly: false,
        createdAt: c.createdAt,
        totalVisits: completedVisits,
        totalBookings: history.length,
        totalSpent,
        lastVisitDate: history[0]?.date || null,
        history,
      };
    });

    const walkInList = walkIns.map((w) => {
      const history = apptsByWalkInPhone[w.phone.trim()] || [];
      const completedVisits = history.filter((h) => h.status === 'Completed').length;
      const totalSpent = history
        .filter((h) => h.status === 'Completed' && h.paymentStatus === 'Paid')
        .reduce((sum, h) => sum + (h.finalAmount ?? h.price ?? 0), 0);

      return {
        id: `walkin-${w._id}`,
        name: w.name || 'Walk-in Guest',
        email: w.email || 'Walk-in (No Account)',
        phone: w.phone,
        isWalkInOnly: !w.email,
        createdAt: w.createdAt,
        totalVisits: completedVisits,
        totalBookings: history.length,
        totalSpent,
        lastVisitDate: history[0]?.date || null,
        history,
      };
    });

    res.json({ customers: [...walkInList, ...registeredList] });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load customers.' });
  }
}

export async function getExpenses(req, res) {
  try {
    const expenses = await Expense.find().sort({ istDate: -1, createdAt: -1 }).lean();
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    res.json({ expenses, totalExpenses });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load expenses.' });
  }
}

export async function createExpense(req, res) {
  try {
    const { title, category = 'Salon Supplies', amount, istDate, notes = '' } = req.body;
    const numericAmount = Number(amount);
    if (!title || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Valid expense title and amount (> 0) are required.' });
    }

    const expense = await Expense.create({
      title: title.trim(),
      category,
      amount: numericAmount,
      istDate: istDate || getISTDateString(),
      notes: notes.trim(),
      recordedBy: req.user._id,
    });

    res.status(201).json({ expense });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to record expense.' });
  }
}

export async function deleteExpense(req, res) {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Expense not found.' });
    }
    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to delete expense.' });
  }
}

export async function getOverviewAnalytics(req, res) {
  try {
    const todayStr = getISTDateString();
    const currentMonthPrefix = getISTMonthPrefix();
    const { range = '6months', startDate, endDate } = req.query;

    // Determine date filter window in IST
    let filterStart = startDate || '';
    const filterEnd = endDate || todayStr;
    if (!filterStart) {
      if (range === 'weekly') filterStart = getISTOffsetDateString(-6);
      else if (range === 'monthly') filterStart = `${currentMonthPrefix}-01`;
      else filterStart = getISTOffsetDateString(-180); // 6 months
    }

    const apptDateMatch = filterStart ? { date: { $gte: filterStart, $lte: filterEnd } } : {};
    const payDateMatch = filterStart ? { istDate: { $gte: filterStart, $lte: filterEnd } } : {};

    const nowIST = new Date(`${todayStr}T12:00:00+05:30`);
    const prevMonthObj = new Date(nowIST.getFullYear(), nowIST.getMonth() - 1, 1);
    const prevMonthPrefix = `${prevMonthObj.getFullYear()}-${String(prevMonthObj.getMonth() + 1).padStart(2, '0')}`;

    const [
      totalRegisteredCustomers,
      totalWalkIns,
      apptStatsAgg,
      paymentTotalsAgg,
      paymentByMethodAgg,
      expenseAgg,
      dailyAgg,
      monthlyApptAgg,
      monthlyPayAgg,
      servicePerfAgg,
      categoryRevAgg,
      customerFreqAgg,
      topCustomersAgg,
      recentTransactions,
      todayAppointmentsCount,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['customer', 'user'] } }),
      WalkInProfile.countDocuments(),

      // 1. Booking status counts via aggregation
      Appointment.aggregate([
        { $match: apptDateMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // 2. Total & Today & Monthly & Prev-Month Paid Revenue
      Payment.aggregate([
        { $match: { status: 'Paid' } },
        {
          $group: {
            _id: null,
            allTimeRevenue: { $sum: '$finalAmount' },
            allTimeCount: { $sum: 1 },
            todayRevenue: {
              $sum: { $cond: [{ $eq: ['$istDate', todayStr] }, '$finalAmount', 0] },
            },
            currentMonthRevenue: {
              $sum: {
                $cond: [
                  { $eq: [{ $substr: ['$istDate', 0, 7] }, currentMonthPrefix] },
                  '$finalAmount',
                  0,
                ],
              },
            },
            prevMonthRevenue: {
              $sum: {
                $cond: [
                  { $eq: [{ $substr: ['$istDate', 0, 7] }, prevMonthPrefix] },
                  '$finalAmount',
                  0,
                ],
              },
            },
            rangeRevenue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$istDate', filterStart] },
                      { $lte: ['$istDate', filterEnd] },
                    ],
                  },
                  '$finalAmount',
                  0,
                ],
              },
            },
            rangeCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$istDate', filterStart] },
                      { $lte: ['$istDate', filterEnd] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),

      // 3. Payment method breakdown
      Payment.aggregate([
        { $match: { status: 'Paid', ...payDateMatch } },
        { $group: { _id: '$paymentMethod', total: { $sum: '$finalAmount' } } },
      ]),

      // 4. Expenses aggregation
      Expense.aggregate([
        { $match: payDateMatch },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: '$amount' },
            expenseCount: { $sum: 1 },
          },
        },
      ]),

      // 5. Last 7 days daily revenue
      Payment.aggregate([
        {
          $match: {
            status: 'Paid',
            istDate: { $gte: getISTOffsetDateString(-6), $lte: todayStr },
          },
        },
        { $group: { _id: '$istDate', revenue: { $sum: '$finalAmount' }, count: { $sum: 1 } } },
      ]),

      // 6. Monthly booking trends (6 months)
      Appointment.aggregate([
        {
          $match: {
            date: { $gte: getISTOffsetDateString(-185) },
          },
        },
        {
          $group: {
            _id: { $substr: ['$date', 0, 7] },
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
          },
        },
      ]),

      // 7. Monthly revenue trends (6 months)
      Payment.aggregate([
        {
          $match: {
            status: 'Paid',
            istDate: { $gte: getISTOffsetDateString(-185) },
          },
        },
        {
          $group: {
            _id: { $substr: ['$istDate', 0, 7] },
            revenue: { $sum: '$finalAmount' },
            payments: { $sum: 1 },
          },
        },
      ]),

      // 8. Service-wise performance
      Appointment.aggregate([
        { $match: apptDateMatch },
        {
          $group: {
            _id: '$service',
            bookings: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
            revenue: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$status', 'Completed'] }, { $eq: ['$paymentStatus', 'Paid'] }] },
                  { $ifNull: ['$finalAmount', '$price'] },
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'services',
            localField: '_id',
            foreignField: '_id',
            as: 'serviceDoc',
          },
        },
        { $unwind: { path: '$serviceDoc', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: { $ifNull: ['$serviceDoc.name', 'Removed Service'] },
            category: { $ifNull: ['$serviceDoc.category', 'Other'] },
            bookings: 1,
            completed: 1,
            cancelled: 1,
            revenue: 1,
          },
        },
        { $sort: { bookings: -1 } },
      ]),

      // 9. Category revenue breakdown
      Payment.aggregate([
        { $match: { status: 'Paid', ...payDateMatch } },
        {
          $lookup: {
            from: 'services',
            localField: 'service',
            foreignField: '_id',
            as: 'serviceDoc',
          },
        },
        { $unwind: { path: '$serviceDoc', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$serviceDoc.category', 'Other'] },
            value: { $sum: '$finalAmount' },
          },
        },
        { $project: { _id: 0, name: '$_id', value: 1 } },
      ]),

      // 10. Customer booking frequency (non-cancelled, both registered & historical/walk-in profiles)
      Appointment.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: { $ifNull: ['$customer', '$walkInCustomer.phone'] }, count: { $sum: 1 } } },
        {
          $group: {
            _id: null,
            uniqueCustomersWithBookings: { $sum: 1 },
            totalCustomerBookings: { $sum: '$count' },
            repeatCustomers: { $sum: { $cond: [{ $gte: ['$count', 2] }, 1, 0] } },
          },
        },
      ]),

      // 11. Highest-spending customers
      Payment.aggregate([
        { $match: { status: 'Paid', ...payDateMatch } },
        {
          $group: {
            _id: { $ifNull: ['$customer', '$customerPhone'] },
            name: { $first: '$customerName' },
            phone: { $first: '$customerPhone' },
            totalSpent: { $sum: '$finalAmount' },
            visits: { $sum: 1 },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
      ]),

      Transaction.find().sort({ occurredAt: -1 }).limit(8).lean(),
      Appointment.countDocuments({ date: todayStr }),
    ]);

    const statusCounts = {};
    for (const row of apptStatsAgg) {
      statusCounts[row._id] = row.count;
    }

    const pendingBookings = (statusCounts.Booked || 0) + (statusCounts.Pending || 0);
    const confirmedBookings = statusCounts.Confirmed || 0;
    const inProgressBookings = statusCounts['In Progress'] || 0;
    const paymentPendingBookings = statusCounts['Payment Pending'] || 0;
    const paidBookings = statusCounts.Paid || 0;
    const completedBookings = statusCounts.Completed || 0;
    const cancelledBookings = statusCounts.Cancelled || 0;

    const acceptedBookings =
      confirmedBookings +
      inProgressBookings +
      paymentPendingBookings +
      paidBookings +
      completedBookings;

    const totalBookings =
      pendingBookings + acceptedBookings + cancelledBookings;

    const paySummary = paymentTotalsAgg[0] || {};
    const totalRevenue = paySummary.rangeRevenue || 0;
    const paidCount = paySummary.rangeCount || 0;
    const todayCollectedRevenue = paySummary.todayRevenue || 0;
    const monthlyRevenue = paySummary.currentMonthRevenue || 0;
    const prevMonthRevenue = paySummary.prevMonthRevenue || 0;

    const revenueGrowth =
      prevMonthRevenue > 0
        ? Number((((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1))
        : null;

    const expSummary = expenseAgg[0] || {};
    const totalExpenses = expSummary.totalExpenses || 0;
    const expenseCount = expSummary.expenseCount || 0;
    const netProfit = expenseCount > 0 ? totalRevenue - totalExpenses : null;

    const methodMap = { Cash: 0, UPI: 0, Card: 0 };
    for (const m of paymentByMethodAgg) {
      methodMap[m._id] = m.total;
    }

    const cancellationRate =
      totalBookings > 0 ? Number(((cancelledBookings / totalBookings) * 100).toFixed(1)) : 0;
    const averageBookingValue = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

    const freqData = customerFreqAgg[0] || {};
    const avgBookingsPerCustomer =
      freqData.uniqueCustomersWithBookings > 0
        ? Number((freqData.totalCustomerBookings / freqData.uniqueCustomersWithBookings).toFixed(1))
        : 0;

    // Build continuous 7-day series
    const dailyMap = Object.fromEntries(dailyAgg.map((d) => [d._id, d]));
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const ymd = getISTOffsetDateString(-i);
      const d = new Date(`${ymd}T12:00:00+05:30`);
      dailyRevenue.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
        date: ymd,
        revenue: dailyMap[ymd]?.revenue || 0,
        appointments: dailyMap[ymd]?.count || 0,
      });
    }

    // Build continuous 4-week series from payments
    const weeklyRevenue = [];
    for (let w = 3; w >= 0; w--) {
      const endStr = getISTOffsetDateString(-w * 7);
      const startStr = getISTOffsetDateString(-w * 7 - 6);
      const startObj = new Date(`${startStr}T12:00:00+05:30`);
      const weekRes = await Payment.aggregate([
        { $match: { status: 'Paid', istDate: { $gte: startStr, $lte: endStr } } },
        { $group: { _id: null, rev: { $sum: '$finalAmount' }, cnt: { $sum: 1 } } },
      ]);
      weeklyRevenue.push({
        label: `Wk ${4 - w}`,
        range: startObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'Asia/Kolkata',
        }),
        revenue: weekRes[0]?.rev || 0,
        appointments: weekRes[0]?.cnt || 0,
      });
    }

    // Build continuous 6-month series (revenue + booking trends)
    const monthlyApptMap = Object.fromEntries(monthlyApptAgg.map((m) => [m._id, m]));
    const monthlyPayMap = Object.fromEntries(monthlyPayAgg.map((m) => [m._id, m]));
    const monthlyRevenueSeries = [];
    const monthlyBookingTrends = [];

    for (let m = 5; m >= 0; m--) {
      const d = new Date(nowIST.getFullYear(), nowIST.getMonth() - m, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      monthlyRevenueSeries.push({
        label,
        month: prefix,
        revenue: monthlyPayMap[prefix]?.revenue || 0,
        appointments: monthlyPayMap[prefix]?.payments || 0,
      });
      monthlyBookingTrends.push({
        label,
        month: prefix,
        total: monthlyApptMap[prefix]?.total || 0,
        completed: monthlyApptMap[prefix]?.completed || 0,
        cancelled: monthlyApptMap[prefix]?.cancelled || 0,
      });
    }

    const statusBreakdown = [
      { name: 'Completed', value: completedBookings },
      { name: 'Accepted', value: acceptedBookings - completedBookings },
      { name: 'Pending', value: pendingBookings },
      { name: 'Cancelled', value: cancelledBookings },
    ].filter((s) => s.value > 0);

    res.json({
      timezone: 'Asia/Kolkata',
      overview: {
        todayAppointmentsCount,
        totalCustomers: totalRegisteredCustomers + totalWalkIns,
        todayCollectedRevenue,
        monthlyRevenue,
        totalRevenue,
        totalExpenses,
        expenseCount,
        netProfit,
        revenueGrowth,
        totalBookings,
        acceptedBookings,
        pendingCount: pendingBookings,
        pendingBookings,
        completedCount: completedBookings,
        totalCompletedServices: completedBookings,
        cancelledBookings,
        pendingPaymentsCount: inProgressBookings + paymentPendingBookings,
        cancellationRate,
        averageBookingValue,
        avgBookingsPerCustomer,
        repeatCustomersCount: freqData.repeatCustomers || 0,
        cashCollections: methodMap.Cash,
        upiCollections: methodMap.UPI,
        cardCollections: methodMap.Card,
      },
      recentTransactions,
      charts: {
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenueSeries,
        monthlyBookingTrends,
        popularServices: servicePerfAgg.slice(0, 6),
        servicePerformance: servicePerfAgg,
        revenueBreakdown: categoryRevAgg,
        statusBreakdown,
        topCustomers: topCustomersAgg,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load analytics.' });
  }
}
