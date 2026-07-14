import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, ChevronRight, X } from 'lucide-react';
import { workforceService, CalendarDayStats, SnapshotData } from '../services/workforceService';
import { schedulingService } from '../services/schedulingService';
import Unauthorized from './Unauthorized';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';

interface OrganizationUnit {
  id: string;
  name: string;
  code: string;
}

export default function WorkforceCalendar() {
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation();

  if (!hasPermission('schedule.view')) {
    return <Unauthorized />;
  }

  const [selectedUnitId, setSelectedUnitId] = useState(() =>
    localStorage.getItem('pikud360_selected_unit_id') || 'd0000000-0000-0000-0000-000000000001'
  );
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 15);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });

  const [units, setUnits] = useState<OrganizationUnit[]>([]);
  const [calendarStats, setCalendarStats] = useState<CalendarDayStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [snapshotDate, setSnapshotDate] = useState<string | null>(null);
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true); setErrorMsg('');
      const tree = await schedulingService.getOrganizationTree();
      setUnits(tree);
      const stats = await workforceService.getSchedulingCalendar(selectedUnitId, startDate, endDate);
      setCalendarStats(stats);
    } catch (err: any) {
      setErrorMsg(err.message || t('validation:network_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedUnitId, startDate, endDate]);

  const handleOpenSnapshot = async (date: string) => {
    setSnapshotDate(date);
    setSnapshotLoading(true);
    try {
      const data = await workforceService.getSchedulingSnapshot(selectedUnitId, date);
      setSnapshotData(data);
    } catch (err: any) {
      setErrorMsg(err.message || t('validation:network_error'));
    } finally {
      setSnapshotLoading(false);
    }
  };

  const handleCloseSnapshot = () => { setSnapshotDate(null); setSnapshotData(null); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-105 dark:border-slate-800">
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <CalendarIcon className="h-8 w-8 text-indigo-650" />
          {t('common:calendar')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
          {t('scheduling:desc')}
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg text-sm border border-rose-100 dark:border-rose-900/30">
          {errorMsg}
        </div>
      )}

      {/* Control panel */}
      <Card className="p-6 flex flex-wrap gap-4 items-center">
        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('analytics:unit')}</span>
          <select value={selectedUnitId} onChange={(e) => setSelectedUnitId(e.target.value)}
            className="rounded-lg border border-slate-205 bg-white px-3 py-2 text-sm text-slate-700 dark:text-white outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950">
            {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('employees:start_date')}</span>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-auto" />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('employees:end_date')}</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto" />
        </div>
      </Card>

      {/* Stats Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">{t('common:loading')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {calendarStats.map((day) => {
            const availabilityRate = day.total_employees > 0
              ? Math.round(((day.status_distribution.AVAILABLE || 0) / day.total_employees) * 100)
              : 0;

            return (
              <Card 
                key={day.date} 
                onClick={() => handleOpenSnapshot(day.date)}
                className="p-5 hover:shadow-md cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-900/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-800 dark:text-white">
                      {new Date(day.date).toLocaleDateString('he-IL', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <Badge variant={availabilityRate >= 70 ? 'success' : 'destructive'} className="text-[10px]">
                      {availabilityRate}% {t('analytics:available')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">{t('dashboard:total_strength')}: </span>
                      <strong className="text-slate-700 dark:text-slate-350">{day.total_employees}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">{t('dashboard:assigned')}: </span>
                      <strong className="text-slate-700 dark:text-slate-350">{day.assigned}</strong>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-50 dark:border-slate-850 mt-4 pt-3 flex items-center justify-between text-2xs text-slate-400 font-medium">
                  <span>{t('common:history')}</span>
                  <ChevronRight className="h-4.5 w-4.5" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Snapshot Modal */}
      {snapshotDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <Card className="max-w-4xl w-full max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                {t('common:history')} — {snapshotDate}
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCloseSnapshot}
                className="h-8 w-8 text-slate-450 hover:text-slate-650"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {snapshotLoading ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400">{t('common:loading')}</div>
              ) : snapshotData ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="p-4 text-center">
                      <span className="text-3xs font-semibold text-slate-450 uppercase tracking-wider block mb-1">{t('dashboard:total_strength')}</span>
                      <strong className="text-2xl text-slate-850 dark:text-white font-bold">{snapshotData.total_personnel}</strong>
                    </Card>
                    {Object.entries(snapshotData.statuses).map(([code, count]) => (
                      <Card key={code} className="p-4 text-center">
                        <span className="text-3xs font-semibold text-slate-450 uppercase tracking-wider block mb-1">{code}</span>
                        <strong className="text-2xl text-slate-850 dark:text-white font-bold">{count}</strong>
                      </Card>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-3">{t('common:organization')}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(snapshotData.organization_breakdown).map(([unitName, count]) => (
                        <div key={unitName} className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border rounded-lg text-xs flex justify-between">
                          <span className="text-slate-500">{unitName}</span>
                          <strong className="text-slate-800 dark:text-white">{count}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-3">{t('employees:title')}</h4>
                    <Card className="overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="px-4">{t('employees:name')}</TableHead>
                            <TableHead className="px-4">{t('employees:rank')}</TableHead>
                            <TableHead className="px-4">{t('analytics:unit')}</TableHead>
                            <TableHead className="px-4">{t('common:status')}</TableHead>
                            <TableHead className="px-4">{t('scheduling:shift_name')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {snapshotData.assignments.map((asg, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="px-4 font-semibold text-slate-800 dark:text-white">{asg.display_name}</TableCell>
                              <TableCell className="px-4 text-slate-500">{asg.rank} | {asg.role}</TableCell>
                              <TableCell className="px-4 text-slate-500">{asg.organization_unit}</TableCell>
                              <TableCell className="px-4 font-medium text-slate-700 dark:text-slate-350">{asg.status}</TableCell>
                              <TableCell className="px-4 text-slate-450">{asg.shift || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-500">{t('common:error')}</div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
