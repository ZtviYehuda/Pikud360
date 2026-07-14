import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';
import { adminService, BusinessRule } from '../../services/adminService';
import Unauthorized from '../Unauthorized';
import { BookOpen, Plus, Edit2, PowerOff, X, ChevronDown, ChevronUp } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
            <BookOpen className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('biz_title')}</h1>
            <p className="text-sm text-slate-400">{rules.length} {t('configured_rules')}</p>
          </div>
        </div>
        {hasPermission('business_rules.manage') && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors">
            <Plus className="h-4 w-4" /> {t('new_rule')}
          </button>
        )}
      </div>

      {/* Rules List */}
      <div className="p-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" /></div>
        ) : rules.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{t('no_rules_biz')}</p>
          </div>
        ) : rules.map(rule => (
          <div key={rule.id} className={`bg-slate-900/50 border rounded-xl overflow-hidden transition-all ${rule.is_active ? 'border-slate-700/60' : 'border-slate-800/40 opacity-60'}`}>
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}>
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <div>
                  <p className="font-semibold text-white">{rule.name}</p>
                  <p className="text-xs text-slate-400">{rule.rule_type} · Priority {rule.priority}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasPermission('business_rules.manage') && (
                  <>
                    <button onClick={e => { e.stopPropagation(); openEdit(rule); }} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                    {rule.is_active && <button onClick={e => { e.stopPropagation(); handleDeactivate(rule.id); }} className="p-1.5 hover:bg-red-900/30 rounded-lg text-red-400 transition-colors"><PowerOff className="h-3.5 w-3.5" /></button>}
                  </>
                )}
                {expandedId === rule.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </div>
            {expandedId === rule.id && (
              <div className="border-t border-slate-800 px-5 py-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-505 mb-1">{t('condition')}</p>
                  <pre className="text-xs text-emerald-300 bg-slate-955 rounded-lg p-3 overflow-auto">{JSON.stringify(rule.condition_json, null, 2)}</pre>
                </div>
                <div>
                  <p className="text-xs text-slate-505 mb-1">{t('action')}</p>
                  <pre className="text-xs text-amber-300 bg-slate-955 rounded-lg p-3 overflow-auto">{JSON.stringify(rule.action_json, null, 2)}</pre>
                </div>
                {rule.description && <p className="col-span-2 text-sm text-slate-400">{rule.description}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-semibold text-white">{editRule ? t('edit_rule') : t('new_rule')}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('rule_type')}</label>
                  <select value={form.rule_type} onChange={e => setForm(f => ({ ...f, rule_type: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                    {RULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('priority')}</label>
                  <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: +e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t('name')}</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t('condition_json')}</label>
                <textarea value={form.condition_json} onChange={e => setForm(f => ({ ...f, condition_json: e.target.value }))} rows={3}
                  className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t('action_json')}</label>
                <textarea value={form.action_json} onChange={e => setForm(f => ({ ...f, action_json: e.target.value }))} rows={3}
                  className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500 resize-none" />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">{t('cancel')}</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                {saving ? '...' : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
