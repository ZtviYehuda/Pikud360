import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';
import { adminService, AuditLogEntry, AuditFilters } from '../../services/adminService';
import Unauthorized from '../Unauthorized';
import { Shield, Download, ChevronLeft, ChevronRight, Filter, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

const SEVERITY_STYLES: Record<string, string> = {
  INFO: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  WARNING: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  ERROR: 'bg-red-500/10 text-red-300 border-red-500/30',
  CRITICAL: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
};

const SEVERITY_ICONS: Record<string, any> = {
  INFO: Info, WARNING: AlertTriangle, ERROR: AlertOctagon, CRITICAL: AlertOctagon,
};

export default function AuditCenter() {
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation('admin');

  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState<AuditFilters>({ page: 1, page_size: pageSize });
  const [filterOpen, setFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<AuditFilters>({});

  if (!hasPermission('audit.view')) return <Unauthorized />;

  const fetchAudit = async (p = page, f: AuditFilters = filters) => {
    setLoading(true);
    try {
      const result = await adminService.getAuditLogs({ ...f, page: p, page_size: pageSize });
      setEntries(result.entries);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAudit(page, filters); }, [page]);

  const applyFilters = () => {
    setFilters({ ...tempFilters, page: 1, page_size: pageSize });
    setPage(1);
    fetchAudit(1, { ...tempFilters, page: 1, page_size: pageSize });
    setFilterOpen(false);
  };

  const handleExport = async () => {
    if (!hasPermission('audit.export')) return;
    setExporting(true);
    try {
      const blob = await adminService.exportAuditLogs(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'audit_export.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm px-8 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <Shield className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t('audit_title')}</h1>
              <p className="text-sm text-slate-400">{total.toLocaleString()} {t('records')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">
              <Filter className="h-4 w-4" /> {t('filter')}
            </button>
            {hasPermission('audit.export') && (
              <button onClick={handleExport} disabled={exporting}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition-colors disabled:opacity-50">
                <Download className="h-4 w-4" />
                {exporting ? t('exporting') : t('export_csv')}
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div className="mt-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'event_type', label: t('event_type') },
              { key: 'severity', label: t('severity') },
              { key: 'user_id', label: t('user_id') },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <input
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  value={(tempFilters as any)[key] ?? ''}
                  onChange={e => setTempFilters(prev => ({ ...prev, [key]: e.target.value || undefined }))}
                />
              </div>
            ))}
            <div className="flex items-end gap-2">
              <button onClick={applyFilters} className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition-colors">
                {t('apply')}
              </button>
              <button onClick={() => { setTempFilters({}); setFilters({ page: 1, page_size: pageSize }); setFilterOpen(false); fetchAudit(1, { page: 1, page_size: pageSize }); }}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
                {t('clear')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" /></div>
        ) : (
          <>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">{t('timestamp')}</th>
                    <th className="px-4 py-3 text-left">{t('event_type')}</th>
                    <th className="px-4 py-3 text-left">{t('action')}</th>
                    <th className="px-4 py-3 text-left">{t('table')}</th>
                    <th className="px-4 py-3 text-left">{t('user')}</th>
                    <th className="px-4 py-3 text-left">{t('ip')}</th>
                    <th className="px-4 py-3 text-left">{t('severity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-500">{t('no_records')}</td></tr>
                  ) : entries.map(entry => {
                    const SIcon = SEVERITY_ICONS[entry.severity] || Info;
                    return (
                      <tr key={entry.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                          {new Date(entry.created_at).toLocaleString('he-IL')}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-300">{entry.event_type}</td>
                        <td className="px-4 py-3 text-slate-300">{entry.action}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{entry.table_name}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs font-mono">{entry.user_id?.slice(0, 8) ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{entry.ip_address}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_STYLES[entry.severity] ?? 'bg-slate-700 text-slate-300'}`}>
                            <SIcon className="h-3 w-3" />
                            {entry.severity}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
              <span>{t('page_info', { page, totalPages })}</span>
              <div className="flex items-center gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
