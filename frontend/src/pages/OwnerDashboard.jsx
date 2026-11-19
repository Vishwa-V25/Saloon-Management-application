import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Scissors,
  Users,
  BarChart3,
  Receipt,
  UserPlus,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  Info,
  IndianRupee,
  Clock,
  CheckCircle2,
  Play,
  CreditCard,
  Smartphone,
  Banknote,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import StatusBadge from '../components/StatusBadge';
import api from '../api/client';
import { formatINR } from '../utils/currency';
import { useAuth } from '../context/AuthContext';

const GOLD_COLORS = ['#C59B43', '#17171A', '#836124', '#E9D6A8', '#52525B'];

const EMPTY_SERVICE = {
  name: '',
  category: 'Haircut & Styling',
  description: '',
  duration: 60,
  price: 1200,
  image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
  isPopular: false,
  isAvailable: true,
  specialOfferText: '',
};

function formatISTDateTime(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const isDemoOwner = user?.role === 'demo_owner';
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactionsData, setTransactionsData] = useState({ transactions: [], summary: {} });
  const [expensesData, setExpensesData] = useState({ expenses: [], totalExpenses: 0 });
  const [loading, setLoading] = useState(true);

  // Analytics date filters
  const [analyticsRange, setAnalyticsRange] = useState('6months');
  const [analyticsStartDate, setAnalyticsStartDate] = useState('');
  const [analyticsEndDate, setAnalyticsEndDate] = useState('');
  const [revTimeframe, setRevTimeframe] = useState('monthly');

  // Appointment & Transaction Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [txnMethodFilter, setTxnMethodFilter] = useState('All');

  // Service modal state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE);

  // Payment Collection Modal state
  const [paymentAppt, setPaymentAppt] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    additionalCharges: 0,
    discount: 0,
    paymentMethod: 'UPI',
    notes: '',
  });
  const [collectingPayment, setCollectingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Walk-in Customer Modal state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    customerName: '',
    phone: '',
    serviceId: '',
    staffId: '',
    amount: '',
    paymentMethod: 'Cash',
    notes: '',
  });
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);
  const [walkInError, setWalkInError] = useState('');

  // Expense Modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Salon Supplies',
    amount: '',
    istDate: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
    notes: '',
  });
  const [savingExpense, setSavingExpense] = useState(false);

  // Customer detail drawer/modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Demo Owner own-booking modal state
  const [showDemoBookModal, setShowDemoBookModal] = useState(false);
  const [demoBookForm, setDemoBookForm] = useState({
    serviceId: '',
    staffId: 'any',
    date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
    timeSlot: '11:00',
    notes: '',
  });
  const [demoBookError, setDemoBookError] = useState('');
  const [submittingDemoBook, setSubmittingDemoBook] = useState(false);

  const buildAnalyticsQuery = () => {
    const params = new URLSearchParams({ range: analyticsRange });
    if (analyticsStartDate) params.set('startDate', analyticsStartDate);
    if (analyticsEndDate) params.set('endDate', analyticsEndDate);
    return params.toString();
  };

  const loadAllOwnerData = async () => {
    setLoading(true);
    try {
      const [anaRes, apptRes, svcRes, stfRes, custRes, txnRes, expRes] = await Promise.all([
        api.get(`/owner/analytics?${buildAnalyticsQuery()}`),
        api.get('/appointments'),
        api.get('/services'),
        api.get('/staff'),
        api.get('/owner/customers'),
        api.get('/payments/transactions'),
        api.get('/owner/expenses'),
      ]);
      setAnalytics(anaRes.data);
      setAppointments(apptRes.data.appointments || []);
      const svcs = svcRes.data.services || [];
      setServices(svcs);
      const stfs = stfRes.data.staff || [];
      setStaffList(stfs);
      setCustomers(custRes.data.customers || []);
      setTransactionsData(txnRes.data || { transactions: [], summary: {} });
      setExpensesData(expRes.data || { expenses: [], totalExpenses: 0 });

      setWalkInForm((prev) => ({
        ...prev,
        serviceId: prev.serviceId || svcs[0]?._id || '',
        staffId: prev.staffId || stfs[0]?._id || '',
        amount: prev.amount || (svcs[0]?.price ? String(svcs[0].price) : ''),
      }));
      setDemoBookForm((prev) => ({
        ...prev,
        serviceId: prev.serviceId || svcs[0]?._id || '',
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllOwnerData();
  }, [analyticsRange, analyticsStartDate, analyticsEndDate]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      await loadAllOwnerData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const openPaymentModal = (appt) => {
    setPaymentAppt(appt);
    setPaymentForm({
      additionalCharges: 0,
      discount: 0,
      paymentMethod: 'UPI',
      notes: '',
    });
    setPaymentError('');
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!paymentAppt || collectingPayment) return;
    setCollectingPayment(true);
    setPaymentError('');
    try {
      await api.post(`/payments/collect/${paymentAppt._id}`, {
        additionalCharges: Number(paymentForm.additionalCharges) || 0,
        discount: Number(paymentForm.discount) || 0,
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes,
      });
      setPaymentAppt(null);
      await loadAllOwnerData();
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setCollectingPayment(false);
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (submittingWalkIn) return;
    setSubmittingWalkIn(true);
    setWalkInError('');
    try {
      await api.post('/payments/walk-in', {
        ...walkInForm,
        amount: Number(walkInForm.amount),
      });
      setShowWalkInModal(false);
      setWalkInForm({
        customerName: '',
        phone: '',
        serviceId: services[0]?._id || '',
        staffId: staffList[0]?._id || '',
        amount: services[0]?.price ? String(services[0].price) : '',
        paymentMethod: 'Cash',
        notes: '',
      });
      await loadAllOwnerData();
    } catch (err) {
      setWalkInError(err.response?.data?.message || 'Failed to record walk-in payment.');
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (savingExpense) return;
    setSavingExpense(true);
    try {
      await api.post('/owner/expenses', {
        ...expenseForm,
        amount: Number(expenseForm.amount),
      });
      setShowExpenseModal(false);
      setExpenseForm({
        title: '',
        category: 'Salon Supplies',
        amount: '',
        istDate: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
        notes: '',
      });
      await loadAllOwnerData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record expense.');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense record?')) return;
    try {
      await api.delete(`/owner/expenses/${id}`);
      await loadAllOwnerData();
    } catch {
      alert('Failed to delete expense.');
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      if (editingServiceId) {
        await api.put(`/services/${editingServiceId}`, serviceForm);
      } else {
        await api.post('/services', serviceForm);
      }
      setShowServiceModal(false);
      setEditingServiceId(null);
      setServiceForm(EMPTY_SERVICE);
      await loadAllOwnerData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save service.');
    }
  };

  const handleToggleAvailability = async (svc) => {
    try {
      await api.put(`/services/${svc._id}`, { isAvailable: !svc.isAvailable });
      await loadAllOwnerData();
    } catch {
      alert('Failed to update availability.');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await api.delete(`/services/${id}`);
      await loadAllOwnerData();
    } catch {
      alert('Failed to delete service.');
    }
  };

  const openEditService = (svc) => {
    setEditingServiceId(svc._id);
    setServiceForm({
      name: svc.name,
      category: svc.category,
      description: svc.description,
      duration: svc.duration,
      price: svc.price,
      image: svc.image || '',
      isPopular: svc.isPopular,
      isAvailable: svc.isAvailable,
      specialOfferText: svc.specialOfferText || '',
    });
    setShowServiceModal(true);
  };

  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    if (dateFilter && a.date !== dateFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const custName = a.customer?.name || a.walkInCustomer?.name || '';
      const custPhone = a.customer?.phone || a.walkInCustomer?.phone || '';
      const match =
        custName.toLowerCase().includes(q) ||
        custPhone.toLowerCase().includes(q) ||
        a.customer?.email?.toLowerCase().includes(q) ||
        a.service?.name?.toLowerCase().includes(q) ||
        a.staff?.name?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const filteredTransactions = (transactionsData.transactions || []).filter((t) =>
    txnMethodFilter === 'All' ? true : t.paymentMethod === txnMethodFilter
  );

  const overview = analytics?.overview || {};
  const charts = analytics?.charts || {};
  const recentTransactions = analytics?.recentTransactions || [];
  const txnSummary = transactionsData.summary || {};

  const revenueSeries =
    revTimeframe === 'daily'
      ? charts.dailyRevenue || []
      : revTimeframe === 'weekly'
      ? charts.weeklyRevenue || []
      : charts.monthlyRevenueSeries || [];

  const computedPayable = paymentAppt
    ? Math.max(
        0,
        Number(paymentAppt.price || 0) +
          (Number(paymentForm.additionalCharges) || 0) -
          (Number(paymentForm.discount) || 0)
      )
    : 0;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: CalendarCheck,
      badge: overview.pendingCount || 0,
    },
    { id: 'payments', label: 'Payments & Expenses', icon: Receipt },
    { id: 'services', label: 'Services', icon: Scissors },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'analytics', label: 'Income Analytics', icon: BarChart3 },
  ];

  const handleDemoBookSubmit = async (e) => {
    e.preventDefault();
    if (submittingDemoBook) return;
    setSubmittingDemoBook(true);
    setDemoBookError('');
    try {
      await api.post('/appointments', demoBookForm);
      setShowDemoBookModal(false);
      await loadAllOwnerData();
    } catch (err) {
      setDemoBookError(err.response?.data?.message || 'Could not create demo booking.');
    } finally {
      setSubmittingDemoBook(false);
    }
  };

  const renderLifecycleActions = (a) => {
    const isOwnedByDemo =
      isDemoOwner && a.customer && (a.customer._id === user?.id || a.customer === user?.id);

    if (isDemoOwner && !isOwnedByDemo) {
      return (
        <span className="inline-block text-[11px] text-zinc-500 font-medium px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200">
          Read-Only
        </span>
      );
    }

    if (a.status === 'Booked' || a.status === 'Pending') {
      return (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleStatusChange(a._id, 'Confirmed')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
          >
            <Check className="w-3.5 h-3.5" /> Confirm
          </button>
          <button
            onClick={() => handleStatusChange(a._id, 'Cancelled')}
            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
          >
            Cancel
          </button>
        </div>
      );
    }

    if (a.status === 'Confirmed') {
      return (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleStatusChange(a._id, 'In Progress')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition"
          >
            <Play className="w-3 h-3" /> Start Service
          </button>
          <button
            onClick={() => handleStatusChange(a._id, 'Cancelled')}
            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
          >
            Cancel
          </button>
        </div>
      );
    }

    if (a.status === 'In Progress') {
      if (isDemoOwner) {
        return (
          <button
            onClick={() => handleStatusChange(a._id, 'Cancelled')}
            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
          >
            Cancel
          </button>
        );
      }
      return (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openPaymentModal(a)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-obsidian hover:bg-zinc-800 text-gold-300 text-xs font-semibold transition"
          >
            <IndianRupee className="w-3.5 h-3.5" /> Finish Service
          </button>
          <button
            onClick={() => handleStatusChange(a._id, 'Payment Pending')}
            className="px-2.5 py-1.5 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-50 text-xs font-semibold transition"
          >
            Payment Pending
          </button>
        </div>
      );
    }

    if (a.status === 'Payment Pending') {
      return (
        <button
          onClick={() => openPaymentModal(a)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-obsidian text-xs font-semibold transition"
        >
          <IndianRupee className="w-3.5 h-3.5" /> Collect Payment
        </button>
      );
    }

    if (a.status === 'Paid') {
      return (
        <button
          onClick={() => handleStatusChange(a._id, 'Completed')}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
        </button>
      );
    }

    return (
      <span className="text-xs text-zinc-400 font-medium">
        {a.paymentStatus === 'Paid' ? 'Paid & Closed' : 'Closed'}
      </span>
    );
  };

  return (
    <DashboardLayout
      portalLabel={isDemoOwner ? 'Demo Owner – Restricted Access' : 'Owner Management'}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {isDemoOwner && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
          <span>
            <strong>Demo Owner – Restricted Access:</strong> You can explore the entire owner dashboard, analytics, customers, and appointments in read-only mode. Creating or modifying bookings is restricted to your own demo appointments.
          </span>
        </div>
      )}

      {/* Top Action Bar with Walk-in / Demo Booking Button */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="px-4 py-2.5 rounded-2xl bg-champagne border border-gold-300/70 flex items-center gap-2 text-xs text-zinc-700">
          <Info className="w-4 h-4 text-gold-700 shrink-0" />
          <span>
            Revenue reflects <strong>actual collected payments</strong> (Asia/Kolkata IST). Unpaid or cancelled bookings are excluded.
          </span>
        </div>

        {isDemoOwner ? (
          <button
            onClick={() => {
              setDemoBookError('');
              setShowDemoBookModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-obsidian hover:bg-zinc-800 text-gold-300 font-semibold text-sm px-5 py-3 rounded-full shadow-luxury transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Demo Booking
          </button>
        ) : (
          <button
            onClick={() => {
              setWalkInError('');
              setShowWalkInModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-obsidian hover:bg-zinc-800 text-gold-300 font-semibold text-sm px-5 py-3 rounded-full shadow-luxury transition shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Add Walk-in Customer
          </button>
        )}
      </div>

      {loading && !analytics ? (
        <div className="py-20 text-center text-sm text-zinc-500">Loading owner dashboard...</div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    label: "Today's Collected Revenue",
                    value: formatINR(overview.todayCollectedRevenue ?? 0),
                    icon: IndianRupee,
                    sub: 'Actual paid today (IST)',
                    highlight: true,
                  },
                  {
                    label: 'Monthly Collected Revenue',
                    value: formatINR(overview.monthlyRevenue ?? 0),
                    icon: BarChart3,
                    sub:
                      overview.revenueGrowth !== null && overview.revenueGrowth !== undefined
                        ? `${overview.revenueGrowth >= 0 ? '+' : ''}${overview.revenueGrowth}% vs last month`
                        : 'Paid this month (IST)',
                    highlight: true,
                  },
                  {
                    label: 'Total Completed Services',
                    value: overview.totalCompletedServices ?? 0,
                    icon: CheckCircle2,
                    sub: 'Online & walk-in completed',
                  },
                  {
                    label: 'Pending Payments',
                    value: overview.pendingPaymentsCount ?? 0,
                    icon: Clock,
                    sub: 'In progress / payment pending',
                  },
                  {
                    label: "Today's Appointments",
                    value: overview.todayAppointmentsCount ?? 0,
                    icon: CalendarCheck,
                    sub: 'Scheduled today (IST)',
                  },
                  {
                    label: 'Total Customers',
                    value: overview.totalCustomers ?? 0,
                    icon: Users,
                    sub: 'Registered & walk-in clients',
                  },
                ].map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <div
                      key={kpi.label}
                      className={`rounded-2xl p-5 border shadow-sm ${
                        kpi.highlight
                          ? 'bg-obsidian text-ivory border-zinc-800'
                          : 'bg-white text-obsidian border-zinc-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs font-medium ${
                            kpi.highlight ? 'text-zinc-400' : 'text-zinc-500'
                          }`}
                        >
                          {kpi.label}
                        </p>
                        <Icon
                          className={`w-4 h-4 ${
                            kpi.highlight ? 'text-gold-400' : 'text-gold-600'
                          }`}
                        />
                      </div>
                      <p
                        className={`font-serif text-3xl sm:text-4xl font-semibold mt-2 ${
                          kpi.highlight ? 'text-gold-300' : 'text-obsidian'
                        }`}
                      >
                        {kpi.value}
                      </p>
                      <p className="text-[11px] mt-1 text-zinc-400">{kpi.sub}</p>
                    </div>
                  );
                })}
              </div>

              {/* Payment Method Collections Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Cash Collections',
                    value: overview.cashCollections ?? 0,
                    icon: Banknote,
                    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                  },
                  {
                    label: 'UPI Collections',
                    value: overview.upiCollections ?? 0,
                    icon: Smartphone,
                    color: 'text-sky-700 bg-sky-50 border-sky-200',
                  },
                  {
                    label: 'Card Collections',
                    value: overview.cardCollections ?? 0,
                    icon: CreditCard,
                    color: 'text-amber-700 bg-amber-50 border-amber-200',
                  },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.label}
                      className="bg-white rounded-2xl p-4 border border-zinc-200/80 flex items-center justify-between shadow-sm"
                    >
                      <div>
                        <p className="text-xs font-medium text-zinc-500">{m.label}</p>
                        <p className="font-serif text-2xl font-semibold text-obsidian mt-1">
                          {formatINR(m.value)}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl border ${m.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Queue + Recent Transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-2xl font-semibold text-obsidian">
                      Active Queue & Approvals
                    </h3>
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="text-xs font-semibold text-gold-700 hover:underline"
                    >
                      Manage All →
                    </button>
                  </div>

                  {appointments.filter((a) =>
                    ['Booked', 'Pending', 'Confirmed', 'In Progress', 'Payment Pending'].includes(
                      a.status
                    )
                  ).length === 0 ? (
                    <p className="text-sm text-zinc-500 py-6 text-center">
                      No active appointments in the queue.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {appointments
                        .filter((a) =>
                          ['Booked', 'Pending', 'Confirmed', 'In Progress', 'Payment Pending'].includes(
                            a.status
                          )
                        )
                        .slice(0, 5)
                        .map((a) => (
                          <div
                            key={a._id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-zinc-200"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-obsidian">
                                  {a.customer?.name || a.walkInCustomer?.name}
                                </p>
                                <StatusBadge status={a.status} />
                              </div>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {a.service?.name} • {a.date} {a.timeSlot} • {formatINR(a.price)}
                              </p>
                            </div>
                            <div>{renderLifecycleActions(a)}</div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-6 bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-2xl font-semibold text-obsidian">
                      Recent Transactions
                    </h3>
                    <button
                      onClick={() => setActiveTab('payments')}
                      className="text-xs font-semibold text-gold-700 hover:underline"
                    >
                      View All →
                    </button>
                  </div>
                  {recentTransactions.length === 0 ? (
                    <p className="text-sm text-zinc-500 py-6 text-center">
                      No transactions recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {recentTransactions.slice(0, 6).map((t) => (
                        <div
                          key={t._id}
                          className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-obsidian">
                              {t.customerName}{' '}
                              {t.isWalkIn && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-champagne text-gold-700 ml-1">
                                  Walk-in
                                </span>
                              )}
                            </p>
                            <p className="text-zinc-500 mt-0.5">
                              {t.serviceName} • {t.paymentMethod} • {formatISTDateTime(t.occurredAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm text-emerald-700">
                              {formatINR(t.amount)}
                            </p>
                            <p className="text-[10px] text-zinc-400">{t.referenceId}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* APPOINTMENTS MANAGEMENT TAB */}
          {activeTab === 'appointments' && (
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-obsidian">
                    Appointment Lifecycle Management
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Progress bookings from Booked → Confirmed → In Progress → Payment & Completion.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search client or service..."
                      className="pl-9 pr-3 py-2 rounded-xl border border-zinc-300 text-xs outline-none focus:border-gold-500"
                    />
                  </div>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-zinc-300 text-xs outline-none focus:border-gold-500"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-zinc-300 text-xs outline-none focus:border-gold-500"
                  >
                    {[
                      'All',
                      'Booked',
                      'Pending',
                      'Confirmed',
                      'In Progress',
                      'Payment Pending',
                      'Paid',
                      'Completed',
                      'Cancelled',
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {(dateFilter || statusFilter !== 'All' || searchQuery) && (
                    <button
                      onClick={() => {
                        setDateFilter('');
                        setStatusFilter('All');
                        setSearchQuery('');
                      }}
                      className="text-xs text-gold-700 font-semibold hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                      <th className="py-3 pr-4">Customer</th>
                      <th className="py-3 pr-4">Service</th>
                      <th className="py-3 pr-4">Stylist</th>
                      <th className="py-3 pr-4">Date & Slot</th>
                      <th className="py-3 pr-4">Amount</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 text-right">Workflow Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredAppointments.map((a) => (
                      <tr key={a._id} className="hover:bg-zinc-50/70">
                        <td className="py-3.5 pr-4">
                          <p className="font-semibold text-obsidian">
                            {a.customer?.name || a.walkInCustomer?.name || 'Guest'}
                            {a.isWalkIn && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-champagne text-gold-700 font-medium">
                                Walk-in
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {a.customer?.phone || a.walkInCustomer?.phone}
                          </p>
                        </td>
                        <td className="py-3.5 pr-4 text-zinc-700">{a.service?.name}</td>
                        <td className="py-3.5 pr-4 text-zinc-600">{a.staff?.name}</td>
                        <td className="py-3.5 pr-4 text-zinc-600">
                          {a.date} • {a.timeSlot}
                        </td>
                        <td className="py-3.5 pr-4 font-semibold">
                          {formatINR(a.finalAmount ?? a.price)}
                        </td>
                        <td className="py-3.5 pr-4">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="py-3.5 text-right">{renderLifecycleActions(a)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAppointments.length === 0 && (
                  <p className="text-center text-sm text-zinc-500 py-8">
                    No appointments match your current filters.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* PAYMENTS & EXPENSES TAB */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Daily Revenue (Today IST)', val: txnSummary.dailyRevenue ?? 0 },
                  { label: 'Weekly Revenue (7 Days IST)', val: txnSummary.weeklyRevenue ?? 0 },
                  { label: 'Monthly Revenue (This Month IST)', val: txnSummary.monthlyRevenue ?? 0 },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="bg-obsidian text-ivory rounded-2xl p-5 border border-zinc-800 shadow-sm"
                  >
                    <p className="text-xs text-zinc-400">{card.label}</p>
                    <p className="font-serif text-3xl font-semibold text-gold-300 mt-1.5">
                      {formatINR(card.val)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Transaction History */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-2xl font-semibold text-obsidian">
                      Transaction History ({filteredTransactions.length})
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Immutable payment ledger recorded in Asia/Kolkata (IST).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {['All', 'Cash', 'UPI', 'Card'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setTxnMethodFilter(m)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                          txnMethodFilter === m
                            ? 'bg-obsidian text-gold-300'
                            : 'bg-zinc-100 text-zinc-600 hover:text-obsidian'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                        <th className="py-3 pr-4">Ref ID</th>
                        <th className="py-3 pr-4">Customer</th>
                        <th className="py-3 pr-4">Service</th>
                        <th className="py-3 pr-4">Amount</th>
                        <th className="py-3 pr-4">Method</th>
                        <th className="py-3 pr-4">Date & Time (IST)</th>
                        <th className="py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredTransactions.map((t) => (
                        <tr key={t._id} className="hover:bg-zinc-50/70">
                          <td className="py-3.5 pr-4 font-mono text-xs text-zinc-500">
                            {t.referenceId}
                          </td>
                          <td className="py-3.5 pr-4 font-semibold text-obsidian">
                            {t.customerName}
                            {t.isWalkIn && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-champagne text-gold-700 font-medium">
                                Walk-in
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 pr-4 text-zinc-700">{t.serviceName}</td>
                          <td className="py-3.5 pr-4 font-semibold text-emerald-700">
                            {formatINR(t.amount)}
                          </td>
                          <td className="py-3.5 pr-4 text-zinc-600">{t.paymentMethod}</td>
                          <td className="py-3.5 pr-4 text-xs text-zinc-500">
                            {formatISTDateTime(t.occurredAt)}
                          </td>
                          <td className="py-3.5">
                            <StatusBadge status={t.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTransactions.length === 0 && (
                    <p className="text-center text-sm text-zinc-500 py-8">
                      No transactions found.
                    </p>
                  )}
                </div>
              </div>

              {/* Expense Tracking Section */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-2xl font-semibold text-obsidian">
                      Salon Expenses ({formatINR(expensesData.totalExpenses || 0)})
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Track operational costs to calculate true net profit.
                    </p>
                  </div>
                  {!isDemoOwner && (
                    <button
                      onClick={() => setShowExpenseModal(true)}
                      className="inline-flex items-center gap-2 bg-obsidian hover:bg-zinc-800 text-gold-300 font-semibold text-xs px-4 py-2.5 rounded-full transition"
                    >
                      <Plus className="w-4 h-4" />
                      Record Expense
                    </button>
                  )}
                </div>

                {expensesData.expenses.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-6 text-center">
                    No expenses recorded yet. Net profit is only shown when expense records exist.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                          <th className="py-3 pr-4">Title</th>
                          <th className="py-3 pr-4">Category</th>
                          <th className="py-3 pr-4">Date (IST)</th>
                          <th className="py-3 pr-4">Amount</th>
                          <th className="py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {expensesData.expenses.map((exp) => (
                          <tr key={exp._id}>
                            <td className="py-3 pr-4 font-medium text-obsidian">{exp.title}</td>
                            <td className="py-3 pr-4 text-xs text-zinc-600">{exp.category}</td>
                            <td className="py-3 pr-4 text-xs text-zinc-500">{exp.istDate}</td>
                            <td className="py-3 pr-4 font-semibold text-rose-700">
                              {formatINR(exp.amount)}
                            </td>
                            <td className="py-3 text-right">
                              {!isDemoOwner ? (
                                <button
                                  onClick={() => handleDeleteExpense(exp._id)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                  title="Delete Expense"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-[11px] text-zinc-400">Read-Only</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Highest-Spending Customers */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
                <h3 className="font-serif text-2xl font-semibold text-obsidian mb-4">
                  Highest-Spending Customers
                </h3>
                {(charts.topCustomers || []).length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-6">
                    No customer spending data for this period.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {(charts.topCustomers || []).map((cust, idx) => (
                      <div
                        key={cust._id || idx}
                        className="p-4 rounded-xl bg-champagne/40 border border-gold-200/70"
                      >
                        <p className="text-[11px] font-semibold text-gold-700">#{idx + 1} Top Client</p>
                        <p className="font-semibold text-sm text-obsidian mt-1 truncate">
                          {cust.name}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">{cust.visits} paid visits</p>
                        <p className="font-serif text-xl font-semibold text-gold-700 mt-2">
                          {formatINR(cust.totalSpent)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SERVICES MANAGEMENT TAB */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-obsidian">
                    Service Menu ({services.length})
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Add, edit, price, or toggle availability of salon services.
                  </p>
                </div>
                {!isDemoOwner && (
                  <button
                    onClick={() => {
                      setEditingServiceId(null);
                      setServiceForm(EMPTY_SERVICE);
                      setShowServiceModal(true);
                    }}
                    className="inline-flex items-center gap-2 bg-obsidian hover:bg-zinc-800 text-gold-300 font-semibold text-sm px-5 py-2.5 rounded-full transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Service
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {services.map((svc) => (
                  <div
                    key={svc._id}
                    className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between ${
                      svc.isAvailable ? 'border-zinc-200/80' : 'border-zinc-200 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gold-700 bg-champagne px-2.5 py-0.5 rounded-full">
                          {svc.category}
                        </span>
                        <button
                          onClick={() => !isDemoOwner && handleToggleAvailability(svc)}
                          disabled={isDemoOwner}
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition ${
                            svc.isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                          } ${isDemoOwner ? 'cursor-default opacity-80' : ''}`}
                        >
                          {svc.isAvailable ? 'Available' : 'Unavailable'}
                        </button>
                      </div>
                      <h4 className="font-serif text-xl font-semibold text-obsidian mt-3">
                        {svc.name}
                      </h4>
                      <p className="text-xs text-zinc-600 mt-1.5 line-clamp-2">{svc.description}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
                      <div>
                        <span className="font-serif text-2xl font-semibold text-obsidian">
                          {formatINR(svc.price)}
                        </span>
                        <span className="text-xs text-zinc-500 ml-2">• {svc.duration} min</span>
                      </div>
                      {!isDemoOwner && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditService(svc)}
                            className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100"
                            title="Edit Service"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(svc._id)}
                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                            title="Delete Service"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOMERS MANAGEMENT TAB */}
          {activeTab === 'customers' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
                <h3 className="font-serif text-2xl font-semibold text-obsidian mb-4">
                  Customers & Walk-in Profiles ({customers.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                        <th className="py-3 pr-3">Client</th>
                        <th className="py-3 pr-3">Contact</th>
                        <th className="py-3 pr-3">Visits</th>
                        <th className="py-3">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {customers.map((c) => (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedCustomer(c)}
                          className={`cursor-pointer transition ${
                            selectedCustomer?.id === c.id ? 'bg-champagne/70' : 'hover:bg-zinc-50'
                          }`}
                        >
                          <td className="py-3 pr-3 font-semibold text-obsidian">
                            {c.name}
                            {c.isWalkInOnly && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-champagne text-gold-700 font-medium">
                                Walk-in
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-3 text-xs text-zinc-600">
                            <div>{c.email}</div>
                            <div className="text-zinc-400">{c.phone}</div>
                          </td>
                          <td className="py-3 pr-3 font-medium">{c.totalVisits}</td>
                          <td className="py-3 font-semibold text-gold-700">
                            {formatINR(c.totalSpent)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
                {selectedCustomer ? (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gold-600 font-semibold">
                      Client Profile
                    </p>
                    <h4 className="font-serif text-2xl font-semibold text-obsidian mt-1">
                      {selectedCustomer.name}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      {selectedCustomer.email} • {selectedCustomer.phone}
                    </p>

                    <div className="grid grid-cols-2 gap-3 my-5">
                      <div className="p-3 rounded-xl bg-champagne/60">
                        <p className="text-[11px] text-zinc-600">Completed Visits</p>
                        <p className="font-serif text-2xl font-semibold text-obsidian">
                          {selectedCustomer.totalVisits}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-champagne/60">
                        <p className="text-[11px] text-zinc-600">Lifetime Paid</p>
                        <p className="font-serif text-2xl font-semibold text-gold-700">
                          {formatINR(selectedCustomer.totalSpent)}
                        </p>
                      </div>
                    </div>

                    <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                      Appointment History
                    </h5>
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {selectedCustomer.history.length === 0 ? (
                        <p className="text-xs text-zinc-400">No appointments yet.</p>
                      ) : (
                        selectedCustomer.history.map((h) => (
                          <div
                            key={h._id}
                            className="p-3 rounded-xl border border-zinc-200 flex items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <p className="font-semibold text-obsidian">{h.service?.name}</p>
                              <p className="text-zinc-500">
                                {h.date} • {h.staff?.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold mb-1">
                                {formatINR(h.finalAmount ?? h.price)}
                              </p>
                              <StatusBadge status={h.status} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 text-zinc-400">
                    <Users className="w-8 h-8 mb-2 text-gold-500" />
                    <p className="text-sm font-medium text-obsidian">Select a Customer</p>
                    <p className="text-xs mt-1">
                      Click any row to inspect contact details and appointment history.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INCOME ANALYTICS & BUSINESS INTELLIGENCE TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
                <div className="inline-flex rounded-full bg-zinc-100 p-1 self-start">
                  {[
                    { id: 'weekly', label: 'Weekly' },
                    { id: 'monthly', label: 'This Month' },
                    { id: '6months', label: '6 Months' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setAnalyticsRange(r.id);
                        setAnalyticsStartDate('');
                        setAnalyticsEndDate('');
                      }}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                        analyticsRange === r.id && !analyticsStartDate
                          ? 'bg-obsidian text-gold-300'
                          : 'text-zinc-600 hover:text-obsidian'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-zinc-500 font-medium">Custom Range:</span>
                  <input
                    type="date"
                    value={analyticsStartDate}
                    onChange={(e) => setAnalyticsStartDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-300 outline-none focus:border-gold-500"
                  />
                  <span className="text-zinc-400">to</span>
                  <input
                    type="date"
                    value={analyticsEndDate}
                    onChange={(e) => setAnalyticsEndDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-300 outline-none focus:border-gold-500"
                  />
                  {(analyticsStartDate || analyticsEndDate) && (
                    <button
                      onClick={() => {
                        setAnalyticsStartDate('');
                        setAnalyticsEndDate('');
                      }}
                      className="text-gold-700 font-semibold hover:underline ml-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Financial & BI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-obsidian text-ivory rounded-2xl p-5 border border-zinc-800">
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-gold-400" />
                    Total Revenue (Paid)
                  </p>
                  <p className="font-serif text-3xl font-semibold text-gold-300 mt-2">
                    {formatINR(overview.totalRevenue ?? 0)}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Avg Booking Value: {formatINR(overview.averageBookingValue ?? 0)}
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-zinc-200/80">
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-rose-600" />
                    Total Expenses
                  </p>
                  <p className="font-serif text-3xl font-semibold text-obsidian mt-2">
                    {formatINR(overview.totalExpenses ?? 0)}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {overview.expenseCount || 0} recorded entries
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-zinc-200/80">
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    Net Profit
                  </p>
                  <p className="font-serif text-3xl font-semibold text-emerald-700 mt-2">
                    {overview.netProfit !== null && overview.netProfit !== undefined
                      ? formatINR(overview.netProfit)
                      : 'N/A'}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {overview.netProfit !== null && overview.netProfit !== undefined
                      ? 'Revenue minus recorded expenses'
                      : 'Record expenses to compute profit'}
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-zinc-200/80">
                  <p className="text-xs text-zinc-500">Cancellation & Frequency</p>
                  <p className="font-serif text-3xl font-semibold text-obsidian mt-2">
                    {overview.cancellationRate ?? 0}%
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {overview.avgBookingsPerCustomer ?? 0} bookings/client •{' '}
                    {overview.repeatCustomersCount ?? 0} repeat
                  </p>
                </div>
              </div>

              {/* Booking Breakdown Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Total Bookings', val: overview.totalBookings ?? 0 },
                  { label: 'Accepted', val: overview.acceptedBookings ?? 0 },
                  { label: 'Pending', val: overview.pendingBookings ?? 0 },
                  { label: 'Completed', val: overview.completedCount ?? 0 },
                  { label: 'Cancelled', val: overview.cancelledBookings ?? 0 },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="bg-white rounded-xl p-3.5 border border-zinc-200/80 text-center"
                  >
                    <p className="text-[11px] text-zinc-500">{b.label}</p>
                    <p className="font-serif text-2xl font-semibold text-obsidian mt-0.5">
                      {b.val}
                    </p>
                  </div>
                ))}
              </div>

              {/* Revenue Chart */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-serif text-2xl font-semibold text-obsidian">
                      Collected Revenue Trend (IST)
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Calculated strictly from confirmed Paid transactions.
                    </p>
                  </div>
                  <div className="inline-flex rounded-full bg-zinc-100 p-1">
                    {['daily', 'weekly', 'monthly'].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setRevTimeframe(tf)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
                          revTimeframe === tf
                            ? 'bg-obsidian text-gold-300'
                            : 'text-zinc-600 hover:text-obsidian'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(val) => [formatINR(val), 'Collected Revenue']} />
                      <Bar dataKey="revenue" fill="#C59B43" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Booking Trends + Category Pie */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
                  <h3 className="font-serif text-2xl font-semibold text-obsidian mb-4">
                    6-Month Booking Trends
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={charts.monthlyBookingTrends || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="total" stroke="#17171A" strokeWidth={2} name="Total" />
                        <Line type="monotone" dataKey="completed" stroke="#C59B43" strokeWidth={2} name="Completed" />
                        <Line type="monotone" dataKey="cancelled" stroke="#E11D48" strokeWidth={2} name="Cancelled" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
                  <h3 className="font-serif text-2xl font-semibold text-obsidian mb-4">
                    Collected Revenue by Category
                  </h3>
                  {(charts.revenueBreakdown || []).length === 0 ? (
                    <p className="text-sm text-zinc-400 text-center py-16">
                      No paid category data for this period.
                    </p>
                  ) : (
                    <>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={charts.revenueBreakdown || []}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={85}
                              paddingAngle={3}
                            >
                              {(charts.revenueBreakdown || []).map((_, idx) => (
                                <Cell key={idx} fill={GOLD_COLORS[idx % GOLD_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(val) => formatINR(val)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 mt-2">
                        {(charts.revenueBreakdown || []).map((item, idx) => (
                          <span
                            key={item.name}
                            className="inline-flex items-center gap-1.5 text-xs text-zinc-600"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: GOLD_COLORS[idx % GOLD_COLORS.length] }}
                            />
                            {item.name} ({formatINR(item.value)})
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Service-wise Performance */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
                <h3 className="font-serif text-2xl font-semibold text-obsidian mb-4">
                  Service-Wise Performance
                </h3>
                {(charts.servicePerformance || []).length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-8">
                    No service performance data for this period.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                          <th className="py-3 pr-4">Service</th>
                          <th className="py-3 pr-4">Category</th>
                          <th className="py-3 pr-4">Total Bookings</th>
                          <th className="py-3 pr-4">Completed</th>
                          <th className="py-3 pr-4">Cancelled</th>
                          <th className="py-3 text-right">Collected Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {(charts.servicePerformance || []).map((svc) => (
                          <tr key={svc.name}>
                            <td className="py-3 pr-4 font-semibold text-obsidian">{svc.name}</td>
                            <td className="py-3 pr-4 text-xs text-zinc-500">{svc.category}</td>
                            <td className="py-3 pr-4">{svc.bookings}</td>
                            <td className="py-3 pr-4 text-emerald-700 font-medium">{svc.completed}</td>
                            <td className="py-3 pr-4 text-rose-600">{svc.cancelled}</td>
                            <td className="py-3 text-right font-semibold text-gold-700">
                              {formatINR(svc.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Highest-Spending Customers */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
                <h3 className="font-serif text-2xl font-semibold text-obsidian mb-4">
                  Highest-Spending Customers
                </h3>
                {(charts.topCustomers || []).length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-6">
                    No customer spending data for this period.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {(charts.topCustomers || []).map((cust, idx) => (
                      <div
                        key={cust._id || idx}
                        className="p-4 rounded-xl bg-champagne/40 border border-gold-200/70"
                      >
                        <p className="text-[11px] font-semibold text-gold-700">#{idx + 1} Top Client</p>
                        <p className="font-semibold text-sm text-obsidian mt-1 truncate">
                          {cust.name}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">{cust.visits} paid visits</p>
                        <p className="font-serif text-xl font-semibold text-gold-700 mt-2">
                          {formatINR(cust.totalSpent)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* PAYMENT COLLECTION MODAL */}
      {paymentAppt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-luxury">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gold-700 font-semibold">
                  Finish Service & Collect Payment
                </p>
                <h3 className="font-serif text-2xl font-semibold text-obsidian">
                  Payment Confirmation
                </h3>
              </div>
              <button
                onClick={() => setPaymentAppt(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-obsidian"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {paymentError}
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-champagne/60 border border-gold-200 text-xs space-y-1 mb-4">
              <p className="font-semibold text-obsidian text-sm">
                {paymentAppt.customer?.name || paymentAppt.walkInCustomer?.name}
              </p>
              <p className="text-zinc-600">
                {paymentAppt.customer?.phone || paymentAppt.walkInCustomer?.phone}
              </p>
              <p className="text-zinc-700 pt-1">
                Service: <strong>{paymentAppt.service?.name}</strong> • Original Price:{' '}
                <strong>{formatINR(paymentAppt.price)}</strong>
              </p>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                    Additional Charges (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={paymentForm.additionalCharges}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, additionalCharges: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={paymentForm.discount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, discount: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'UPI', 'Card'].map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: method })}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition ${
                        paymentForm.paymentMethod === method
                          ? 'bg-obsidian text-gold-300 border-obsidian'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:border-gold-400'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-obsidian text-ivory flex items-center justify-between">
                <span className="text-xs text-zinc-300 font-medium">Final Payable Amount</span>
                <span className="font-serif text-3xl font-semibold text-gold-300">
                  {formatINR(computedPayable)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentAppt(null)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={collectingPayment}
                  className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-obsidian text-xs font-semibold shadow-gold disabled:opacity-60"
                >
                  {collectingPayment ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD WALK-IN CUSTOMER MODAL */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-luxury max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gold-700 font-semibold">
                  Walk-in Billing
                </p>
                <h3 className="font-serif text-2xl font-semibold text-obsidian">
                  Add Walk-in Customer
                </h3>
              </div>
              <button
                onClick={() => setShowWalkInModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-obsidian"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {walkInError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {walkInError}
              </div>
            )}

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={walkInForm.customerName}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, customerName: e.target.value })
                    }
                    placeholder="Walk-in Guest"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={walkInForm.phone}
                    onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                    Service *
                  </label>
                  <select
                    value={walkInForm.serviceId}
                    onChange={(e) => {
                      const svc = services.find((s) => s._id === e.target.value);
                      setWalkInForm({
                        ...walkInForm,
                        serviceId: e.target.value,
                        amount: svc ? String(svc.price) : walkInForm.amount,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                    required
                  >
                    {services.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({formatINR(s.price)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                    Assigned Staff *
                  </label>
                  <select
                    value={walkInForm.staffId}
                    onChange={(e) => setWalkInForm({ ...walkInForm, staffId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                    required
                  >
                    {staffList.map((st) => (
                      <option key={st._id} value={st._id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Service Amount (₹) *
                </label>
                <input
                  type="number"
                  min={1}
                  value={walkInForm.amount}
                  onChange={(e) => setWalkInForm({ ...walkInForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">
                  Payment Method *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'UPI', 'Card'].map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setWalkInForm({ ...walkInForm, paymentMethod: method })}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition ${
                        walkInForm.paymentMethod === method
                          ? 'bg-obsidian text-gold-300 border-obsidian'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:border-gold-400'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWalkIn}
                  className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-obsidian text-xs font-semibold shadow-gold disabled:opacity-60"
                >
                  {submittingWalkIn ? 'Recording...' : 'Confirm Payment & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-luxury">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl font-semibold text-obsidian">Record Expense</h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-obsidian"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. Hair color stock"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                    Category
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                  >
                    {[
                      'Rent & Utilities',
                      'Salon Supplies',
                      'Staff Payroll',
                      'Marketing',
                      'Maintenance',
                      'Other',
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Date (IST)
                </label>
                <input
                  type="date"
                  value={expenseForm.istDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, istDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="px-5 py-2.5 rounded-xl bg-obsidian text-gold-300 text-xs font-semibold disabled:opacity-60"
                >
                  {savingExpense ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT SERVICE MODAL */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-luxury max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-2xl font-semibold text-obsidian">
                {editingServiceId ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-obsidian"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                    Category
                  </label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                  >
                    {[
                      'Haircut & Styling',
                      'Color & Treatments',
                      'Beard & Grooming',
                      'Spa & Rituals',
                      'Bridal & Packages',
                    ].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                    Special Offer Tag
                  </label>
                  <input
                    type="text"
                    value={serviceForm.specialOfferText}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, specialOfferText: e.target.value })
                    }
                    placeholder="e.g. Save ₹300"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={serviceForm.duration}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, duration: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={serviceForm.price}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, price: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={serviceForm.image}
                  onChange={(e) => setServiceForm({ ...serviceForm, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <input
                    type="checkbox"
                    checked={serviceForm.isPopular}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, isPopular: e.target.checked })
                    }
                  />
                  Mark as Popular
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <input
                    type="checkbox"
                    checked={serviceForm.isAvailable}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, isAvailable: e.target.checked })
                    }
                  />
                  Available for Booking
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-obsidian text-gold-300 text-xs font-semibold"
                >
                  {editingServiceId ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DEMO OWNER BOOKING MODAL */}
      {showDemoBookModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-luxury">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gold-700 font-semibold">
                  Demo Owner Booking
                </p>
                <h3 className="font-serif text-2xl font-semibold text-obsidian">
                  Create Demo Appointment
                </h3>
              </div>
              <button
                onClick={() => setShowDemoBookModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-obsidian"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {demoBookError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {demoBookError}
              </div>
            )}

            <form onSubmit={handleDemoBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Service
                </label>
                <select
                  value={demoBookForm.serviceId}
                  onChange={(e) => setDemoBookForm({ ...demoBookForm, serviceId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                  required
                >
                  {services.filter((s) => s.isAvailable).map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({formatINR(s.price)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                  Stylist
                </label>
                <select
                  value={demoBookForm.staffId}
                  onChange={(e) => setDemoBookForm({ ...demoBookForm, staffId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                >
                  <option value="any">Any Available</option>
                  {staffList.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })}
                    value={demoBookForm.date}
                    onChange={(e) => setDemoBookForm({ ...demoBookForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">
                    Time Slot
                  </label>
                  <select
                    value={demoBookForm.timeSlot}
                    onChange={(e) => setDemoBookForm({ ...demoBookForm, timeSlot: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm outline-none focus:border-gold-500"
                  >
                    {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDemoBookModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDemoBook}
                  className="px-5 py-2.5 rounded-xl bg-obsidian text-gold-300 text-xs font-semibold disabled:opacity-60"
                >
                  {submittingDemoBook ? 'Booking...' : 'Create Demo Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
