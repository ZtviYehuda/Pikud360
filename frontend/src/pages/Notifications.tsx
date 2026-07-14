import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import { Info, AlertTriangle, CheckCircle, AlertOctagon, Check, Bell } from 'lucide-react';
import { workforceService, SystemNotification } from '../services/workforceService';
import Unauthorized from './Unauthorized';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Spinner } from '../components/ui/spinner';
import { EmptyState } from '../components/ui/empty-state';

export default function Notifications() {
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation();

  if (!hasPermission('notifications.view')) {
    return <Unauthorized />;
  }

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await workforceService.getNotifications(filter === 'ALL' ? undefined : filter as any);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [filter]);

  const handleMarkRead = async (id: string) => {
    try {
      await workforceService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'READ', read_at: new Date().toISOString() } : n));
    } catch (err) { console.error('Failed to mark notification read', err); }
  };

  const handleMarkAllRead = async () => {
    try {
      await workforceService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, status: 'READ', read_at: new Date().toISOString() })));
    } catch (err) { console.error('Failed to mark all read', err); }
  };

  const filteredNotifications = notifications.filter(n => {
    if (severityFilter === 'ALL') return true;
    return n.severity === severityFilter;
  });

  const getSeverityStyle = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'WARNING': return 'bg-yellow-50 text-yellow-800 border-yellow-250 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/30';
      case 'SUCCESS': return 'bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'DANGER': case 'ERROR': return 'bg-rose-50 text-rose-800 border-rose-250 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
      default: return 'bg-sky-50 text-sky-800 border-sky-250 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'WARNING': return 'warning';
      case 'SUCCESS': return 'success';
      case 'DANGER': case 'ERROR': return 'destructive';
      default: return 'info';
    }
  };

  const renderIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'WARNING': return <AlertTriangle className="h-5 w-5" />;
      case 'SUCCESS': return <CheckCircle className="h-5 w-5" />;
      case 'DANGER': case 'ERROR': return <AlertOctagon className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const filterLabels: Record<string, string> = {
    ALL: t('notifications:all_notifications'),
    UNREAD: t('notifications:unread'),
    READ: t('notifications:read')
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('notifications:title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            {t('notifications:desc')}
          </p>
        </div>

        {hasPermission('notifications.manage') && (
          <Button onClick={handleMarkAllRead}
            disabled={notifications.filter(n => n.status === 'UNREAD').length === 0}
            className="w-fit"
          >
            {t('notifications:mark_all_read')}
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-950">
          {(['ALL', 'UNREAD', 'READ'] as const).map((opt) => (
            <button key={opt} onClick={() => setFilter(opt)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                filter === opt
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}>
              {filterLabels[opt]}
            </button>
          ))}
        </div>

        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
          className="rounded-lg border border-slate-205 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 cursor-pointer">
          <option value="ALL">{t('notifications:all_severities')}</option>
          <option value="INFO">{t('notifications:severity_info')}</option>
          <option value="SUCCESS">{t('notifications:severity_success')}</option>
          <option value="WARNING">{t('notifications:severity_warning')}</option>
          <option value="DANGER">{t('notifications:severity_danger')}</option>
        </select>
      </div>

      {/* Feed */}
      <Card className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="default" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={t('notifications:no_notifications')}
            description={t('notifications:desc')}
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-850">
            {filteredNotifications.map((notif) => (
              <div key={notif.id} className={`py-4 first:pt-0 last:pb-0 flex items-start gap-4 transition-opacity ${notif.status === 'READ' ? 'opacity-65' : ''}`}>
                <div className={`p-2.5 rounded-xl border ${getSeverityStyle(notif.severity)}`}>
                  {renderIcon(notif.severity)}
                </div>

                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs text-slate-450 font-semibold">
                      {new Date(notif.created_at).toLocaleString('he-IL')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityBadgeVariant(notif.severity)} className="uppercase text-[9px]">
                        {notif.severity}
                      </Badge>
                      {notif.status === 'UNREAD' && hasPermission('notifications.manage') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkRead(notif.id)}
                          className="h-7 w-7 p-0 text-slate-450 hover:text-indigo-650 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title={t('notifications:mark_read')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white mt-1">
                    {notif.notification_type.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

