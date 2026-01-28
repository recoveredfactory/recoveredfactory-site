export const parseDate = (value: string): Date => {
  if (value.includes('T')) {
    return new Date(value);
  }

  return new Date(`${value}T00:00:00Z`);
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
