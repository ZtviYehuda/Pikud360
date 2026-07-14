import { useTranslation } from 'react-i18next';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';

export default function Reports() {
  const { t } = useTranslation();

  const mockReports = [
    { id: 'rep-1', name: 'Monthly Attendance Summary', format: 'PDF', date: 'June 2026', size: '2.4 MB' },
    { id: 'rep-2', name: 'Shift Roster Audit Log', format: 'CSV', date: '01/07/2026', size: '482 KB' },
    { id: 'rep-3', name: 'Overtime Analysis Report', format: 'PDF', date: 'Q2 2026', size: '5.1 MB' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
          {t('reports:title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {t('reports:desc')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-white mb-4">
            {t('reports:exported_reports')}
          </h3>
          
          <div className="space-y-3">
            {mockReports.map((report) => (
              <div key={report.id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-250 bg-slate-50/50 dark:border-slate-850 dark:bg-slate-950/20 dark:hover:border-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400">
                    {report.format === 'PDF' ? <FileText className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-slate-800 dark:text-white block">{report.name}</span>
                    <span className="text-2xs text-slate-400">{report.date} • {report.size}</span>
                  </div>
                </div>
                
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-650 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 cursor-pointer">
                  <Download className="h-3.5 w-3.5" />
                  <span>{t('buttons:download')}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
