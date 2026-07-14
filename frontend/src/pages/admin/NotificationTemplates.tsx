import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';
import { adminService, NotificationTemplate } from '../../services/adminService';
import Unauthorized from '../Unauthorized';
import { MessageSquare, Plus, Edit2, X, Mail, Smartphone, Globe } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';

const CHANNELS = ['IN_APP', 'EMAIL', 'SMS', 'WEBHOOK'];
const CHANNEL_ICONS: Record<string, any> = { IN_APP: MessageSquare, EMAIL: Mail, SMS: Smartphone, WEBHOOK: Globe };


export default function NotificationTemplates() {
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation('admin');

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

  const getChannelBadgeVariant = (channel: string) => {
    switch (channel?.toUpperCase()) {
      case 'SMS': return 'success';
      case 'EMAIL':
      case 'IN_APP': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-105 dark:border-slate-800">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-sky-500" />
            {t('tmpl_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{templates.length} {t('templates')}</p>
        </div>
        {hasPermission('notification_templates.manage') && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> {t('new_template')}
          </Button>
        )}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
          </div>
        ) : templates.length === 0 ? (
          <Card className="col-span-3 text-center py-20 text-slate-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-slate-400 text-xs font-semibold">{t('no_templates')}</p>
          </Card>
        ) : templates.map(tmpl => {
          const ChanIcon = CHANNEL_ICONS[tmpl.channel] || MessageSquare;
          return (
            <Card key={tmpl.id} className={`overflow-hidden flex flex-col justify-between ${!tmpl.is_active ? 'opacity-60' : ''}`}>
              <div>
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getChannelBadgeVariant(tmpl.channel)} className="gap-1 text-[10px]">
                        <ChanIcon className="h-3 w-3" />{tmpl.channel}
                      </Badge>
                      {tmpl.is_default && <Badge variant="warning" className="text-[10px]">{t('common:default') || 'ברירת מחדל'}</Badge>}
                    </div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">{tmpl.name}</h3>
                    <p className="text-xs text-slate-450 dark:text-slate-500">{tmpl.notification_type}</p>
                  </div>
                  {hasPermission('notification_templates.manage') && (
                    <Button variant="ghost" size="icon" onClick={() => openEdit(tmpl)} className="h-8 w-8 text-slate-400 hover:text-slate-800">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="px-5 py-4">
                  {tmpl.subject && <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{tmpl.subject}</p>}
                  <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed line-clamp-3">
                    {previewBody(tmpl.body_template, tmpl.variables_json)}
                  </p>
                </div>
              </div>
              {tmpl.variables_json.length > 0 && (
                <div className="px-5 pb-4 pt-1 flex flex-wrap gap-1.5 border-t border-slate-50 dark:border-slate-850 mt-auto">
                  {tmpl.variables_json.map(v => (
                    <span key={v} className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-mono">{`{{${v}}}`}</span>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl p-0 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-heading text-lg font-bold">{editTemplate ? t('edit_template') : t('new_template')}</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)} className="h-8 w-8"><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('name')}</label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('channel')}</label>
                  <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                    className="w-full rounded-lg border border-slate-205 bg-white py-2 px-3 text-sm focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white">
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('notification_type')}</label>
                <Input value={form.notification_type} onChange={e => setForm(f => ({ ...f, notification_type: e.target.value }))} />
              </div>
              {form.channel === 'EMAIL' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('subject')}</label>
                  <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('body_template')}</label>
                <textarea value={form.body_template} onChange={e => setForm(f => ({ ...f, body_template: e.target.value }))} rows={4}
                  className="w-full rounded-lg border border-slate-205 bg-slate-50 py-2 px-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-sky-500 resize-none dark:bg-slate-950" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('variables')}</label>
                <Input value={form.variables_json} onChange={e => setForm(f => ({ ...f, variables_json: e.target.value }))} placeholder='["name","unit","date"]' className="font-mono" />
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
