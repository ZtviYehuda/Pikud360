import { useTranslation } from 'react-i18next';
import { Search, UserPlus, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

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
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('employees:title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            {t('employees:desc')}
          </p>
        </div>
        
        <Button className="w-fit">
          <UserPlus className="h-4.5 w-4.5" />
          {t('employees:add_employee')}
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex gap-3 bg-white p-4 rounded-xl border border-slate-205/60 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <Input
            type="text"
            className="pl-10"
            placeholder={t('employees:search_placeholder')}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">{t('buttons:filter')}</span>
        </Button>
      </div>

      {/* Employee List Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {mockEmployees.map((emp) => (
          <Card key={emp.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-full bg-brand-105 dark:bg-brand-950/40 text-brand-650 dark:text-brand-405 flex items-center justify-center font-bold font-heading text-lg">
                {emp.name.split(' ').map(n => n[0]).join('')}
              </div>
              <Badge variant={emp.active ? 'success' : 'secondary'}>
                {emp.active ? t('common:success') : t('common:error')}
              </Badge>
            </div>
            
            <div className="mt-4">
              <h4 className="font-heading text-base font-bold text-slate-800 dark:text-white">{emp.name}</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{emp.role}</p>
              <p className="text-xs text-slate-555 mt-2 font-mono">{emp.dept}</p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-105 dark:border-slate-850/60 flex items-center justify-between text-2xs text-slate-400 font-medium">
              <span>{emp.email}</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

