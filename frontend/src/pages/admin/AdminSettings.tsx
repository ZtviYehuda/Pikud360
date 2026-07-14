import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';
import { adminService, SystemSetting } from '../../services/adminService';
import Unauthorized from '../Unauthorized';
import { Settings, Save, RefreshCw, Lock, Bell, Clock, Globe, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';

const SETTING_GROUPS: { key: string; icon: any; keys: string[] }[] = [
  {
    key: 'general', icon: Globe,
    keys: ['default_timezone', 'default_language', 'date_format', 'working_days', 'weekend_days']
  },
  {
    key: 'scheduling', icon: Calendar,
    keys: ['scheduling_mode_default', 'sick_alert_threshold_pct', 'unavailable_alert_threshold', 'min_manpower_threshold_pct']
  },
  {
    key: 'security', icon: Lock,
    keys: ['session_timeout_minutes', 'password_min_length', 'max_failed_login_attempts', 'transfer_require_approval']
  },
  {
    key: 'notifications', icon: Bell,
    keys: ['notification_email_enabled', 'notification_sms_enabled']
  },
  {
    key: 'dashboard', icon: Clock,
    keys: ['dashboard_refresh_seconds']
  }
];

export default function AdminSettings() {
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation('admin');

  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [activeGroup, setActiveGroup] = useState(0);

  if (!hasPermission('system.settings.view')) return <Unauthorized />;

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSettings();
      setSettings(data);
      const initial: Record<string, string> = {};
      data.forEach(s => { initial[s.key] = s.value; });
      setEdits(initial);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasPermission('system.settings.manage')) return;
    setSaving(true);
    try {
      const payload = Object.entries(edits).map(([key, value]) => ({ key, value }));
      await adminService.updateSettings(payload);
      setSaveMsg(t('save_success'));
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const group = SETTING_GROUPS[activeGroup];
  const GroupIcon = group.icon;
  const groupSettings = group.keys
    .map(key => settings.find(s => s.key === key))
    .filter(Boolean) as SystemSetting[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-105 dark:border-slate-800">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-indigo-500" />
            {t('title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{t('desc')}</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && (
            <Badge variant="success" className="px-3 py-1 text-xs">
              {saveMsg}
            </Badge>
          )}
          <Button variant="ghost" size="icon" onClick={fetchSettings} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {hasPermission('system.settings.manage') && (
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? t('saving') : t('save_settings')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Group Tabs */}
        <Card className="p-3 flex flex-col gap-1 h-fit md:col-span-1">
          {SETTING_GROUPS.map((g, i) => {
            const Icon = g.icon;
            return (
              <button
                key={g.key}
                onClick={() => setActiveGroup(i)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all text-right cursor-pointer ${
                  activeGroup === i
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(g.key)}
              </button>
            );
          })}
        </Card>

        {/* Settings Panel */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <GroupIcon className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t(group.key)}</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 max-w-2xl">
                {groupSettings.length === 0 && (
                  <p className="text-slate-400 italic text-xs">{t('no_settings')}</p>
                )}
                {groupSettings.map(setting => (
                  <Card key={setting.key} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-mono text-indigo-600 dark:text-indigo-400 mb-1">{setting.key}</label>
                        {setting.description && (
                          <p className="text-xs text-slate-450 dark:text-slate-500 mb-3">{setting.description}</p>
                        )}
                        <Input
                          type="text"
                          value={edits[setting.key] ?? setting.value}
                          onChange={e => setEdits(prev => ({ ...prev, [setting.key]: e.target.value }))}
                          disabled={!hasPermission('system.settings.manage')}
                        />
                      </div>
                      {edits[setting.key] !== setting.value && (
                        <Badge variant="warning" className="mt-7 text-xs">
                          {t('modified')}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
