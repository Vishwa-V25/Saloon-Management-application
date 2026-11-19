const inrWholeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrDecimalFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return '₹0';
  return Number.isInteger(num) ? inrWholeFormatter.format(num) : inrDecimalFormatter.format(num);
}
