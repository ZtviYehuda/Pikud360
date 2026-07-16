import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import {
  Calendar, ArrowLeftRight, FileText, Zap
} from 'lucide-react';

export default function QuickActions() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card className="border border-slate-200/60 dark:border-slate-800">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white select-none">
          <Zap className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
          <span>{t('buttons:quick_actions')}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">

        {/* Priority 1 — Create Assignment: primary full-width colored card */}
        <button
          type="button"
          onClick={() => navigate('/workforce/scheduling')}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] dark:bg-brand-700 dark:hover:bg-brand-600 text-white transition-all duration-150 shadow-md shadow-brand-500/25 cursor-pointer min-h-[76px] text-right"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight">
              {t('buttons:quick_create_assignment')}
            </p>
            <p className="text-xs text-white/75 mt-0.5 leading-snug">
              {t('buttons:quick_create_assignment_desc')}
            </p>
          </div>
        </button>

        {/* Priority 2 — Transfer Employee: secondary full-width card */}
        <button
          type="button"
          onClick={() => navigate('/transfers')}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm active:scale-[0.98] transition-all duration-150 cursor-pointer min-h-[76px] text-right group"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/25 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight text-slate-800 dark:text-white">
              {t('buttons:quick_transfer_employee')}
            </p>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5 leading-snug">
              {t('buttons:quick_transfer_employee_desc')}
            </p>
          </div>
        </button>

        {/* Priority 3 — Open Reports: tertiary inline action */}
        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.98] transition-all duration-150 cursor-pointer min-h-[44px] group"
        >
          <FileText className="h-3.5 w-3.5 shrink-0 group-hover:text-brand-500 transition-colors" />
          <span className="text-xs font-semibold">{t('buttons:quick_open_reports')}</span>
        </button>

      </CardContent>
    </Card>
  );
}
