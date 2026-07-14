import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { adminService, SystemSetting } from '../../services/adminService';
import Unauthorized from '../Unauthorized';
import { Settings, Save, RefreshCw, Lock, Bell, Clock, Globe, Shield, Calendar } from 'lucide-react';

const SETTING_GROUPS: { label: string; labelHe: string; icon: any; keys: string[] }[] = [
  {
    label: 'General', labelHe: 'כללי', icon: Globe,
    keys: ['default_timezone', 'default_language', 'date_format', 'working_days', 'weekend_days']
  },
  {
    label: 'Scheduling', labelHe: 'שיבוץ', icon: Calendar,
    keys: ['scheduling_mode_default', 'sick_alert_threshold_pct', 'unavailable_alert_threshold', 'min_manpower_threshold_pct']
  },
  {
    label: 'Security', labelHe: 'אבטחה', icon: Lock,
    keys: ['session_timeout_minutes', 'password_min_length', 'max_failed_login_attempts', 'transfer_require_approval']
  },
  {
    label: 'Notifications', labelHe: 'התראות', icon: Bell,
    keys: ['notification_email_enabled', 'notification_sms_enabled']
  },
  {
    label: 'Dashboard', labelHe: 'לוח בקרה', icon: Clock,
    keys: ['dashboard_refresh_seconds']
  }
];

export default function AdminSettings() {
  const { hasPermission } = useAuthStore();
  const { language } = useUIStore();
  const isHe = language === 'he';

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
      setSaveMsg(isHe ? 'ההגדרות נשמרו בהצלחה' : 'Settings saved successfully');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
              <Settings className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{isHe ? 'הגדרות מערכת' : 'System Settings'}</h1>
              <p className="text-sm text-slate-400">{isHe ? 'הגדרות פלטפורמה גלובליות' : 'Global platform configuration'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saveMsg && (
              <span className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">{saveMsg}</span>
            )}
            <button onClick={fetchSettings} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
            {hasPermission('system.settings.manage') && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? (isHe ? 'שומר...' : 'Saving...') : (isHe ? 'שמור הגדרות' : 'Save Settings')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-88px)]">
        {/* Group Tabs */}
        <nav className="w-52 border-r border-slate-800 bg-slate-900/40 p-3 flex flex-col gap-1">
          {SETTING_GROUPS.map((g, i) => {
            const Icon = g.icon;
            return (
              <button
                key={g.label}
                onClick={() => setActiveGroup(i)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  activeGroup === i
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {isHe ? g.labelHe : g.label}
              </button>
            );
          })}
        </nav>

        {/* Settings Panel */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <GroupIcon className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">{isHe ? group.labelHe : group.label}</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 max-w-2xl">
                {groupSettings.length === 0 && (
                  <p className="text-slate-500 text-sm">{isHe ? 'אין הגדרות בקטגוריה זו' : 'No settings in this category'}</p>
                )}
                {groupSettings.map(setting => (
                  <div key={setting.key} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-mono text-indigo-300 mb-1">{setting.key}</label>
                        {setting.description && (
                          <p className="text-xs text-slate-500 mb-3">{setting.description}</p>
                        )}
                        <input
                          type="text"
                          value={edits[setting.key] ?? setting.value}
                          onChange={e => setEdits(prev => ({ ...prev, [setting.key]: e.target.value }))}
                          disabled={!hasPermission('system.settings.manage')}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        />
                      </div>
                      {edits[setting.key] !== setting.value && (
                        <span className="mt-7 shrink-0 px-2 py-0.5 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full">
                          {isHe ? 'שונה' : 'modified'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
