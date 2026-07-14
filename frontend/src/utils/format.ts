/**
/**
 * Localization and formatting helper functions for the Israeli locale.
 * Supports Hebrew currency, numbers, percentages, dates, and times.
 */

/**
 * Format a Date object or date-string as dd/MM/yyyy in Asia/Jerusalem timezone.
 */
export function formatDate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '';
  try {
    const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(dateObj.getTime())) return '';
    
    const formatted = new Intl.DateTimeFormat('he-IL', {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(dateObj);
    return formatted.replace(/\./g, '/');
  } catch (e) {
    return '';
  }
}

/**
 * Format a Date object or date-string as 24-hour time (HH:mm) in Asia/Jerusalem timezone.
 */
export function formatTime(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '';
  try {
    const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(dateObj.getTime())) return '';

    return new Intl.DateTimeFormat('he-IL', {
      timeZone: 'Asia/Jerusalem',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(dateObj);
  } catch (e) {
    return '';
  }
}

/**
 * Format standard numbers according to the Hebrew locale.
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('he-IL').format(value);
}

/**
 * Format percentage values according to the Hebrew locale (e.g. 85%).
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const formatted = new Intl.NumberFormat('he-IL', {
    maximumFractionDigits: 1
  }).format(value);
  return `${formatted}%`;
}
