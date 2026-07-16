import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Clock, CheckCircle2, Play, AlertCircle } from 'lucide-react';
import { useCommanderWorkspace } from '../../features/commander/context/CommanderWorkspaceContext';
import { findUnitName } from '../../features/commander/utils/organization';

interface SchedulerStatusProps {
  direction?: 'ltr' | 'rtl';
}

export default function SchedulerStatus({ direction = 'rtl' }: SchedulerStatusProps) {
  const { orgTree, selectedUnitId } = useCommanderWorkspace();
  const { t } = useTranslation(['dashboard']);
  const isRtl = direction === 'rtl';

  const selectedUnitName = useMemo(() => {
    return findUnitName(orgTree, selectedUnitId) || '';
  }, [orgTree, selectedUnitId]);

  const jobs = [
    {
      id: 'job-snapshot',
      name: t('dashboard:job_name_snapshot', { unit: selectedUnitName }),
      description: t('dashboard:job_desc_snapshot'),
      lastRun: '16/07/2026 08:00',
      nextRun: '17/07/2026 08:00',
      status: 'SUCCESS',
    },
    {
      id: 'job-alerts',
      name: t('dashboard:job_name_alerts', { unit: selectedUnitName }),
      description: t('dashboard:job_desc_alerts'),
      lastRun: '16/07/2026 09:30',
      nextRun: '16/07/2026 10:00',
      status: 'RUNNING',
    },
    {
      id: 'job-reports',
      name: t('dashboard:job_name_reports', { unit: selectedUnitName }),
      description: t('dashboard:job_desc_reports'),
      lastRun: '16/07/2026 06:00',
      nextRun: '17/07/2026 06:00',
      status: 'SUCCESS',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SUCCESS':
        return (
          <Badge variant="success" className="flex items-center gap-1.5 w-fit select-none">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>{t('dashboard:scheduler_status_success')}</span>
          </Badge>
        );
      case 'RUNNING':
        return (
          <Badge variant="info" className="flex items-center gap-1.5 w-fit select-none">
            <Play className="h-3 w-3 animate-pulse shrink-0" />
            <span>{t('dashboard:scheduler_status_running')}</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive" className="flex items-center gap-1.5 w-fit select-none">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{t('dashboard:scheduler_status_failed')}</span>
          </Badge>
        );
    }
  };

  return (
    <Card className="border border-slate-200/60 dark:border-slate-800">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white select-none">
          <Clock className="h-5 w-5 text-brand-600 dark:text-brand-400 shrink-0" />
          <span>{t('dashboard:scheduler_agent_status')}</span>
        </CardTitle>
        <CardDescription>
          {t('dashboard:scheduler_agent_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Desktop Table (hidden on mobile) */}
        <div className="hidden md:block border border-slate-200/60 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-slate-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dashboard:scheduler_task_name')}</TableHead>
                <TableHead>{t('dashboard:scheduler_last_run')}</TableHead>
                <TableHead>{t('dashboard:scheduler_next_run')}</TableHead>
                <TableHead className={isRtl ? 'text-left' : 'text-right'}>{t('dashboard:scheduler_status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="text-slate-800 dark:text-white select-none">
                    <p className="font-bold text-xs">{job.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{job.description}</p>
                  </TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400 text-xs font-semibold select-none">{job.lastRun}</TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400 text-xs font-semibold select-none">{job.nextRun}</TableCell>
                  <TableCell className={isRtl ? 'text-left' : 'text-right'}>
                    <div className={`flex ${isRtl ? 'justify-end' : 'justify-start'}`}>
                      {getStatusBadge(job.status)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards (hidden on desktop) */}
        <div className="block md:hidden space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="font-bold text-xs text-slate-800 dark:text-white leading-normal truncate">{job.name}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{job.description}</p>
                </div>
                <div className="shrink-0">{getStatusBadge(job.status)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center select-none">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/50">
                  <span className="block text-[8px] font-bold text-slate-455 uppercase tracking-wider">{t('dashboard:scheduler_last_run')}</span>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{job.lastRun}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/50">
                  <span className="block text-[8px] font-bold text-slate-455 uppercase tracking-wider">{t('dashboard:scheduler_next_run')}</span>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{job.nextRun}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
