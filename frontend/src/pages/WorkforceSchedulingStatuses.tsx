import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import { schedulingService, ScheduleStatus } from '../services/schedulingService';
import { Shield, Edit2, CheckCircle2, XCircle, AlertCircle, Save, Ban } from 'lucide-react';
import Unauthorized from './Unauthorized';

export default function WorkforceSchedulingStatuses() {
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation();

  if (!hasPermission('schedule.status_manage')) {
    return <Unauthorized />;
  }

  const [statuses, setStatuses] = useState<ScheduleStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('AVAILABLE');
  const [color, setColor] = useState('#2196F3');
  const [sortOrder, setSortOrder] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const systemStatusCodes = ['AVAILABLE', 'SICK', 'VACATION', 'TRAINING', 'REINFORCEMENT', 'MISSION', 'OTHER', 'UNAVAILABLE'];

  useEffect(() => { fetchStatuses(); }, []);

  const fetchStatuses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await schedulingService.getStatuses();
      setStatuses(data);
    } catch (err: any) {
      setError(err.message || t('validation:unknown_error'));
      setStatuses([
        { id: '1', tenant_id: 't-1', code: 'AVAILABLE', name: t('scheduling:cat_available'), category: 'AVAILABLE', color: '#4CAF50', is_active: true, sort_order: 1 },
        { id: '2', tenant_id: 't-1', code: 'SICK', name: t('scheduling:cat_sick'), category: 'SICK', color: '#F44336', is_active: true, sort_order: 2 },
        { id: '3', tenant_id: 't-1', code: 'VACATION', name: t('scheduling:cat_vacation'), category: 'VACATION', color: '#FF9800', is_active: true, sort_order: 3 },
        { id: '4', tenant_id: 't-1', code: 'TRAINING', name: t('scheduling:cat_training'), category: 'TRAINING', color: '#9C27B0', is_active: true, sort_order: 4 },
        { id: '5', tenant_id: 't-1', code: 'REINFORCEMENT', name: t('scheduling:cat_reinforcement'), category: 'REINFORCEMENT', color: '#00BCD4', is_active: true, sort_order: 5 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!code || !name) {
      setFormError(t('validation:required_fields'));
      return;
    }
    try {
      const newStatus = await schedulingService.createStatus({ code: code.toUpperCase().replace(/\s+/g, '_'), name, category, color, sort_order: sortOrder });
      setStatuses([...statuses, newStatus]);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || t('validation:unknown_error'));
      const mockNew: ScheduleStatus = { id: Math.random().toString(), tenant_id: 't-1', code: code.toUpperCase().replace(/\s+/g, '_'), name, category, color, is_active: true, sort_order: sortOrder };
      setStatuses([...statuses, mockNew]);
      resetForm();
    }
  };

  const handleEdit = (status: ScheduleStatus) => {
    setIsEditing(status.id);
    setCode(status.code);
    setName(status.name);
    setCategory(status.category);
    setColor(status.color || '#2196F3');
    setSortOrder(status.sort_order);
    setFormError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!isEditing) return;
    try {
      const updated = await schedulingService.updateStatus(isEditing, { name, category, color, sort_order: sortOrder });
      setStatuses(statuses.map(s => s.id === isEditing ? updated : s));
      resetForm();
    } catch (err: any) {
      setFormError(err.message || t('validation:unknown_error'));
      setStatuses(statuses.map(s => s.id === isEditing ? { ...s, name, category, color, sort_order: sortOrder } : s));
      resetForm();
    }
  };

  const handleToggleActive = async (status: ScheduleStatus) => {
    try {
      const updated = await schedulingService.updateStatus(status.id, { is_active: !status.is_active });
      setStatuses(statuses.map(s => s.id === status.id ? updated : s));
    } catch {
      setStatuses(statuses.map(s => s.id === status.id ? { ...s, is_active: !s.is_active } : s));
    }
  };

  const handleDelete = async (statusId: string, statusCode: string) => {
    if (systemStatusCodes.includes(statusCode.toUpperCase())) {
      alert(t('scheduling:cannot_delete_system'));
      return;
    }
    if (!confirm(t('scheduling:confirm_disable'))) return;
    try {
      await schedulingService.deleteStatus(statusId);
      setStatuses(statuses.filter(s => s.id !== statusId));
    } catch {
      setStatuses(statuses.filter(s => s.id !== statusId));
    }
  };

  const resetForm = () => {
    setIsEditing(null); setCode(''); setName('');
    setCategory('AVAILABLE'); setColor('#2196F3'); setSortOrder(0); setFormError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
            {t('scheduling:status_catalog')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {t('scheduling:status_catalog_desc')}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20 text-red-650 dark:text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Editor Panel */}
        <div className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 h-fit">
          <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-brand-600" />
            {isEditing ? t('scheduling:edit_status') : t('scheduling:add_status')}
          </h3>

          <form onSubmit={isEditing ? handleUpdate : handleCreate} className="space-y-4">
            {formError && <div className="text-xs text-red-500 font-semibold">{formError}</div>}

            <div>
              <label className="block text-xs font-semibold text-slate-450 dark:text-slate-550 mb-1">
                {t('scheduling:status_code')} <span className="font-normal opacity-70">({t('scheduling:status_code_hint')})</span>
              </label>
              <input type="text" disabled={!!isEditing} value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="E.g., HOME_LEAVE"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-450 dark:text-slate-550 mb-1">
                {t('scheduling:display_name')}
              </label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={t('scheduling:display_name_placeholder')}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-450 dark:text-slate-550 mb-1">
                {t('scheduling:category')}
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950">
                <option value="AVAILABLE">{t('scheduling:cat_available')}</option>
                <option value="SICK">{t('scheduling:cat_sick')}</option>
                <option value="VACATION">{t('scheduling:cat_vacation')}</option>
                <option value="TRAINING">{t('scheduling:cat_training')}</option>
                <option value="REINFORCEMENT">{t('scheduling:cat_reinforcement')}</option>
                <option value="MISSION">{t('scheduling:cat_mission')}</option>
                <option value="OTHER">{t('scheduling:cat_other')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-450 dark:text-slate-550 mb-1">
                {t('scheduling:color')}
              </label>
              <div className="flex items-center gap-3">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-12 rounded border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer" />
                <span className="text-xs font-mono font-medium text-slate-500">{color}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-450 dark:text-slate-550 mb-1">
                {t('scheduling:sort_order')}
              </label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 cursor-pointer">
                <Save className="h-4 w-4" />
                {isEditing ? t('common:update') : t('common:save')}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-750 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer">
                  <Ban className="h-4 w-4" />
                  {t('common:cancel')}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Status List */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-white mb-4">
            {t('scheduling:status_catalog_list')}
          </h3>

          {loading ? (
            <div className="text-center py-10 text-slate-400 animate-pulse">{t('common:loading')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400">
                    <th className="py-3 px-2">{t('common:code')}</th>
                    <th className="py-3 px-2">{t('scheduling:display_name')}</th>
                    <th className="py-3 px-2">{t('scheduling:category')}</th>
                    <th className="py-3 px-2 text-center">{t('common:type')}</th>
                    <th className="py-3 px-2 text-center">{t('common:status')}</th>
                    <th className="py-3 px-2 text-start">{t('common:actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                  {statuses.sort((a, b) => a.sort_order - b.sort_order).map((status) => {
                    const isSystem = systemStatusCodes.includes(status.code.toUpperCase());
                    return (
                      <tr key={status.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                        <td className="py-3 px-2 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{status.code}</td>
                        <td className="py-3 px-2 font-medium text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: status.color || '#2196F3' }} />
                            {status.name}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-xs text-slate-450 font-medium">{status.category}</td>
                        <td className="py-3 px-2 text-center">
                          {isSystem ? (
                            <span className="px-2 py-0.5 rounded text-3xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{t('scheduling:type_system')}</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-3xs font-bold bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400">{t('scheduling:type_custom')}</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button disabled={isSystem} onClick={() => handleToggleActive(status)}
                            className="inline-flex items-center justify-center p-1 rounded-full cursor-pointer disabled:opacity-50">
                            {status.is_active ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-slate-400" />}
                          </button>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEdit(status)} title={t('common:edit')}
                              className="p-1 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer">
                              <Edit2 className="h-4.5 w-4.5" />
                            </button>
                            <button disabled={isSystem} onClick={() => handleDelete(status.id, status.code)} title={t('common:disable')}
                              className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer">
                              <Ban className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
