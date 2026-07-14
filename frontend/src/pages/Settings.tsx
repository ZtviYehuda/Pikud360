import { useUIStore } from '../stores/uiStore';
import { useTranslation } from 'react-i18next';
import { Settings2, Moon, Sun, Laptop, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export default function Settings() {
  const { theme, toggleTheme } = useUIStore();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5 pb-2">
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('common:settings')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
          {t('reports:desc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Visual Settings */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="border-b border-slate-100 dark:border-slate-850 pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-brand-600" />
              {t('common:settings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm block text-slate-800 dark:text-white">
                  {t('dashboard:status_ok')}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="h-9 w-9 p-0"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="border-b border-slate-100 dark:border-slate-850 pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Laptop className="h-5 w-5 text-emerald-600" />
              {t('common:admin')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Client Engine:</span>
              <span className="font-bold text-slate-800 dark:text-slate-205">Vite v7 + React v19</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Styling Core:</span>
              <span className="font-bold text-slate-800 dark:text-slate-205">Tailwind CSS v4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Components layout:</span>
              <span className="font-bold text-slate-800 dark:text-slate-205">Radix UI Primitives</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">Status:</span>
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('common:success')}
              </Badge>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

