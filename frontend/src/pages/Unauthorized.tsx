import { Link } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { ShieldAlert, Home } from 'lucide-react';

export default function Unauthorized() {
  const { direction } = useUIStore();
  const isRTL = direction === 'rtl';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md text-center space-y-6 rounded-2xl border border-slate-200/60 bg-white p-8 shadow-xl dark:border-slate-800/80 dark:bg-slate-900 glassmorphism">
        
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-650 dark:bg-red-950/30 dark:text-red-400">
          <ShieldAlert className="h-10 w-10" />
        </div>
        
        <h2 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
          {isRTL ? 'אין הרשאה מתאימה' : 'Access Denied'}
        </h2>
        
        <p className="text-slate-500 dark:text-slate-400">
          {isRTL 
            ? 'אין לך את ההרשאות הדרושות לצפייה בדף זה. פנה למנהל המערכת לקבלת גישה.' 
            : 'You do not have the required permissions to view this page. Please contact your administrator.'}
        </p>

        <div className="pt-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
          >
            <Home className="h-4 w-4" />
            {isRTL ? 'חזרה ללוח הבקרה' : 'Back to Dashboard'}
          </Link>
        </div>
      </div>
    </div>
  );
}
