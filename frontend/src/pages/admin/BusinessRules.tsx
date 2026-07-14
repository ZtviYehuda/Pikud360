import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';
import { adminService, BusinessRule } from '../../services/adminService';
import Unauthorized from '../Unauthorized';
import { BookOpen, Plus, Edit2, PowerOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

const RULE_TYPES = ['SICK_THRESHOLD', 'MANPOWER_MIN', 'TRANSFER_APPROVAL', 'UNAVAILABLE_LIMIT', 'SHIFT_VALIDATION', 'STATUS_RESTRICTION'];

export default function BusinessRules() {
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation('admin');

  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule] = useState<BusinessRule | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ rule_type: 'SICK_THRESHOLD', name: '', description: '', priority: 100, is_active: true, condition_json: '{}', action_json: '{}' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!hasPermission('business_rules.view')) return <Unauthorized />;

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    setLoading(true);
    try { setRules(await adminService.getBusinessRules()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditRule(null);
    setForm({ rule_type: 'SICK_THRESHOLD', name: '', description: '', priority: 100, is_active: true, condition_json: '{}', action_json: '{}' });
    setError(''); setShowModal(true);
  };

  const openEdit = (r: BusinessRule) => {
    setEditRule(r);
    setForm({ rule_type: r.rule_type, name: r.name, description: r.description ?? '', priority: r.priority, is_active: r.is_active, condition_json: JSON.stringify(r.condition_json, null, 2), action_json: JSON.stringify(r.action_json, null, 2) });
    setError(''); setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      let condition_json = {}; let action_json = {};
      try { condition_json = JSON.parse(form.condition_json); } catch { setError(t('invalid_condition_json')); setSaving(false); return; }
      try { action_json = JSON.parse(form.action_json); } catch { setError(t('invalid_action_json')); setSaving(false); return; }
      const payload = { ...form, condition_json, action_json };
      if (editRule) await adminService.updateBusinessRule(editRule.id, payload);
      else await adminService.createBusinessRule(payload);
      setShowModal(false); fetchRules();
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id: string) => {
    if (!hasPermission('business_rules.manage')) return;
    if (!confirm(t('confirm_deactivate_biz'))) return;
    await adminService.deleteBusinessRule(id);
    fetchRules();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-105 dark:border-slate-800">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-emerald-500" />
            {t('biz_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{rules.length} {t('configured_rules')}</p>
        </div>
        {hasPermission('business_rules.manage') && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> {t('new_rule')}
          </Button>
        )}
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : rules.length === 0 ? (
          <Card className="text-center py-20 text-slate-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-slate-400 text-xs font-semibold">{t('no_rules_biz')}</p>
          </Card>
        ) : rules.map(rule => (
          <Card key={rule.id} className={`overflow-hidden transition-all ${rule.is_active ? '' : 'opacity-60'}`}>
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}>
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-emerald-550 dark:bg-emerald-400' : 'bg-slate-400'}`} />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{rule.name}</p>
                  <p className="text-xs text-slate-450 dark:text-slate-500">{rule.rule_type} · Priority {rule.priority}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasPermission('business_rules.manage') && (
                  <>
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); openEdit(rule); }} className="h-8 w-8 text-slate-400 hover:text-slate-800"><Edit2 className="h-3.5 w-3.5" /></Button>
                    {rule.is_active && <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDeactivate(rule.id); }} className="h-8 w-8 text-slate-400 hover:text-red-500"><PowerOff className="h-3.5 w-3.5" /></Button>}
                  </>
                )}
                {expandedId === rule.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </div>
            {expandedId === rule.id && (
              <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">{t('condition')}</p>
                  <pre className="text-xs text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-950 rounded-lg p-3 overflow-auto max-h-48 border border-slate-100 dark:border-slate-850">{JSON.stringify(rule.condition_json, null, 2)}</pre>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">{t('action')}</p>
                  <pre className="text-xs text-amber-600 dark:text-amber-400 bg-slate-50 dark:bg-slate-950 rounded-lg p-3 overflow-auto max-h-48 border border-slate-100 dark:border-slate-850">{JSON.stringify(rule.action_json, null, 2)}</pre>
                </div>
                {rule.description && <p className="col-span-2 text-xs text-slate-500 leading-relaxed">{rule.description}</p>}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-xl p-0 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle>{editRule ? t('edit_rule') : t('new_rule')}</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('rule_type')}</label>
                <select value={form.rule_type} onChange={e => setForm(f => ({ ...f, rule_type: e.target.value }))}
                  className="w-full rounded-lg border border-slate-205 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white">
                  {RULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('priority')}</label>
                <Input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: +e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{t('name')}</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{t('condition_json')}</label>
              <textarea value={form.condition_json} onChange={e => setForm(f => ({ ...f, condition_json: e.target.value }))} rows={3}
                className="w-full rounded-lg border border-slate-205 bg-slate-50 py-2 px-3 text-xs font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500 resize-none dark:bg-slate-950" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{t('action_json')}</label>
              <textarea value={form.action_json} onChange={e => setForm(f => ({ ...f, action_json: e.target.value }))} rows={3}
                className="w-full rounded-lg border border-slate-205 bg-slate-50 py-2 px-3 text-xs font-mono text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500 resize-none dark:bg-slate-950" />
            </div>
            {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setShowModal(false)}>{t('cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '...' : t('save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
