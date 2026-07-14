import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import { GitFork, ArrowLeftRight, Check, X, AlertCircle } from 'lucide-react';
import { workforceService, EmployeeTransfer } from '../services/workforceService';
import { schedulingService } from '../services/schedulingService';
import { apiClient } from '../api/client';
import Unauthorized from './Unauthorized';

interface OrganizationUnit { id: string; name: string; code: string; }
interface SimpleEmployee { id: string; first_name: string; last_name: string; org_unit_id: string; rank: string; position: string; }

export default function Transfers() {
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation();

  if (!hasPermission('transfers.view')) {
    return <Unauthorized />;
  }

  const [transfers, setTransfers] = useState<EmployeeTransfer[]>([]);
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);
  const [units, setUnits] = useState<OrganizationUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true); setErrorMsg('');
      const transfersData = await workforceService.getTransfers();
      setTransfers(transfersData);
      const empRes = await apiClient.get('/api/workforce/employees');
      setEmployees((empRes as any).data || []);
      const unitsData = await schedulingService.getOrganizationTree();
      setUnits(unitsData);
    } catch (err: any) {
      setErrorMsg(err.message || t('validation:network_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleRequestTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg('');
    if (!selectedEmpId || !selectedUnitId) { setErrorMsg(t('transfers:validation_select_both')); return; }
    try {
      setIsSubmitting(true);
      await workforceService.requestTransfer(selectedEmpId, selectedUnitId, reason);
      setSuccessMsg(t('transfers:success_submitted'));
      setSelectedEmpId(''); setSelectedUnitId(''); setReason('');
      const transfersData = await workforceService.getTransfers();
      setTransfers(transfersData);
    } catch (err: any) {
      setErrorMsg(err.message || t('validation:unknown_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try { await workforceService.approveTransfer(id); setSuccessMsg(t('transfers:success_approved')); loadData(); }
    catch (err: any) { setErrorMsg(err.message || t('validation:unknown_error')); }
  };

  const handleReject = async (id: string) => {
    try { await workforceService.rejectTransfer(id); setSuccessMsg(t('transfers:success_rejected')); loadData(); }
    catch (err: any) { setErrorMsg(err.message || t('validation:unknown_error')); }
  };

  const handleCancel = async (id: string) => {
    try { await workforceService.cancelTransfer(id); setSuccessMsg(t('transfers:success_cancelled')); loadData(); }
    catch (err: any) { setErrorMsg(err.message || t('validation:unknown_error')); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400';
      case 'REJECTED': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <ArrowLeftRight className="h-8 w-8 text-indigo-650" />
          {t('transfers:title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('transfers:desc')}</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg flex items-center gap-2 border border-rose-100 dark:border-rose-900/30">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg flex items-center gap-2 border border-emerald-100 dark:border-emerald-900/30">
          <Check className="h-5 w-5 shrink-0" />
          <span className="text-sm">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {hasPermission('transfers.request') && (
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-6 shadow-sm self-start">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <GitFork className="h-5 w-5 text-indigo-500" />
              {t('transfers:new_request')}
            </h3>

            <form onSubmit={handleRequestTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {t('transfers:select_employee')}
                </label>
                <select value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <option value="">-- {t('transfers:select_employee')} --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.rank} {emp.first_name} {emp.last_name} ({emp.position})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {t('transfers:destination_unit')}
                </label>
                <select value={selectedUnitId} onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <option value="">-- {t('transfers:select_unit')} --</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {t('transfers:reason')}
                </label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  placeholder={t('transfers:reason_placeholder')} />
              </div>

              <button type="submit" disabled={isSubmitting}
                className="w-full py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-colors">
                {isSubmitting ? t('transfers:submitting') : t('transfers:submit')}
              </button>
            </form>
          </div>
        )}

        <div className={hasPermission('transfers.request') ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
              {t('transfers:active_requests')}
            </h3>

            {loading ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">{t('transfers:loading')}</div>
            ) : transfers.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">{t('transfers:no_records')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                      <th className="py-3 px-4">{t('transfers:employee_column')}</th>
                      <th className="py-3 px-4">{t('transfers:from_unit')}</th>
                      <th className="py-3 px-4">{t('transfers:to_unit')}</th>
                      <th className="py-3 px-4">{t('common:status')}</th>
                      <th className="py-3 px-4">{t('transfers:reason')}</th>
                      <th className="py-3 px-4">{t('common:actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-55/40 dark:divide-slate-850">
                    {transfers.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-white">{tr.employee_name}</td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-450">{tr.from_unit_name}</td>
                        <td className="py-3 px-4 text-slate-550 dark:text-slate-400 font-medium">{tr.to_unit_name}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-semibold ${getStatusBadge(tr.status)}`}>{tr.status}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-500" title={tr.reason}>{tr.reason || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {tr.status === 'PENDING' && hasPermission('transfers.approve') && (
                              <>
                                <button onClick={() => handleApprove(tr.id)} title={t('transfers:approve')}
                                  className="p-1 text-emerald-650 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-md">
                                  <Check className="h-4.5 w-4.5" />
                                </button>
                                <button onClick={() => handleReject(tr.id)} title={t('transfers:reject')}
                                  className="p-1 text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md">
                                  <X className="h-4.5 w-4.5" />
                                </button>
                              </>
                            )}
                            {tr.status === 'PENDING' && hasPermission('transfers.request') && (
                              <button onClick={() => handleCancel(tr.id)}
                                className="px-2 py-1 text-2xs font-medium text-slate-550 hover:text-slate-900 border border-slate-200 dark:border-slate-800 rounded-md transition-colors">
                                {t('transfers:cancel_request')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
