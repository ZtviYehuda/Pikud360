import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import { GitFork, ArrowLeftRight, Check, X, AlertCircle } from 'lucide-react';
import { workforceService, EmployeeTransfer } from '../services/workforceService';
import { schedulingService } from '../services/schedulingService';
import { apiClient } from '../api/client';
import Unauthorized from './Unauthorized';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'COMPLETED': return 'success';
      case 'REJECTED': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5 pb-2">
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
          <ArrowLeftRight className="h-8 w-8 text-indigo-650" />
          {t('transfers:title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{t('transfers:desc')}</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg flex items-center gap-2 border border-rose-100 dark:border-rose-900/30 text-xs font-semibold">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg flex items-center gap-2 border border-emerald-100 dark:border-emerald-900/30 text-xs font-semibold">
          <Check className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {hasPermission('transfers.request') && (
          <Card className="lg:col-span-1 p-6 self-start space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <GitFork className="h-5 w-5 text-indigo-500" />
              {t('transfers:new_request')}
            </h3>

            <form onSubmit={handleRequestTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {t('transfers:select_employee')}
                </label>
                <select value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
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
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
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
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  placeholder={t('transfers:reason_placeholder')} />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? t('transfers:submitting') : t('transfers:submit')}
              </Button>
            </form>
          </Card>
        )}

        <div className={hasPermission('transfers.request') ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <Card className="p-6">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              {t('transfers:active_requests')}
            </h3>

            {loading ? (
              <div className="py-12 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">{t('transfers:loading')}</div>
            ) : transfers.length === 0 ? (
              <div className="py-12 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">{t('transfers:no_records')}</div>
            ) : (
              <>
                {/* Desktop / Tablet View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('transfers:employee_column')}</TableHead>
                        <TableHead>{t('transfers:from_unit')}</TableHead>
                        <TableHead>{t('transfers:to_unit')}</TableHead>
                        <TableHead>{t('common:status')}</TableHead>
                        <TableHead>{t('transfers:reason')}</TableHead>
                        <TableHead>{t('common:actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transfers.map((tr) => (
                        <TableRow key={tr.id}>
                          <TableCell className="text-slate-800 dark:text-white">{tr.employee_name}</TableCell>
                          <TableCell className="text-slate-500 dark:text-slate-400">{tr.from_unit_name}</TableCell>
                          <TableCell className="text-slate-500 dark:text-slate-400 font-medium">{tr.to_unit_name}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(tr.status)}>{tr.status}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-slate-500" title={tr.reason}>{tr.reason || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {tr.status === 'PENDING' && hasPermission('transfers.approve') && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApprove(tr.id)}
                                    title={t('transfers:approve')}
                                    className="h-7 w-7 p-0 text-emerald-650 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReject(tr.id)}
                                    title={t('transfers:reject')}
                                    className="h-7 w-7 p-0 text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {tr.status === 'PENDING' && hasPermission('transfers.request') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancel(tr.id)}
                                  className="h-7 py-0.5 px-2 text-2xs"
                                >
                                  {t('transfers:cancel_request')}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View */}
                <div className="space-y-4 md:hidden">
                  {transfers.map((tr) => (
                    <div key={tr.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3 bg-slate-50/30 dark:bg-slate-900/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{tr.employee_name}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">{tr.from_unit_name} → {tr.to_unit_name}</p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(tr.status)}>{tr.status}</Badge>
                      </div>
                      {tr.reason && (
                        <p className="text-2xs text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2">{tr.reason}</p>
                      )}
                      {tr.status === 'PENDING' && (
                        <div className="flex gap-2 justify-end pt-2">
                          {hasPermission('transfers.approve') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(tr.id)}
                                className="h-8 text-2xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                {t('transfers:approve')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(tr.id)}
                                className="h-8 text-2xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                {t('transfers:reject')}
                              </Button>
                            </>
                          )}
                          {hasPermission('transfers.request') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel(tr.id)}
                              className="h-8 px-3 text-2xs"
                            >
                              {t('transfers:cancel_request')}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}


