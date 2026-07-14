import { useState, useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { Calendar as CalendarIcon, ChevronRight, X } from 'lucide-react';
import { workforceService, CalendarDayStats, SnapshotData } from '../services/workforceService';
import { schedulingService } from '../services/schedulingService';
import Unauthorized from './Unauthorized';

interface OrganizationUnit {
  id: string;
  name: string;
  code: string;
}

export default function WorkforceCalendar() {
  const { direction } = useUIStore();
  const { hasPermission } = useAuthStore();
  const isRTL = direction === 'rtl';

  if (!hasPermission('schedule.view')) {
    return <Unauthorized />;
  }

  // Range initialization: defaults to last 30 days
  const [selectedUnitId, setSelectedUnitId] = useState(() => {
    return localStorage.getItem('pikud360_selected_unit_id') || 'd0000000-0000-0000-0000-000000000001';
  });

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 15);
    return d.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });

  const [units, setUnits] = useState<OrganizationUnit[]>([]);
  const [calendarStats, setCalendarStats] = useState<CalendarDayStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Historical Snapshot modal state
  const [snapshotDate, setSnapshotDate] = useState<string | null>(null);
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      const tree = await schedulingService.getOrganizationTree();
      setUnits(tree);

      const stats = await workforceService.getSchedulingCalendar(selectedUnitId, startDate, endDate);
      setCalendarStats(stats);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to fetch calendar workforce data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedUnitId, startDate, endDate]);

  const handleOpenSnapshot = async (date: string) => {
    setSnapshotDate(date);
    setSnapshotLoading(true);
    try {
      const data = await workforceService.getSchedulingSnapshot(selectedUnitId, date);
      setSnapshotData(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load historical snapshot.');
    } finally {
      setSnapshotLoading(false);
    }
  };

  const handleCloseSnapshot = () => {
    setSnapshotDate(null);
    setSnapshotData(null);
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-indigo-650" />
            {isRTL ? 'יומן נוכחות וסד"כ' : 'Manpower Calendar'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'מעקב היסטורי יומי אחר שיבוצי הסטאטוסים וסד"כ היחידות' : 'Track daily manpower planning statistics and view historical snapshots.'}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg text-sm border border-rose-100 dark:border-rose-900/30">
          {errorMsg}
        </div>
      )}

      {/* Control panel */}
      <div className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 glassmorphism flex flex-wrap gap-4 items-center">
        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isRTL ? 'יחידה ארגונית' : 'Organization Unit'}</span>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350"
          >
            {units.map(unit => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isRTL ? 'מתאריך' : 'Start Date'}</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isRTL ? 'עד תאריך' : 'End Date'}</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350"
          />
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          {isRTL ? 'טוען נתונים...' : 'Loading statistics...'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {calendarStats.map((day) => {
            const availabilityRate = day.total_employees > 0
              ? Math.round(((day.status_distribution.AVAILABLE || 0) / day.total_employees) * 100)
              : 0;

            return (
              <div
                key={day.date}
                onClick={() => handleOpenSnapshot(day.date)}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 hover:shadow-md cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-900/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-800 dark:text-white">
                      {new Date(day.date).toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-3xs font-semibold ${
                      availabilityRate >= 70
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400'
                    }`}>
                      {availabilityRate}% {isRTL ? 'זמינות' : 'Available'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">{isRTL ? 'רשומים' : 'Total'}: </span>
                      <strong className="text-slate-700 dark:text-slate-350">{day.total_employees}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">{isRTL ? 'משובצים' : 'Assigned'}: </span>
                      <strong className="text-slate-700 dark:text-slate-350">{day.assigned}</strong>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-50 dark:border-slate-850 mt-4 pt-3 flex items-center justify-between text-2xs text-slate-400 font-medium">
                  <span>{isRTL ? 'פרטים מלאים סקור' : 'View Snapshot details'}</span>
                  <ChevronRight className={`h-4.5 w-4.5 ${isRTL ? 'rotate-180' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Snapshot Modal */}
      {snapshotDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                {isRTL ? 'תמונת סד"כ היסטורית ליום' : 'Historical Snapshot for'} {snapshotDate}
              </h3>
              <button
                onClick={handleCloseSnapshot}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {snapshotLoading ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                  {isRTL ? 'משחזר נתונים מהארכיון...' : 'Reconstructing snapshot from archives...'}
                </div>
              ) : snapshotData ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="text-3xs font-semibold text-slate-450 uppercase tracking-wider block mb-1">{isRTL ? 'סד"כ משובץ' : 'Total Personnel'}</span>
                      <strong className="text-2xl text-slate-850 dark:text-white font-bold">{snapshotData.total_personnel}</strong>
                    </div>

                    {Object.entries(snapshotData.statuses).map(([code, count]) => (
                      <div key={code} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <span className="text-3xs font-semibold text-slate-450 uppercase tracking-wider block mb-1">{code}</span>
                        <strong className="text-2xl text-slate-850 dark:text-white font-bold">{count}</strong>
                      </div>
                    ))}
                  </div>

                  {/* Organization breakdown */}
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-3">
                      {isRTL ? 'פילוח לפי יחידות' : 'Hierarchy Breakdown'}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(snapshotData.organization_breakdown).map(([unitName, count]) => (
                        <div key={unitName} className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border rounded-lg text-xs flex justify-between">
                          <span className="text-slate-500">{unitName}</span>
                          <strong className="text-slate-800 dark:text-white">{count}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assignments table */}
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-3">
                      {isRTL ? 'רשימת שיבוצים מפורטת' : 'Detailed Assignment List'}
                    </h4>
                    <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                            <th className="py-2.5 px-4">{isRTL ? 'חייל' : 'Employee'}</th>
                            <th className="py-2.5 px-4">{isRTL ? 'דרגה / תפקיד' : 'Rank / Role'}</th>
                            <th className="py-2.5 px-4">{isRTL ? 'יחידה' : 'Unit'}</th>
                            <th className="py-2.5 px-4">{isRTL ? 'סטטוס יומי' : 'Status'}</th>
                            <th className="py-2.5 px-4">{isRTL ? 'משמרת' : 'Shift'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                          {snapshotData.assignments.map((asg, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20">
                              <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-white">{asg.display_name}</td>
                              <td className="py-2.5 px-4 text-slate-500">{asg.rank} | {asg.role}</td>
                              <td className="py-2.5 px-4 text-slate-500">{asg.organization_unit}</td>
                              <td className="py-2.5 px-4 font-medium text-slate-700 dark:text-slate-350">{asg.status}</td>
                              <td className="py-2.5 px-4 text-slate-450">{asg.shift || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-500">
                  {isRTL ? 'שגיאה בשחזור הנתונים.' : 'Failed to retrieve snapshot data.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
