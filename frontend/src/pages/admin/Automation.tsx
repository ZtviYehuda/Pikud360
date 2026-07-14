import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';
import { adminService, AutomationRule } from '../../services/adminService';
import Unauthorized from '../Unauthorized';
import { Zap, Plus, Edit2, PowerOff, X } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';

const TRIGGER_EVENTS = ['SICK_EXCEEDED', 'MANPOWER_SHORTAGE', 'PENDING_TRANSFER', 'PENDING_APPROVAL', 'EMPLOYEE_INACTIVE', 'MISSING_COMMANDER', 'UNASSIGNED_EXCEEDED'];
const ACTION_TYPES = ['NOTIFY_COMMANDER', 'CREATE_ALERT', 'ESCALATE', 'SEND_EMAIL', 'SEND_NOTIFICATION'];



export default function Automation() {
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation('admin');

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule] = useState<AutomationRule | null>(null);
  const [form, setForm] = useState({ name: '', description: '', trigger_event: 'SICK_EXCEEDED', condition_json: '{}', action_type: 'NOTIFY_COMMANDER', action_config: '{}', schedule_cron: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!hasPermission('automation.view')) return <Unauthorized />;

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    setLoading(true);
    try { setRules(await adminService.getAutomationRules()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditRule(null);
    setForm({ name: '', description: '', trigger_event: 'SICK_EXCEEDED', condition_json: '{}', action_type: 'NOTIFY_COMMANDER', action_config: '{}', schedule_cron: '', is_active: true });
    setError(''); setShowModal(true);
  };

  const openEdit = (r: AutomationRule) => {
    setEditRule(r);
    setForm({ name: r.name, description: r.description ?? '', trigger_event: r.trigger_event, condition_json: JSON.stringify(r.condition_json, null, 2), action_type: r.action_type, action_config: JSON.stringify(r.action_config, null, 2), schedule_cron: r.schedule_cron ?? '', is_active: r.is_active });
    setError(''); setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      let condition_json = {}; let action_config = {};
      try { condition_json = JSON.parse(form.condition_json); } catch { setError('Invalid condition JSON'); setSaving(false); return; }
      try { action_config = JSON.parse(form.action_config); } catch { setError('Invalid action config JSON'); setSaving(false); return; }
      const payload = { ...form, condition_json, action_config, schedule_cron: form.schedule_cron || undefined };
      if (editRule) await adminService.updateAutomationRule(editRule.id, payload);
      else await adminService.createAutomationRule(payload);
      setShowModal(false); fetchRules();
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm(t('confirm_deactivate_auto'))) return;
    await adminService.deleteAutomationRule(id);
    fetchRules();
  };

  const toggleActive = async (r: AutomationRule) => {
    await adminService.updateAutomationRule(r.id, { is_active: !r.is_active });
    fetchRules();
  };

  const getTriggerBadgeVariant = (ev: string) => {
    switch (ev?.toUpperCase()) {
      case 'SICK_EXCEEDED': return 'destructive';
      case 'MANPOWER_SHORTAGE': return 'warning';
      case 'PENDING_TRANSFER':
      case 'PENDING_APPROVAL': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-105 dark:border-slate-800">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-500" />
            {t('auto_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{rules.filter(r => r.is_active).length} {t('active_rules')}</p>
        </div>
        {hasPermission('automation.manage') && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> {t('new_rule')}
          </Button>
        )}
      </div>

      {/* Rules grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-yellow-500 border-t-transparent" />
          </div>
        ) : rules.length === 0 ? (
          <Card className="col-span-3 text-center py-20">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-30 text-slate-400" />
            <p className="text-slate-400 text-xs font-semibold">{t('no_rules')}</p>
          </Card>
        ) : rules.map(rule => (
          <Card key={rule.id} className={`p-5 transition-all ${rule.is_active ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">{rule.name}</h3>
                {rule.description && <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">{rule.description}</p>}
              </div>
              <div className="flex gap-1">
                {hasPermission('automation.manage') && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(rule)} className="h-8 w-8 text-slate-400 hover:text-slate-800">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeactivate(rule.id)} className="h-8 w-8 text-slate-400 hover:text-red-500">
                      <PowerOff className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant={getTriggerBadgeVariant(rule.trigger_event)} className="text-[10px]">
                {rule.trigger_event}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                → {rule.action_type}
              </Badge>
            </div>
            {rule.schedule_cron && (
              <p className="text-xs text-slate-500 font-mono">cron: {rule.schedule_cron}</p>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-450">{t('triggered')}: {rule.trigger_count}×</span>
              {hasPermission('automation.manage') && (
                <button onClick={() => toggleActive(rule)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${rule.is_active ? 'bg-yellow-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${rule.is_active ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl p-0 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-heading text-lg font-bold">{editRule ? t('edit') : t('new_automation')}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)} className="h-8 w-8"><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('name')}</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('trigger_event')}</label>
                  <select value={form.trigger_event} onChange={e => setForm(f => ({ ...f, trigger_event: e.target.value }))}
                    className="w-full rounded-lg border border-slate-205 bg-white py-2 px-3 text-sm focus:border-yellow-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white">
                    {TRIGGER_EVENTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('action_type')}</label>
                  <select value={form.action_type} onChange={e => setForm(f => ({ ...f, action_type: e.target.value }))}
                    className="w-full rounded-lg border border-slate-205 bg-white py-2 px-3 text-sm focus:border-yellow-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white">
                    {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('conditions')}</label>
                <textarea value={form.condition_json} onChange={e => setForm(f => ({ ...f, condition_json: e.target.value }))} rows={3}
                  className="w-full rounded-lg border border-slate-205 bg-slate-50 py-2 px-3 text-xs font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-yellow-500 resize-none dark:bg-slate-950" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('action_config')}</label>
                <textarea value={form.action_config} onChange={e => setForm(f => ({ ...f, action_config: e.target.value }))} rows={3}
                  className="w-full rounded-lg border border-slate-205 bg-slate-50 py-2 px-3 text-xs font-mono text-amber-600 dark:text-amber-400 focus:outline-none focus:border-yellow-500 resize-none dark:bg-slate-950" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Cron ({t('optional')})</label>
                <Input value={form.schedule_cron} onChange={e => setForm(f => ({ ...f, schedule_cron: e.target.value }))} placeholder="*/5 * * * *" className="font-mono" />
              </div>
              {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setShowModal(false)}>{t('cancel')}</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? '...' : t('save')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
