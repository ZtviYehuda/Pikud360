import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';
import { adminService, AuditLogEntry, AuditFilters } from '../../services/adminService';
import Unauthorized from '../Unauthorized';
import { Shield, Download, ChevronLeft, ChevronRight, Filter, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';



const SEVERITY_ICONS: Record<string, any> = {
  INFO: Info, WARNING: AlertTriangle, ERROR: AlertOctagon, CRITICAL: AlertOctagon,
};

export default function AuditCenter() {
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation('admin');

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    setIsMobile(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

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

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'INFO': return 'info';
      case 'WARNING': return 'warning';
      case 'ERROR':
      case 'CRITICAL': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-105 dark:border-slate-800">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-500" />
            {t('audit_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{total.toLocaleString()} {t('records')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <Filter className="h-4 w-4 mr-2" /> {t('filter')}
          </Button>
          {hasPermission('audit.export') && (
            <Button 
              onClick={handleExport} 
              disabled={exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? t('exporting') : t('export_csv')}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {filterOpen && (
        <Card className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'event_type', label: t('event_type') },
            { key: 'severity', label: t('severity') },
            { key: 'user_id', label: t('user_id') },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
              <Input
                value={(tempFilters as any)[key] ?? ''}
                onChange={e => setTempFilters(prev => ({ ...prev, [key]: e.target.value || undefined }))}
              />
            </div>
          ))}
          <div className="flex items-end gap-2">
            <Button onClick={applyFilters} className="flex-1">
              {t('apply')}
            </Button>
            <Button 
              variant="outline"
              onClick={() => { setTempFilters({}); setFilters({ page: 1, page_size: pageSize }); setFilterOpen(false); fetchAudit(1, { page: 1, page_size: pageSize }); }}
            >
              {t('clear')}
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <div>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {isMobile ? (
              <div className="space-y-4">
                {entries.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 border rounded-xl">{t('no_records')}</div>
                ) : (
                  entries.map(entry => {
                    const SIcon = SEVERITY_ICONS[entry.severity] || Info;
                    return (
                      <div key={entry.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-900/30 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-350">{entry.event_type}</span>
                          <Badge variant={getSeverityBadgeVariant(entry.severity)} className="gap-1 px-2.5 py-0.5">
                            <SIcon className="h-3 w-3" />
                            {entry.severity}
                          </Badge>
                        </div>
                        <div className="text-slate-800 dark:text-white font-medium">{entry.action}</div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-105 dark:border-slate-800 text-[10px] text-slate-500">
                          <div>
                            <span className="text-slate-400">{t('table')}: </span>
                            <span className="font-mono text-slate-655 dark:text-slate-350">{entry.table_name}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">{t('user')}: </span>
                            <span className="font-mono text-slate-655 dark:text-slate-350">{entry.user_id?.slice(0, 8) ?? '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">IP: </span>
                            <span className="text-slate-550 dark:text-slate-350">{entry.ip_address}</span>
                          </div>
                          <div className="text-left font-semibold">
                            <span>{new Date(entry.created_at).toLocaleString('he-IL')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">{t('timestamp')}</TableHead>
                      <TableHead className="text-left">{t('event_type')}</TableHead>
                      <TableHead className="text-left">{t('action')}</TableHead>
                      <TableHead className="text-left">{t('table')}</TableHead>
                      <TableHead className="text-left">{t('user')}</TableHead>
                      <TableHead className="text-left">{t('ip')}</TableHead>
                      <TableHead className="text-left">{t('severity')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-slate-500">{t('no_records')}</TableCell>
                      </TableRow>
                    ) : entries.map(entry => {
                      const SIcon = SEVERITY_ICONS[entry.severity] || Info;
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="text-slate-400 whitespace-nowrap text-xs">
                            {new Date(entry.created_at).toLocaleString('he-IL')}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-355">{entry.event_type}</TableCell>
                          <TableCell className="text-slate-800 dark:text-white font-medium">{entry.action}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">{entry.table_name}</TableCell>
                          <TableCell className="text-slate-450 text-xs font-mono">{entry.user_id?.slice(0, 8) ?? '—'}</TableCell>
                          <TableCell className="text-slate-400 text-xs">{entry.ip_address}</TableCell>
                          <TableCell>
                            <Badge variant={getSeverityBadgeVariant(entry.severity)} className="gap-1 px-2.5 py-0.5">
                              <SIcon className="h-3 w-3" />
                              {entry.severity}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 text-sm text-slate-450">
              <span>{t('page_info', { page, totalPages })}</span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  size="icon"
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline"
                  size="icon"
                  disabled={page === totalPages} 
                  onClick={() => setPage(p => p + 1)}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
