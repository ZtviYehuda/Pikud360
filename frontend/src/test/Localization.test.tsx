import { describe, it, expect } from 'vitest';
import i18n from '../i18n';
import { formatDate, formatTime, formatNumber, formatPercentage } from '../utils/format';

describe('Application Localization Infrastructure Tests', () => {
  it('initializes i18n engine with Hebrew as active language', () => {
    expect(i18n.language).toBe('he');
  });

  it('translates common keys into Hebrew correctly', () => {
    expect(i18n.t('common:app_name')).toBe('פיקוד 360');
    expect(i18n.t('common:unauthorized')).toBe('אין הרשאה מתאימה');
  });

  it('translates dashboard keys into Hebrew correctly', () => {
    expect(i18n.t('dashboard:total_strength')).toBe('מצבת כוח אדם');
    expect(i18n.t('dashboard:shortage_index')).toBe('מדד מחסור');
  });

  it('translates buttons namespace into Hebrew correctly', () => {
    expect(i18n.t('buttons:save')).toBe('שמור');
    expect(i18n.t('buttons:cancel')).toBe('ביטול');
  });

  it('formats dates according to the Israeli timezone and dd/MM/yyyy structure', () => {
    const testDate = new Date('2026-07-14T10:00:00.000Z');
    const formatted = formatDate(testDate);
    // 14/07/2026 under Jerusalem locale
    expect(formatted).toContain('14/07/2026');
  });

  it('formats time to 24-hour style', () => {
    const testDate = new Date('2026-07-14T14:30:00.000Z');
    const formatted = formatTime(testDate);
    // Since Jerusalem is UTC+3 in July DST: 14:30 UTC is 17:30 local
    expect(formatted).toBe('17:30');
  });

  it('formats numbers and percentages with Israeli localization settings', () => {
    expect(formatNumber(1250)).toBe('1,250');
    expect(formatPercentage(94.2)).toBe('94.2%');
  });
});
