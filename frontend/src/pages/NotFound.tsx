import { Link } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';

export default function NotFound() {
  const { direction } = useUIStore();
  const isRTL = direction === 'rtl';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md text-center space-y-6 rounded-2xl border border-slate-200/60 bg-white p-8 shadow-xl dark:border-slate-800/80 dark:bg-slate-900 glassmorphism">
        
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <AlertCircle className="h-10 w-10" />
        </div>
        
        <h2 className="font-heading text-4xl font-extrabold text-slate-900 dark:text-white">
          404
        </h2>
        
        <p className="font-heading text-xl font-semibold text-slate-800 dark:text-slate-200">
          {isRTL ? 'הדף לא נמצא' : 'Page Not Found'}
        </p>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isRTL 
            ? 'הכתובת שחיפשת אינה קיימת או שהועברה למיקום אחר.' 
            : 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.'}
        </p>

        <div className="pt-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
          >
            {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            {isRTL ? 'חזרה ללוח הבקרה' : 'Back to Dashboard'}
          </Link>
        </div>
      </div>
    </div>
  );
}
