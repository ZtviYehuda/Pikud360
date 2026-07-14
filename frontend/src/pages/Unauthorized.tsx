import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Home } from 'lucide-react';
import { buttonVariants } from '../components/ui/button';
import { Card } from '../components/ui/card';

export default function Unauthorized() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <Card className="w-full max-w-md text-center space-y-6 p-8 shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-105 text-red-650 dark:bg-red-950/30 dark:text-red-400">
          <ShieldAlert className="h-10 w-10" />
        </div>
        
        <h2 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
          {t('common:access_denied')}
        </h2>
        
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {t('common:access_denied_desc')}
        </p>

        <div className="pt-4 flex justify-center">
          <Link to="/dashboard" className={buttonVariants({ variant: "default" })}>
            <Home className="h-4 w-4" />
            {t('common:dashboard')}
          </Link>
        </div>
      </Card>
    </div>
  );
}

