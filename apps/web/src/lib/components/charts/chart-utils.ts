import type { Lang } from '$lib/i18n';

// Era palette, validated (dataviz six checks) against the cream surface #f3f1e9.
export const ERA_COLORS = {
  trump: '#d81f48',
  biden: '#2f6bb0',
} as const;

// Neutral magnitude hue (site link orange) for single-series bars — validated
// on cream. Reserved: red/blue above always mean the eras.
export const BAR_COLOR = '#c95918';
// De-emphasis gray for context series (slate-500; keeps ≥3:1 on cream).
export const DEEMPHASIS = '#64748b';

export const GRID_STROKE = 'rgba(15, 23, 42, 0.08)';
export const AXIS_TEXT = '#64748b'; // slate-500
export const LABEL_TEXT = '#334155'; // slate-700
export const SURFACE = '#f3f1e9';

export function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

export function fmtPct(n: number): string {
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;
}

const MONTHS: Record<Lang, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
};

/** "2025-01" → "Jan '25" / "ene '25" */
export function monthLabel(month: string, lang: Lang): string {
  const [year, m] = month.split('-');
  return `${MONTHS[lang][parseInt(m, 10) - 1]} '${year.slice(2)}`;
}

/** "EL SALVADOR" → "El Salvador" */
export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}
