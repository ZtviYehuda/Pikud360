import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import { schedulingService, ScheduleSettings, ShiftType } from '../services/schedulingService';
import { Settings, Plus, Calendar, Sparkles } from 'lucide-react';
import Unauthorized from './Unauthorized';

export default function WorkforceSchedulingSettings() {
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation();

  if (!hasPermission('schedule.settings_manage')) {
    return <Unauthorized />;
  }

  const [selectedUnitId, setSelectedUnitId] = useState('unit-uuid-555');
  const [settings, setSettings] = useState<ScheduleSettings | null>(null);
  const [shifts, setShifts] = useState<ShiftType[]>([]);
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [shiftError, setShiftError] = useState<string | null>(null);

  useEffect(() => { loadSettingsData(); }, [selectedUnitId]);

  const fallbackShifts = (unitId: string): ShiftType[] => [
    { id: 's1', tenant_id: 't-1', organization_unit_id: unitId, name: t('scheduling:shifts_morning'), start_time: '06:00', end_time: '14:00', active: true },
    { id: 's2', tenant_id: 't-1', organization_unit_id: unitId, name: t('scheduling:shifts_afternoon'), start_time: '14:00', end_time: '22:00', active: true },
    { id: 's3', tenant_id: 't-1', organization_unit_id: unitId, name: t('scheduling:shifts_night'), start_time: '22:00', end_time: '06:00', active: true }
  ];

  const loadSettingsData = async () => {
    try {
      const settingsData = await schedulingService.getSettings(selectedUnitId);
      setSettings(settingsData);
      try {
        const shiftsData = await schedulingService.getShiftTypes(selectedUnitId);
        setShifts(shiftsData);
      } catch {
        setShifts(fallbackShifts(selectedUnitId));
      }
    } catch {
      setSettings({ id: 'settings-mock', tenant_id: 't-1', organization_unit_id: selectedUnitId, scheduling_mode: 'DIRECT_STATUS' });
      setShifts(fallbackShifts(selectedUnitId));
    }
  };

  const handleModeChange = async (mode: 'DIRECT_STATUS' | 'SHIFT_BASED') => {
    if (!settings) return;
    try {
      const updated = await schedulingService.updateSettings(selectedUnitId, { scheduling_mode: mode });
      setSettings(updated);
    } catch {
      setSettings({ ...settings, scheduling_mode: mode });
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setShiftError(null);
    if (!shiftName) { setShiftError(t('scheduling:shift_error_required')); return; }
    try {
      const newShift = await schedulingService.createShiftType(selectedUnitId, { name: shiftName, start_time: startTime, end_time: endTime });
      setShifts([...shifts, newShift]);
      setShiftName('');
    } catch {
      const mockShift: ShiftType = { id: Math.random().toString(), tenant_id: 't-1', organization_unit_id: selectedUnitId, name: shiftName, start_time: startTime, end_time: endTime, active: true };
      setShifts([...shifts, mockShift]);
      setShiftName('');
    }
  };

  const unitsList = [
    { id: 'unit-uuid-555', name: t('scheduling:brigade_hq') },
    { id: 'unit-uuid-666', name: t('scheduling:company_a') },
    { id: 'unit-uuid-777', name: t('scheduling:company_b') }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
            {t('scheduling:shift_settings_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {t('scheduling:shift_settings_desc')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400">{t('analytics:unit')}:</label>
          <select value={selectedUnitId} onChange={(e) => setSelectedUnitId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900">
            {unitsList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      {settings === null ? (
        <div className="text-center py-20 text-slate-400 animate-pulse">{t('common:loading')}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scheduling Mode Panel */}
          <div className="lg:col-span-1 rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-brand-600" />
                {t('scheduling:shift_settings')}
              </h3>

              <div className="space-y-3">
                {(['DIRECT_STATUS', 'SHIFT_BASED'] as const).map((mode) => (
                  <label key={mode} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    settings?.scheduling_mode === mode
                      ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/10'
                      : 'border-slate-100 hover:bg-slate-50 dark:border-slate-850 dark:hover:bg-slate-900'
                  }`}>
                    <input type="radio" name="scheduling_mode" checked={settings?.scheduling_mode === mode}
                      onChange={() => handleModeChange(mode)} className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500" />
                    <div>
                      <span className="block text-sm font-bold text-slate-800 dark:text-white">{mode}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-855 pt-4 mt-6 flex items-center gap-2 text-2xs text-slate-400">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>{t('common:save')}</span>
            </div>
          </div>

          {/* Shifts Table Panel */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-650" />
                {t('scheduling:statuses_management')}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400">
                    <th className="py-2.5 px-2">{t('scheduling:shift_name')}</th>
                    <th className="py-2.5 px-2">{t('scheduling:start_time')}</th>
                    <th className="py-2.5 px-2">{t('scheduling:end_time')}</th>
                    <th className="py-2.5 px-2 text-center">{t('common:status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                  {shifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                      <td className="py-3 px-2 font-bold text-slate-800 dark:text-white">{shift.name}</td>
                      <td className="py-3 px-2 font-mono text-xs font-medium text-slate-500">{shift.start_time}</td>
                      <td className="py-3 px-2 font-mono text-xs font-medium text-slate-500">{shift.end_time}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="px-2 py-0.5 rounded text-3xs font-semibold bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400">
                          {t('common:status')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {shifts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400 text-xs">{t('scheduling:no_shifts')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Create Shift Form */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">
                {t('scheduling:add_status')}
              </h4>
              <form onSubmit={handleCreateShift} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-2xs font-semibold text-slate-450 mb-1">{t('scheduling:shift_name')}</label>
                  <input type="text" value={shiftName} onChange={(e) => setShiftName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950" />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-450 mb-1">{t('scheduling:start_time')}</label>
                  <input type="text" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="HH:MM"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 font-mono text-center" />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-450 mb-1">{t('scheduling:end_time')}</label>
                  <input type="text" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="HH:MM"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 font-mono text-center" />
                </div>
                <div className="sm:col-span-4 flex justify-between items-center gap-4">
                  {shiftError && <span className="text-2xs text-red-500 font-semibold">{shiftError}</span>}
                  <button type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 cursor-pointer w-fit ms-auto">
                    <Plus className="h-4 w-4" />
                    {t('buttons:add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
