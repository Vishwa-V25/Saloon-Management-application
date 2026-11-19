import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarPlus,
  History,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Scissors,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import StatusBadge from '../components/StatusBadge';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';

export default function CustomerDashboard() {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'book' ? 'book' : 'overview'
  );

  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [summary, setSummary] = useState({
    totalBookings: 0,
    totalVisits: 0,
    upcomingCount: 0,
    pendingCount: 0,
    confirmedCount: 0,
    completedCount: 0,
    cancelledCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Booking state
  const [selectedService, setSelectedService] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('any');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingMsg, setBookingMsg] = useState({ type: '', text: '' });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Profile state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    notes: user?.notes || '',
  });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [svcRes, stfRes, apptRes] = await Promise.all([
        api.get('/services?availableOnly=true'),
        api.get('/staff'),
        api.get('/appointments/my'),
      ]);
      const svcs = svcRes.data.services || [];
      setServices(svcs);
      if (svcs.length > 0 && !selectedService) {
        setSelectedService(svcs[0]._id);
      }
      setStaff(stfRes.data.staff || []);
      setAppointments(apptRes.data.appointments || []);
      setSummary(apptRes.data.summary || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot('');
    api
      .get(`/appointments/slots?date=${selectedDate}&staffId=${selectedStaff}`)
      .then((res) => setSlots(res.data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedStaff]);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedSlot) {
      setBookingMsg({ type: 'error', text: 'Please select a service, date, and available time slot.' });
      return;
    }

    setBookingSubmitting(true);
    setBookingMsg({ type: '', text: '' });
    try {
      await api.post('/appointments', {
        serviceId: selectedService,
        staffId: selectedStaff,
        date: selectedDate,
        timeSlot: selectedSlot,
        notes,
      });
      setBookingMsg({
        type: 'success',
        text: 'Appointment requested! Its status is currently Pending confirmation.',
      });
      setSelectedSlot('');
      setNotes('');
      await loadData();
      // Refresh slots
      const slotRes = await api.get(
        `/appointments/slots?date=${selectedDate}&staffId=${selectedStaff}`
      );
      setSlots(slotRes.data.slots || []);
    } catch (err) {
      setBookingMsg({
        type: 'error',
        text: err.response?.data?.message || 'Unable to book appointment.',
      });
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    try {
      await api.patch(`/appointments/${id}/cancel`);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel appointment.');
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await api.put('/auth/profile', profileForm);
      updateUser(res.data.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile.',
      });
    }
  };

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const activeStatuses = ['Booked', 'Pending', 'Confirmed', 'In Progress', 'Payment Pending'];
  const upcomingAppointments = appointments.filter(
    (a) => a.date >= today && activeStatuses.includes(a.status)
  );
  const pastAppointments = appointments.filter(
    (a) => !(a.date >= today && activeStatuses.includes(a.status))
  );

  const chosenServiceObj = services.find((s) => s._id === selectedService);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'book', label: 'Book Appointment', icon: CalendarPlus },
    { id: 'history', label: 'My Appointments', icon: History, badge: upcomingAppointments.length },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  return (
    <DashboardLayout
      portalLabel="Customer Portal"
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Welcome Banner */}
          <div className="bg-obsidian text-ivory rounded-3xl p-7 sm:p-9 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-luxury">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gold-400">
                Client Concierge
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white mt-1">
                Welcome back, {user?.name?.split(' ')[0]}
              </h2>
              <p className="text-sm text-zinc-300 mt-2">
                You have {upcomingAppointments.length} upcoming{' '}
                {upcomingAppointments.length === 1 ? 'appointment' : 'appointments'} and{' '}
                {summary.totalVisits} completed salon visits.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('book')}
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-obsidian font-semibold px-6 py-3.5 rounded-full shadow-gold transition shrink-0"
            >
              <CalendarPlus className="w-4 h-4" />
              Book New Appointment
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Visits (Completed)', value: summary.totalVisits, accent: 'text-gold-700' },
              { label: 'Upcoming Bookings', value: summary.upcomingCount, accent: 'text-emerald-700' },
              { label: 'Pending Approval', value: summary.pendingCount, accent: 'text-amber-700' },
              { label: 'Total Bookings', value: summary.totalBookings, accent: 'text-obsidian' },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm"
              >
                <p className="text-xs font-medium text-zinc-500">{card.label}</p>
                <p className={`font-serif text-4xl font-semibold mt-2 ${card.accent}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Upcoming Appointments Quick List */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-2xl font-semibold text-obsidian">
                Upcoming Appointments
              </h3>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs font-semibold text-gold-700 hover:underline"
              >
                View All History →
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-zinc-500">Loading appointments...</p>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-10 bg-champagne/40 rounded-2xl border border-dashed border-gold-300">
                <Scissors className="w-8 h-8 text-gold-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-obsidian">No upcoming appointments</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Treat yourself to a signature cut or restorative ritual.
                </p>
                <button
                  onClick={() => setActiveTab('book')}
                  className="mt-4 px-5 py-2 rounded-full bg-obsidian text-gold-300 text-xs font-semibold"
                >
                  Schedule Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appt) => (
                  <div
                    key={appt._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 hover:border-gold-300 transition"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={appt.service?.image}
                        alt={appt.service?.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                      <div>
                        <p className="font-semibold text-obsidian text-sm">{appt.service?.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Stylist: <span className="text-zinc-800 font-medium">{appt.staff?.name}</span> •{' '}
                          {appt.date} at {appt.timeSlot}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="font-semibold text-sm text-obsidian">
                        {formatINR(appt.finalAmount ?? appt.price)}
                      </span>
                      <StatusBadge status={appt.status} />
                      <button
                        onClick={() => handleCancelAppointment(appt._id)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2.5 py-1 rounded-lg hover:bg-rose-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOOK APPOINTMENT TAB */}
      {activeTab === 'book' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          <form onSubmit={handleBookAppointment} className="lg:col-span-8 space-y-6">
            {bookingMsg.text && (
              <div
                className={`p-4 rounded-2xl border text-sm font-medium flex items-center gap-2 ${
                  bookingMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {bookingMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                {bookingMsg.text}
              </div>
            )}

            {/* Step 1: Service */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm">
              <h3 className="font-serif text-2xl font-semibold text-obsidian mb-4">
                1. Select Salon Service
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((svc) => {
                  const active = selectedService === svc._id;
                  return (
                    <button
                      type="button"
                      key={svc._id}
                      onClick={() => setSelectedService(svc._id)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        active
                          ? 'border-gold-500 bg-champagne/60 ring-2 ring-gold-400/30'
                          : 'border-zinc-200 hover:border-gold-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-obsidian">{svc.name}</p>
                        <span className="font-serif text-lg font-semibold text-gold-700">
                          {formatINR(svc.price)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {svc.duration} mins • {svc.category}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Stylist */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm">
              <h3 className="font-serif text-2xl font-semibold text-obsidian mb-4">
                2. Choose Master Stylist / Barber
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStaff('any')}
                  className={`p-3.5 rounded-xl border text-left transition ${
                    selectedStaff === 'any'
                      ? 'border-gold-500 bg-champagne/60 ring-2 ring-gold-400/30'
                      : 'border-zinc-200 hover:border-gold-300'
                  }`}
                >
                  <p className="font-semibold text-sm text-obsidian flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-gold-600" />
                    Any Available
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">First available master stylist</p>
                </button>

                {staff.map((member) => {
                  const active = selectedStaff === member._id;
                  return (
                    <button
                      type="button"
                      key={member._id}
                      onClick={() => setSelectedStaff(member._id)}
                      className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition ${
                        active
                          ? 'border-gold-500 bg-champagne/60 ring-2 ring-gold-400/30'
                          : 'border-zinc-200 hover:border-gold-300'
                      }`}
                    >
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-obsidian truncate">{member.name}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{member.title}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Date & Time Slot */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm">
              <h3 className="font-serif text-2xl font-semibold text-obsidian mb-4">
                3. Pick Date & Available Time Slot
              </h3>
              <div className="mb-5 max-w-xs">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Preferred Date
                </label>
                <input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-gold-500 outline-none text-sm"
                  required
                />
              </div>

              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Available Time Slots
              </label>
              {loadingSlots ? (
                <p className="text-xs text-zinc-500">Checking live availability...</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {slots.map((slot) => {
                    const active = selectedSlot === slot.timeSlot;
                    return (
                      <button
                        type="button"
                        key={slot.timeSlot}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.timeSlot)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition ${
                          !slot.available
                            ? 'bg-zinc-100 text-zinc-400 border-zinc-200 line-through cursor-not-allowed'
                            : active
                            ? 'bg-obsidian text-gold-300 border-obsidian shadow-sm'
                            : 'bg-white text-obsidian border-zinc-300 hover:border-gold-500'
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 4: Notes */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm">
              <h3 className="font-serif text-2xl font-semibold text-obsidian mb-3">
                4. Preferences & Notes (Optional)
              </h3>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any styling preferences, allergies, or beverage requests..."
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:border-gold-500 outline-none text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={bookingSubmitting}
              className="w-full py-4 rounded-2xl bg-gold-500 hover:bg-gold-400 text-obsidian font-semibold text-sm shadow-gold transition disabled:opacity-60"
            >
              {bookingSubmitting ? 'Confirming Reservation...' : 'Confirm Appointment'}
            </button>
          </form>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-obsidian text-ivory rounded-3xl p-6 sticky top-24 shadow-luxury">
              <p className="text-xs uppercase tracking-[0.22em] text-gold-400">
                Reservation Summary
              </p>
              <h3 className="font-serif text-2xl font-semibold text-white mt-1">
                Your Salon Session
              </h3>

              <div className="mt-6 space-y-4 text-sm border-t border-zinc-800 pt-5">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Service</span>
                  <span className="font-medium text-white text-right max-w-[180px]">
                    {chosenServiceObj?.name || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Duration</span>
                  <span className="text-white">{chosenServiceObj?.duration || 0} mins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Stylist</span>
                  <span className="text-white">
                    {selectedStaff === 'any'
                      ? 'Any Available'
                      : staff.find((s) => s._id === selectedStaff)?.name || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Date</span>
                  <span className="text-white">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Time</span>
                  <span className="text-gold-300 font-semibold">
                    {slots.find((s) => s.timeSlot === selectedSlot)?.label || 'Select a slot'}
                  </span>
                </div>
                <div className="border-t border-zinc-800 pt-4 flex justify-between items-baseline">
                  <span className="text-zinc-300 font-medium">Estimated Total</span>
                  <span className="font-serif text-3xl font-semibold text-gold-400">
                    {formatINR(chosenServiceObj?.price || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MY APPOINTMENTS TAB */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
            <h3 className="font-serif text-2xl font-semibold text-obsidian mb-4">
              Upcoming Appointments ({upcomingAppointments.length})
            </h3>
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-zinc-500">No upcoming appointments scheduled.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                      <th className="py-3 pr-4">Service</th>
                      <th className="py-3 pr-4">Stylist</th>
                      <th className="py-3 pr-4">Date & Time</th>
                      <th className="py-3 pr-4">Price</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {upcomingAppointments.map((a) => (
                      <tr key={a._id}>
                        <td className="py-3.5 pr-4 font-medium text-obsidian">{a.service?.name}</td>
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
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleCancelAppointment(a._id)}
                            className="text-xs font-semibold text-rose-600 hover:underline"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
            <h3 className="font-serif text-2xl font-semibold text-obsidian mb-4">
              Previous Booking History ({pastAppointments.length})
            </h3>
            {pastAppointments.length === 0 ? (
              <p className="text-sm text-zinc-500">No past appointments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                      <th className="py-3 pr-4">Service</th>
                      <th className="py-3 pr-4">Stylist</th>
                      <th className="py-3 pr-4">Date & Time</th>
                      <th className="py-3 pr-4">Price</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {pastAppointments.map((a) => (
                      <tr key={a._id}>
                        <td className="py-3.5 pr-4 font-medium text-obsidian">{a.service?.name}</td>
                        <td className="py-3.5 pr-4 text-zinc-600">{a.staff?.name}</td>
                        <td className="py-3.5 pr-4 text-zinc-600">
                          {a.date} • {a.timeSlot}
                        </td>
                        <td className="py-3.5 pr-4 font-semibold">
                          {formatINR(a.finalAmount ?? a.price)}
                        </td>
                        <td className="py-3.5">
                          <StatusBadge status={a.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="max-w-xl bg-white rounded-2xl border border-zinc-200/80 p-7 shadow-sm">
          <h3 className="font-serif text-2xl font-semibold text-obsidian">Personal Details</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Keep your contact information up to date for appointment confirmations.
          </p>

          {profileMsg.text && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs font-medium border ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfileSave} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-gold-500 outline-none text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-gold-500 outline-none text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Styling Preferences / Notes
              </label>
              <textarea
                rows={3}
                value={profileForm.notes}
                onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
                placeholder="e.g. Prefer quiet appointments, sensitive scalp..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-gold-500 outline-none text-sm"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-obsidian hover:bg-zinc-800 text-gold-300 font-semibold text-sm transition"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
