import { useTranslation } from 'react-i18next';
import { Search, UserPlus, SlidersHorizontal, ShieldCheck } from 'lucide-react';

export default function Employees() {
  const { t } = useTranslation();

  const mockEmployees = [
    { id: '1', name: 'Alice Smith', role: 'WFM Specialist', dept: 'HR & Operations', email: 'alice@pikud360.com', active: true },
    { id: '2', name: 'Bob Johnson', role: 'Security Analyst', dept: 'Information Security', email: 'bob@pikud360.com', active: true },
    { id: '3', name: 'Charlie Green', role: 'Shift Supervisor', dept: 'Logistics', email: 'charlie@pikud360.com', active: false },
    { id: '4', name: 'Dana Levi', role: 'HR Manager', dept: 'HR & Operations', email: 'dana@pikud360.com', active: true },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
            {t('employees:title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {t('employees:desc')}
          </p>
        </div>
        
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 w-fit cursor-pointer">
          <UserPlus className="h-4.5 w-4.5" />
          {t('employees:add_employee')}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex gap-3 bg-white p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 shadow-sm glassmorphism">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
            placeholder={t('employees:search_placeholder')}
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-650 hover:bg-slate-55 dark:border-slate-750 dark:bg-slate-900 dark:hover:bg-slate-800 cursor-pointer">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">{t('buttons:filter')}</span>
        </button>
      </div>

      {/* Employee List Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {mockEmployees.map((emp) => (
          <div key={emp.id} className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 glassmorphism flex flex-col justify-between card-hover">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-650 dark:text-brand-405 flex items-center justify-center font-bold font-heading text-lg">
                {emp.name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${
                emp.active 
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {emp.active ? t('common:success') : t('common:error')}
              </span>
            </div>
            
            <div className="mt-4">
              <h4 className="font-heading text-base font-bold text-slate-800 dark:text-white">{emp.name}</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{emp.role}</p>
              <p className="text-xs text-slate-555 mt-2 font-mono">{emp.dept}</p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850/60 flex items-center justify-between text-2xs text-slate-400">
              <span>{emp.email}</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
