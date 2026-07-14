import { useState, useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { Info, AlertTriangle, CheckCircle, AlertOctagon, Check } from 'lucide-react';
import { workforceService, SystemNotification } from '../services/workforceService';
import Unauthorized from './Unauthorized';

export default function Notifications() {
  const { direction } = useUIStore();
  const { hasPermission } = useAuthStore();
  const isRTL = direction === 'rtl';

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
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleMarkRead = async (id: string) => {
    try {
      await workforceService.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, status: 'READ', read_at: new Date().toISOString() } : n)
      );
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await workforceService.markAllNotificationsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'READ', read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (severityFilter === 'ALL') return true;
    return n.severity === severityFilter;
  });

  const getSeverityStyle = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'WARNING':
        return 'bg-yellow-50 text-yellow-800 border-yellow-250 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/30';
      case 'SUCCESS':
        return 'bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'DANGER':
      case 'ERROR':
        return 'bg-rose-50 text-rose-800 border-rose-250 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
      default:
        return 'bg-sky-50 text-sky-800 border-sky-250 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30';
    }
  };

  const renderIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5" />;
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5" />;
      case 'DANGER':
      case 'ERROR':
        return <AlertOctagon className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
            {isRTL ? 'התראות מבצעיות' : 'Operational Notifications'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'מעקב וניהול התראות כוח אדם, חוסרי סד"כ והודעות מערכת' : 'Monitor manpower alerts, shortages, and system-wide operational updates.'}
          </p>
        </div>

        {hasPermission('notifications.manage') && (
          <button
            onClick={handleMarkAllRead}
            disabled={notifications.filter(n => n.status === 'UNREAD').length === 0}
            className="self-start sm:self-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 transition-colors shadow-sm"
          >
            {isRTL ? 'סמן הכל כנקרא' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-950">
          {(['ALL', 'UNREAD', 'READ'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === opt
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {opt === 'ALL' ? (isRTL ? 'הכל' : 'All') : opt === 'UNREAD' ? (isRTL ? 'שלא נקראו' : 'Unread') : (isRTL ? 'נקראו' : 'Read')}
            </button>
          ))}
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350"
        >
          <option value="ALL">{isRTL ? 'כל החומרות' : 'All Severities'}</option>
          <option value="INFO">{isRTL ? 'מידע' : 'Info'}</option>
          <option value="SUCCESS">{isRTL ? 'הצלחה' : 'Success'}</option>
          <option value="WARNING">{isRTL ? 'אזהרה' : 'Warning'}</option>
          <option value="DANGER">{isRTL ? 'חמור' : 'Danger'}</option>
        </select>
      </div>

      {/* Alert Feed */}
      <div className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 glassmorphism">
        {loading ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            {isRTL ? 'טוען התראות...' : 'Loading notifications...'}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            {isRTL ? 'אין התראות חדשות' : 'No notifications match selected filters.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-850">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`py-4 first:pt-0 last:pb-0 flex items-start gap-4 transition-opacity ${
                  notif.status === 'READ' ? 'opacity-65' : ''
                }`}
              >
                <div className={`p-2.5 rounded-xl border ${getSeverityStyle(notif.severity)}`}>
                  {renderIcon(notif.severity)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs text-slate-400 font-medium">
                      {new Date(notif.created_at).toLocaleString(isRTL ? 'he-IL' : 'en-US')}
                    </span>
                    {notif.status === 'UNREAD' && hasPermission('notifications.manage') && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-650 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={isRTL ? 'סמן כנקרא' : 'Mark as read'}
                      >
                        <Check className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-white mt-1">
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
      </div>
    </div>
  );
}
