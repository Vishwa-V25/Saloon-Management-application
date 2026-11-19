const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns YYYY-MM-DD in Asia/Kolkata timezone.
 */
export function getISTDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Returns HH:mm (24h) in Asia/Kolkata timezone.
 */
export function getISTTimeString(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Returns YYYY-MM in Asia/Kolkata timezone.
 */
export function getISTMonthPrefix(date = new Date()) {
  return getISTDateString(date).slice(0, 7);
}

/**
 * Returns a date offset by `daysOffset` formatted as YYYY-MM-DD in IST.
 */
export function getISTOffsetDateString(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return getISTDateString(d);
}
