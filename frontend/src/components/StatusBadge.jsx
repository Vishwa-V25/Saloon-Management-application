export default function StatusBadge({ status }) {
  const styles = {
    Booked: 'bg-amber-50 text-amber-800 border-amber-200',
    Pending: 'bg-amber-50 text-amber-800 border-amber-200',
    Confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'In Progress': 'bg-sky-50 text-sky-800 border-sky-200',
    'Payment Pending': 'bg-orange-50 text-orange-800 border-orange-200',
    Paid: 'bg-teal-50 text-teal-800 border-teal-200',
    Completed: 'bg-zinc-900 text-gold-300 border-zinc-800',
    Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const dotColors = {
    Booked: 'bg-amber-500',
    Pending: 'bg-amber-500',
    Confirmed: 'bg-emerald-500',
    'In Progress': 'bg-sky-500',
    'Payment Pending': 'bg-orange-500',
    Paid: 'bg-teal-500',
    Completed: 'bg-gold-400',
    Cancelled: 'bg-rose-500',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${
        styles[status] || 'bg-zinc-100 text-zinc-700 border-zinc-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[status] || 'bg-zinc-400'}`} />
      {status}
    </span>
  );
}
