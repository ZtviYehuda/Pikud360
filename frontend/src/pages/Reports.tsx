import { useTranslation } from 'react-i18next';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export default function Reports() {
  const { t } = useTranslation();

  const mockReports = [
    { id: 'rep-1', name: 'Monthly Attendance Summary', format: 'PDF', date: 'June 2026', size: '2.4 MB' },
    { id: 'rep-2', name: 'Shift Roster Audit Log', format: 'CSV', date: '01/07/2026', size: '482 KB' },
    { id: 'rep-3', name: 'Overtime Analysis Report', format: 'PDF', date: 'Q2 2026', size: '5.1 MB' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5 pb-2">
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('reports:title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
          {t('reports:desc')}
        </p>
      </div>

      <Card className="p-6">
        <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white mb-4">
          {t('reports:exported_reports')}
        </h3>
        
        <div className="space-y-3">
          {mockReports.map((report) => (
            <div key={report.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-105 hover:border-slate-205 bg-slate-50/50 dark:border-slate-850 dark:bg-slate-950/20 dark:hover:border-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400">
                  {report.format === 'PDF' ? <FileText className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
                </div>
                <div>
                  <span className="font-semibold text-sm text-slate-800 dark:text-white block">{report.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xs text-slate-400 font-medium">{report.date} • {report.size}</span>
                    <Badge variant={report.format === 'PDF' ? 'destructive' : 'success'} className="text-[9px]">
                      {report.format}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto justify-center sm:justify-start">
                <Download className="h-3.5 w-3.5" />
                <span>{t('buttons:download')}</span>
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

