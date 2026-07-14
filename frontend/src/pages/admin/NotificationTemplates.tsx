import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { adminService, NotificationTemplate } from '../../services/adminService';
import Unauthorized from '../Unauthorized';
import { MessageSquare, Plus, Edit2, X, Mail, Smartphone, Globe } from 'lucide-react';

const CHANNELS = ['IN_APP', 'EMAIL', 'SMS', 'WEBHOOK'];
const CHANNEL_ICONS: Record<string, any> = { IN_APP: MessageSquare, EMAIL: Mail, SMS: Smartphone, WEBHOOK: Globe };
const CHANNEL_COLORS: Record<string, string> = {
  IN_APP: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  EMAIL: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  SMS: 'text-green-400 bg-green-500/10 border-green-500/30',
  WEBHOOK: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
};

export default function NotificationTemplates() {
  const { hasPermission } = useAuthStore();
  const { language } = useUIStore();
  const isHe = language === 'he';

  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<NotificationTemplate | null>(null);
  const [form, setForm] = useState({ name: '', notification_type: '', channel: 'IN_APP', subject: '', body_template: '', variables_json: '', is_active: true, is_default: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!hasPermission('notification_templates.view')) return <Unauthorized />;

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try { setTemplates(await adminService.getNotificationTemplates()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditTemplate(null);
    setForm({ name: '', notification_type: '', channel: 'IN_APP', subject: '', body_template: '', variables_json: '[]', is_active: true, is_default: false });
    setError(''); setShowModal(true);
  };

  const openEdit = (t: NotificationTemplate) => {
    setEditTemplate(t);
    setForm({ name: t.name, notification_type: t.notification_type, channel: t.channel, subject: t.subject ?? '', body_template: t.body_template, variables_json: JSON.stringify(t.variables_json), is_active: t.is_active, is_default: t.is_default });
    setError(''); setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      let variables_json: string[] = [];
      try { variables_json = JSON.parse(form.variables_json); } catch { setError('Invalid variables JSON'); setSaving(false); return; }
      const payload = { ...form, variables_json };
      if (editTemplate) await adminService.updateNotificationTemplate(editTemplate.id, payload);
      else await adminService.createNotificationTemplate(payload);
      setShowModal(false); fetchTemplates();
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  // Preview body with variable substitution
  const previewBody = (template: string, vars: string[]) => {
    let preview = template;
    vars.forEach(v => { preview = preview.replace(new RegExp(`{{${v}}}`, 'g'), `[${v}]`); });
    return preview;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/20 rounded-lg border border-sky-500/30">
            <MessageSquare className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{isHe ? 'תבניות הודעות' : 'Notification Templates'}</h1>
            <p className="text-sm text-slate-400">{templates.length} {isHe ? 'תבניות' : 'templates'}</p>
          </div>
        </div>
        {hasPermission('notification_templates.manage') && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-sm font-medium transition-colors">
            <Plus className="h-4 w-4" /> {isHe ? 'תבנית חדשה' : 'New Template'}
          </button>
        )}
      </div>

      {/* Templates Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" /></div>
        ) : templates.length === 0 ? (
          <div className="col-span-3 text-center py-20 text-slate-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{isHe ? 'לא הוגדרו תבניות' : 'No templates configured'}</p>
          </div>
        ) : templates.map(tmpl => {
          const ChanIcon = CHANNEL_ICONS[tmpl.channel] || MessageSquare;
          return (
            <div key={tmpl.id} className={`bg-slate-900/60 border border-slate-700/60 rounded-xl overflow-hidden ${!tmpl.is_active ? 'opacity-60' : ''}`}>
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full border font-medium ${CHANNEL_COLORS[tmpl.channel] ?? ''}`}>
                      <ChanIcon className="h-3 w-3" />{tmpl.channel}
                    </span>
                    {tmpl.is_default && <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">Default</span>}
                  </div>
                  <h3 className="font-semibold text-white">{tmpl.name}</h3>
                  <p className="text-xs text-slate-400">{tmpl.notification_type}</p>
                </div>
                {hasPermission('notification_templates.manage') && (
                  <button onClick={() => openEdit(tmpl)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                )}
              </div>
              <div className="px-5 py-4">
                {tmpl.subject && <p className="text-xs font-semibold text-slate-400 mb-1">{tmpl.subject}</p>}
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                  {previewBody(tmpl.body_template, tmpl.variables_json)}
                </p>
                {tmpl.variables_json.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tmpl.variables_json.map(v => (
                      <span key={v} className="px-1.5 py-0.5 text-xs rounded bg-slate-800 text-slate-400 font-mono">{`{{${v}}}`}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-semibold">{editTemplate ? (isHe ? 'עריכה' : 'Edit Template') : (isHe ? 'תבנית חדשה' : 'New Template')}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{isHe ? 'שם' : 'Name'}</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{isHe ? 'ערוץ' : 'Channel'}</label>
                  <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500">
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{isHe ? 'סוג הודעה' : 'Notification Type'}</label>
                <input value={form.notification_type} onChange={e => setForm(f => ({ ...f, notification_type: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
              </div>
              {form.channel === 'EMAIL' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{isHe ? 'כותרת' : 'Subject'}</label>
                  <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-400 mb-1">{isHe ? 'תוכן תבנית' : 'Body Template'}</label>
                <textarea value={form.body_template} onChange={e => setForm(f => ({ ...f, body_template: e.target.value }))} rows={4}
                  className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{isHe ? 'משתנים (JSON)' : 'Variables (JSON array)'}</label>
                <input value={form.variables_json} onChange={e => setForm(f => ({ ...f, variables_json: e.target.value }))} placeholder='["name","unit","date"]'
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-sky-500" />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">{isHe ? 'ביטול' : 'Cancel'}</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                {saving ? '...' : (isHe ? 'שמור' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
