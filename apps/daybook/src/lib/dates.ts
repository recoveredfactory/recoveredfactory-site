export const parseDate = (value: string): Date => {
  if (value.includes('T')) {
    return new Date(value);
  }

  return new Date(`${value}T00:00:00Z`);
};

// AP style abbreviates Jan., Feb., Aug., Sept., Oct., Nov. and Dec. and spells
// out the rest. Intl has no such format — `month: 'short'` gives "Aug" and
// "Sep" — so English dates are assembled here and Spanish is left to Intl.
const AP_MONTHS = [
  'Jan.',
  'Feb.',
  'March',
  'April',
  'May',
  'June',
  'July',
  'Aug.',
  'Sept.',
  'Oct.',
  'Nov.',
  'Dec.',
];

export const formatApDate = (value: string, { weekday = false } = {}): string => {
  const date = parseDate(value);
  const month = AP_MONTHS[date.getUTCMonth()];
  const stamp = `${month} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  if (!weekday) return stamp;
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(date);
  return `${day}, ${stamp}`;
};

export const formatDate = (
  value: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string => {
  const hasTime = value.includes('T');
  const date = parseDate(value);
  const formatOptions = hasTime ? options : { ...options, timeZone: 'UTC' };

  return new Intl.DateTimeFormat(locale, formatOptions).format(date);
};
