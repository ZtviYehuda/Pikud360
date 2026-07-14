import { useUIStore } from '../stores/uiStore';
import { useTranslation } from 'react-i18next';
import { Settings2, Moon, Sun, Laptop, ShieldCheck } from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme } = useUIStore();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
          {t('common:settings')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {t('reports:desc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Visual Settings */}
        <div className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
            <Settings2 className="h-5 w-5 text-brand-600" />
            {t('common:settings')}
          </h3>
          
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-sm block text-slate-800 dark:text-white">
                {t('dashboard:status_ok')}
              </span>
            </div>
            <button onClick={toggleTheme}
              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 cursor-pointer">
              {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
              <Laptop className="h-5 w-5 text-emerald-600" />
              {t('common:admin')}
            </h3>
            
            <div className="space-y-3 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Client Engine:</span>
                <span className="font-semibold">Vite v7 + React v19</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Styling Core:</span>
                <span className="font-semibold">Tailwind CSS v4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Components layout:</span>
                <span className="font-semibold">Radix UI Primitives</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-semibold text-green-500 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> {t('common:success')}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
