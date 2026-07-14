import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/card';
import { buttonVariants } from '../components/ui/button';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <Card className="w-full max-w-md text-center space-y-6 p-8 shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-105 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <AlertCircle className="h-10 w-10" />
        </div>
        
        <h2 className="font-heading text-4xl font-extrabold text-slate-900 dark:text-white">
          404
        </h2>
        
        <p className="font-heading text-xl font-semibold text-slate-800 dark:text-slate-205">
          {t('common:page_not_found')}
        </p>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('common:page_not_found')}
        </p>

        <div className="pt-4 flex justify-center">
          <Link
            to="/dashboard"
            className={buttonVariants({ variant: 'default' })}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common:go_home')}
          </Link>
        </div>
      </Card>
    </div>
  );
}

