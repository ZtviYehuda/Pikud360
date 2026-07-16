import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { 
  User, Calendar, ArrowLeftRight, Clock, AlertTriangle 
} from 'lucide-react';
import { useCommanderWorkspace } from '../../features/commander/context/CommanderWorkspaceContext';
import { findUnitName } from '../../features/commander/utils/organization';

interface RecentActivityProps {
  direction?: 'ltr' | 'rtl';
}

export default function RecentActivity({ direction = 'rtl' }: RecentActivityProps) {
  const { orgTree, selectedUnitId } = useCommanderWorkspace();
  const { t } = useTranslation(['dashboard']);
  const isRtl = direction === 'rtl';

  const selectedUnitName = useMemo(() => {
    return findUnitName(orgTree, selectedUnitId) || '';
  }, [orgTree, selectedUnitId]);

  const activities = [
    {
      id: 'act-1',
      title: t('dashboard:activity_status_update', { unit: selectedUnitName }),
      userAndTime: t('dashboard:activity_status_update_by_time'),
      icon: User,
    },
    {
      id: 'act-2',
      title: t('dashboard:activity_schedule_publish', { unit: selectedUnitName }),
      userAndTime: t('dashboard:activity_schedule_publish_by_time'),
      icon: Calendar,
    },
    {
      id: 'act-3',
      title: t('dashboard:activity_transfer_approve', { unit: selectedUnitName }),
      userAndTime: t('dashboard:activity_transfer_approve_by_time'),
      icon: ArrowLeftRight,
    },
    {
      id: 'act-4',
      title: t('dashboard:activity_low_capacity', { unit: selectedUnitName }),
      userAndTime: t('dashboard:activity_low_capacity_by_time'),
      icon: AlertTriangle,
    },
  ];

  return (
    <Card className="border border-slate-200/60 dark:border-slate-800">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white select-none">
          <Clock className="h-4.5 w-4.5 text-brand-600 dark:text-brand-400 shrink-0" />
          <span>{t('dashboard:recent_activity')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className={`relative border-slate-200 dark:border-slate-800 space-y-6 ${
          isRtl ? 'border-r-2 mr-3 pr-6 text-right' : 'border-l-2 ml-3 pl-6 text-left'
        }`}>
          {activities.map((act) => {
            const Icon = act.icon;
            return (
              <div key={act.id} className="relative">
                {/* Timeline bullet icon */}
                <span className={`absolute top-1.5 flex items-center justify-center w-6.5 h-6.5 rounded-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 shadow-3xs text-slate-500 ${
                  isRtl ? '-right-[35px]' : '-left-[35px]'
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>

                <div className="space-y-0.5 select-none">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-white leading-normal">
                    {act.title}
                  </h4>
                  <p className="text-slate-455 dark:text-slate-500 text-[10px] font-semibold leading-normal">
                    {act.userAndTime}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
