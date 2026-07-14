import { useState, useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { GitFork, ArrowLeftRight, Check, X, AlertCircle } from 'lucide-react';
import { workforceService, EmployeeTransfer } from '../services/workforceService';
import { schedulingService } from '../services/schedulingService';
import { apiClient } from '../api/client';
import Unauthorized from './Unauthorized';

interface OrganizationUnit {
  id: string;
  name: string;
  code: string;
}

interface SimpleEmployee {
  id: string;
  first_name: string;
  last_name: string;
  org_unit_id: string;
  rank: string;
  position: string;
}

export default function Transfers() {
  const { direction } = useUIStore();
  const { hasPermission } = useAuthStore();
  const isRTL = direction === 'rtl';

  if (!hasPermission('transfers.view')) {
    return <Unauthorized />;
  }

  const [transfers, setTransfers] = useState<EmployeeTransfer[]>([]);
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);
  const [units, setUnits] = useState<OrganizationUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // New Request Form state
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      const transfersData = await workforceService.getTransfers();
      setTransfers(transfersData);

      // Load employees and organization tree for selection lists
      const empRes = await apiClient.get('/api/workforce/employees');
      setEmployees((empRes as any).data || []);

      const unitsData = await schedulingService.getOrganizationTree();
      setUnits(unitsData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load transfer page assets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedEmpId || !selectedUnitId) {
      setErrorMsg(isRTL ? 'אנא בחר חייל ויחידת יעד.' : 'Please select both an employee and a target unit.');
      return;
    }

    try {
      setIsSubmitting(true);
      await workforceService.requestTransfer(selectedEmpId, selectedUnitId, reason);
      setSuccessMsg(isRTL ? 'בקשת ההעברה נוצרה בהצלחה.' : 'Transfer request submitted successfully.');
      setSelectedEmpId('');
      setSelectedUnitId('');
      setReason('');
      
      // Reload lists
      const transfersData = await workforceService.getTransfers();
      setTransfers(transfersData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await workforceService.approveTransfer(id);
      setSuccessMsg(isRTL ? 'הבקשה אושרה והחייל הועבר.' : 'Transfer approved. Employee relocated.');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve transfer.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await workforceService.rejectTransfer(id);
      setSuccessMsg(isRTL ? 'בקשת ההעברה נדחתה.' : 'Transfer request rejected.');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject transfer.');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await workforceService.cancelTransfer(id);
      setSuccessMsg(isRTL ? 'הבקשה בוטלה בהצלחה.' : 'Transfer request cancelled.');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel transfer.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <ArrowLeftRight className="h-8 w-8 text-indigo-650" />
          {isRTL ? 'העברות כוח אדם' : 'Personnel Transfers'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {isRTL ? 'ניהול מעברי חיילים וקצינים בין מחלקות, מדורים וחוליות' : 'Initiate and authorize employee relocation between organization units.'}
        </p>
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
        {/* Request Form (Visible if has permission to request) */}
        {hasPermission('transfers.request') && (
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-6 shadow-sm glassmorphism self-start">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <GitFork className="h-5 w-5 text-indigo-500" />
              {isRTL ? 'בקשת העברה חדשה' : 'Submit Transfer Request'}
            </h3>

            <form onSubmit={handleRequestTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {isRTL ? 'בחר חייל' : 'Select Employee'}
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                >
                  <option value="">-- {isRTL ? 'בחר חייל' : 'Select Employee'} --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.rank} {emp.first_name} {emp.last_name} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {isRTL ? 'יחידת יעד' : 'Destination Unit'}
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                >
                  <option value="">-- {isRTL ? 'בחר יחידה' : 'Select Unit'} --</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {isRTL ? 'סיבת העברה' : 'Reason'}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  placeholder={isRTL ? 'הסבר קצר על הצורך בהעברה...' : 'Describe the reason for transfer...'}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-colors"
              >
                {isSubmitting ? (isRTL ? 'שולח...' : 'Submitting...') : (isRTL ? 'שלח בקשה' : 'Submit Request')}
              </button>
            </form>
          </div>
        )}

        {/* Requests Feed */}
        <div className={hasPermission('transfers.request') ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-6 shadow-sm glassmorphism">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
              {isRTL ? 'בקשות העברה פעילות' : 'Transfer Requests'}
            </h3>

            {loading ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                {isRTL ? 'טוען העברות...' : 'Loading transfers...'}
              </div>
            ) : transfers.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                {isRTL ? 'אין בקשות העברה רשומות' : 'No transfer requests recorded.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                      <th className="py-3 px-4">{isRTL ? 'חייל' : 'Employee'}</th>
                      <th className="py-3 px-4">{isRTL ? 'מיחידה' : 'From'}</th>
                      <th className="py-3 px-4">{isRTL ? 'ליחידה' : 'To'}</th>
                      <th className="py-3 px-4">{isRTL ? 'סטטוס' : 'Status'}</th>
                      <th className="py-3 px-4">{isRTL ? 'סיבה' : 'Reason'}</th>
                      <th className="py-3 px-4">{isRTL ? 'פעולות' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-55/40 dark:divide-slate-850">
                    {transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-white">
                          {t.employee_name}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-450">{t.from_unit_name}</td>
                        <td className="py-3 px-4 text-slate-550 dark:text-slate-400 font-medium">{t.to_unit_name}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-semibold ${getStatusBadge(t.status)}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-500" title={t.reason}>
                          {t.reason || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {t.status === 'PENDING' && hasPermission('transfers.approve') && (
                              <>
                                <button
                                  onClick={() => handleApprove(t.id)}
                                  className="p-1 text-emerald-650 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-md"
                                  title={isRTL ? 'אשר העברה' : 'Approve Transfer'}
                                >
                                  <Check className="h-4.5 w-4.5" />
                                </button>
                                <button
                                  onClick={() => handleReject(t.id)}
                                  className="p-1 text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md"
                                  title={isRTL ? 'דחה העברה' : 'Reject Transfer'}
                                >
                                  <X className="h-4.5 w-4.5" />
                                </button>
                              </>
                            )}

                            {t.status === 'PENDING' && hasPermission('transfers.request') && (
                              <button
                                onClick={() => handleCancel(t.id)}
                                className="px-2 py-1 text-2xs font-medium text-slate-550 hover:text-slate-900 border border-slate-200 dark:border-slate-800 rounded-md transition-colors"
                              >
                                {isRTL ? 'בטל בקשה' : 'Cancel'}
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
