import { useTranslation } from 'react-i18next';
import { GitFork, Network, Layers } from 'lucide-react';

export default function Organization() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
          {t('common:organization')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {t('organization:desc')}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-8 py-8">
          
          {/* Executive Level */}
          <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 text-center max-w-xs shadow-sm dark:border-brand-900/60 dark:bg-brand-950/20">
            <Network className="mx-auto h-6 w-6 text-brand-600 mb-1" />
            <h4 className="font-bold text-slate-850 dark:text-white">{t('scheduling:brigade_hq')}</h4>
            <p className="text-xs text-brand-600 font-semibold">{t('organization:general_hq')}</p>
          </div>

          <div className="w-0.5 h-8 bg-slate-250 dark:bg-slate-800"></div>

          {/* Division Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl relative">
            <div className="flex flex-col items-center">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center w-full max-w-xs dark:border-slate-800 dark:bg-slate-950">
                <Layers className="mx-auto h-5 w-5 text-indigo-500 mb-1" />
                <h5 className="font-bold text-slate-800 dark:text-white">{t('organization:ops_division')}</h5>
                <p className="text-xs text-indigo-500 font-semibold">{t('organization:two_depts')}</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center w-full max-w-xs dark:border-slate-800 dark:bg-slate-950">
                <GitFork className="mx-auto h-5 w-5 text-purple-500 mb-1" />
                <h5 className="font-bold text-slate-800 dark:text-white">{t('organization:security_division')}</h5>
                <p className="text-xs text-purple-500 font-semibold">{t('organization:regional_hq')}</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
