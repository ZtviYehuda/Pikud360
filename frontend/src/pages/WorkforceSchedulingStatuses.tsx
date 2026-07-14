import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import { schedulingService, ScheduleStatus } from '../services/schedulingService';
import { Shield, Edit2, CheckCircle2, XCircle, AlertCircle, Save, Ban } from 'lucide-react';
import Unauthorized from './Unauthorized';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';

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
      <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-105 dark:border-slate-800">
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('scheduling:status_catalog')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
          {t('scheduling:status_catalog_desc')}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20 text-red-650 dark:text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Editor Panel */}
        <Card className="p-6 h-fit">
          <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-brand-600" />
            {isEditing ? t('scheduling:edit_status') : t('scheduling:add_status')}
          </h3>

          <form onSubmit={isEditing ? handleUpdate : handleCreate} className="space-y-4">
            {formError && <div className="text-xs text-red-500 font-semibold">{formError}</div>}

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {t('scheduling:status_code')} <span className="font-normal opacity-70">({t('scheduling:status_code_hint')})</span>
              </label>
              <Input type="text" disabled={!!isEditing} value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="E.g., HOME_LEAVE"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {t('scheduling:display_name')}
              </label>
              <Input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={t('scheduling:display_name_placeholder')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {t('scheduling:category')}
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-205 bg-white py-2 px-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white">
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
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {t('scheduling:color')}
              </label>
              <div className="flex items-center gap-3">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-12 rounded border border-slate-205 dark:border-slate-700 bg-transparent cursor-pointer" />
                <span className="text-xs font-mono font-medium text-slate-500">{color}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {t('scheduling:sort_order')}
              </label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">
                <Save className="h-4 w-4" />
                {isEditing ? t('common:update') : t('common:save')}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <Ban className="h-4 w-4" />
                  {t('common:cancel')}
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Status List */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white mb-4">
            {t('scheduling:status_catalog_list')}
          </h3>

          {loading ? (
            <div className="text-center py-10 text-slate-400 animate-pulse">{t('common:loading')}</div>
          ) : (
            <>
              {/* Desktop / Tablet View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-2">{t('common:code')}</TableHead>
                      <TableHead className="px-2">{t('scheduling:display_name')}</TableHead>
                      <TableHead className="px-2">{t('scheduling:category')}</TableHead>
                      <TableHead className="px-2 text-center">{t('common:type')}</TableHead>
                      <TableHead className="px-2 text-center">{t('common:status')}</TableHead>
                      <TableHead className="px-2 text-start">{t('common:actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statuses.sort((a, b) => a.sort_order - b.sort_order).map((status) => {
                      const isSystem = systemStatusCodes.includes(status.code.toUpperCase());
                      return (
                        <TableRow key={status.id}>
                          <TableCell className="px-2 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{status.code}</TableCell>
                          <TableCell className="px-2 font-medium text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className="h-3.5 w-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: status.color || '#2196F3' }} />
                              {status.name}
                            </div>
                          </TableCell>
                          <TableCell className="px-2 text-xs text-slate-450 font-medium">{status.category}</TableCell>
                          <TableCell className="px-2 text-center">
                            {isSystem ? (
                              <Badge variant="secondary" className="text-[10px]">{t('scheduling:type_system')}</Badge>
                            ) : (
                              <Badge variant="default" className="text-[10px] bg-brand-50 text-brand-600 hover:bg-brand-100">{t('scheduling:type_custom')}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-2 text-center">
                            <Button variant="ghost" size="icon" disabled={isSystem} onClick={() => handleToggleActive(status)}
                              className="h-8 w-8 rounded-full disabled:opacity-50">
                              {status.is_active ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-slate-400" />}
                            </Button>
                          </TableCell>
                          <TableCell className="px-2">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(status)} title={t('common:edit')}
                                className="h-8 w-8 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400">
                                <Edit2 className="h-4.5 w-4.5" />
                              </Button>
                              <Button variant="ghost" size="icon" disabled={isSystem} onClick={() => handleDelete(status.id, status.code)} title={t('common:disable')}
                                className="h-8 w-8 text-slate-400 hover:text-red-500 disabled:opacity-30">
                                <Ban className="h-4.5 w-4.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="space-y-4 md:hidden">
                {statuses.sort((a, b) => a.sort_order - b.sort_order).map((status) => {
                  const isSystem = systemStatusCodes.includes(status.code.toUpperCase());
                  return (
                    <div key={status.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3 bg-slate-50/30 dark:bg-slate-900/30">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="h-3.5 w-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: status.color || '#2196F3' }} />
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{status.name}</h4>
                        </div>
                        {isSystem ? (
                          <Badge variant="secondary" className="text-[10px]">{t('scheduling:type_system')}</Badge>
                        ) : (
                          <Badge variant="default" className="text-[10px] bg-brand-50 text-brand-600 hover:bg-brand-100">{t('scheduling:type_custom')}</Badge>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-505">
                        <span>Code: <span className="font-mono text-slate-700 dark:text-slate-350">{status.code}</span></span>
                        <span>{t('scheduling:category')}: <span className="font-medium text-slate-700 dark:text-slate-350">{status.category}</span></span>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">{t('common:status')}:</span>
                          <Button variant="ghost" size="icon" disabled={isSystem} onClick={() => handleToggleActive(status)}
                            className="h-8 w-8 rounded-full disabled:opacity-50">
                            {status.is_active ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /> : <XCircle className="h-4.5 w-4.5 text-slate-400" />}
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(status)} className="h-8 text-2xs flex items-center gap-1">
                            <Edit2 className="h-3.5 w-3.5" />
                            {t('common:edit')}
                          </Button>
                          <Button variant="outline" size="sm" disabled={isSystem} onClick={() => handleDelete(status.id, status.code)} className="h-8 text-2xs flex items-center gap-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                            <Ban className="h-3.5 w-3.5" />
                            {t('common:disable')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
