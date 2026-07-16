import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/table';
import { EmptyState } from '../ui/empty-state';
import { Badge } from '../ui/badge';
import { 
  GitFork, Users, LayoutList, ChevronRight, ShieldAlert, ArrowLeft, ArrowRight,
  UserCheck, AlertTriangle, Activity
} from 'lucide-react';
import { SummaryData, DistributionItem, UnitBreakdownItem } from '../../services/analyticsService';
import { useCommanderWorkspace } from '../../features/commander/context/CommanderWorkspaceContext';
import { findParentUnit } from '../../features/commander/utils/organization';

interface WorkforceOverviewProps {
  summary: SummaryData | null;
  distribution: DistributionItem[] | null;
  loading?: boolean;
  direction?: 'ltr' | 'rtl';
}

export default function WorkforceOverview({
  summary,
  direction = 'rtl'
}: WorkforceOverviewProps) {
  const { orgTree, selectedUnitId, selectOrganizationUnit } = useCommanderWorkspace();
  const { t } = useTranslation(['common', 'dashboard', 'analytics', 'buttons']);
  const navigate = useNavigate();
  const isRtl = direction === 'rtl';

  if (!summary) {
    return (
      <EmptyState
        title={t('common:no_data')}
        description={t('reports:no_reports')}
      />
    );
  }

  const parentUnit = useMemo(() => {
    return findParentUnit(orgTree, selectedUnitId);
  }, [orgTree, selectedUnitId]);

  const childUnits = summary.child_units || [];

  const getUnitStatusCount = (unit: UnitBreakdownItem, statusKey: string): number => {
    if (!unit.status_distribution) return 0;
    
    if (Array.isArray(unit.status_distribution)) {
      const item = unit.status_distribution.find((d: any) => d.status.toUpperCase() === statusKey.toUpperCase());
      return item ? item.count : 0;
    }
    
    const record = unit.status_distribution as Record<string, number>;
    return record[statusKey.toUpperCase()] || record[statusKey.toLowerCase()] || 0;
  };

  // Operational metrics for primary cards
  const total = summary.total_personnel || 0;
  const available = summary.available || 0;
  const unassigned = summary.unassigned || 0;
  
  const sick = (() => {
    if (Array.isArray(summary.status_distribution)) {
      return summary.status_distribution.find(d => d.status.toUpperCase() === 'SICK')?.count || 0;
    }
    const record = summary.status_distribution as unknown as Record<string, number>;
    return record?.SICK || record?.sick || 0;
  })();

  const availabilityRate = total > 0 ? Math.round((available / total) * 100) : 0;

  return (
    <Card className="border border-slate-200/60 dark:border-slate-800">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white select-none">
          {parentUnit && (
            <button
              onClick={() => selectOrganizationUnit(parentUnit.id)}
              className="p-1.5 rounded-lg border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 shrink-0 cursor-pointer"
              title={isRtl ? `חזרה ל-${parentUnit.name}` : `Back to ${parentUnit.name}`}
            >
              {isRtl ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
            </button>
          )}
          <Activity className="h-5 w-5 text-brand-600 dark:text-brand-400 animate-pulse" />
          <span>{t('dashboard:title')}</span>
        </CardTitle>
        <CardDescription>
          {t('dashboard:desc')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        
        {/* Section 1: Operational Readiness Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
            <LayoutList className="h-4 w-4" />
            <span>כשירות ומוכנות סד״כ</span>
          </h4>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Available personnel */}
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/20">
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider select-none">
                <span>כוח זמין</span>
                <UserCheck className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-2 select-none">
                <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300">{available}</p>
                <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-500">{availabilityRate}% זמינות</p>
              </div>
            </div>

            {/* Unassigned personnel */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              unassigned > 0 
                ? 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-150/70 dark:border-rose-900/30' 
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/80'
            }`}>
              <div className={`flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider select-none ${
                unassigned > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-450 dark:text-slate-500'
              }`}>
                <span>ללא שיבוץ</span>
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col mt-2 select-none">
                <p className={`text-sm font-bold leading-tight ${unassigned > 0 ? 'text-rose-800 dark:text-rose-400' : 'text-slate-850 dark:text-white'}`}>
                  {unassigned > 0 ? `${t('dashboard:state_unassigned_warning')} (${unassigned})` : t('dashboard:state_assigned_success')}
                </p>
                <p className={`text-[10px] font-semibold mt-0.5 ${unassigned > 0 ? 'text-rose-600 dark:text-rose-550' : 'text-slate-450 dark:text-slate-500'}`}>
                  {unassigned > 0 ? 'לטיפול מיידי' : 'מצב תקין'}
                </p>
              </div>
            </div>

            {/* Sick personnel */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80">
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider select-none">
                <span>חופשת מחלה</span>
                <Activity className="h-3.5 w-3.5 opacity-70" />
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-white mt-2 select-none">{sick}</p>
            </div>

            {/* Total personnel */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80">
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider select-none">
                <span>מצבת סד״כ</span>
                <Users className="h-3.5 w-3.5 opacity-70" />
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-white mt-2 select-none">{total}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Subordinate Child Units Operational List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
            <GitFork className="h-4 w-4" />
            <span>פירוט כשירות יחידות כפיפות</span>
          </h4>
          
          {childUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 text-center select-none">
              <ShieldAlert className="h-8 w-8 text-slate-350 dark:text-slate-600 mb-2" />
              <EmptyState 
                title={t('dashboard:no_subordinate_units')}
                description={t('dashboard:no_subordinate_units_desc')}
                className="max-w-md mx-0 text-right"
              />
            </div>
          ) : (
            <>
              {/* Desktop Table View (hidden on mobile) */}
              <div className="hidden md:block border border-slate-200/60 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-slate-900">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dashboard:unit_name')}</TableHead>
                      <TableHead>זמינות / כשירות</TableHead>
                      <TableHead>ללא שיבוץ</TableHead>
                      <TableHead>חולים</TableHead>
                      <TableHead>בחופשה</TableHead>
                      <TableHead>מצבת סד״כ</TableHead>
                      <TableHead className={isRtl ? 'text-left' : 'text-right'}>פעולה מבצעית</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {childUnits.map((unit) => {
                      const uTotal = unit.total_personnel || 0;
                      const uAvailable = getUnitStatusCount(unit, 'AVAILABLE');
                      const uSick = getUnitStatusCount(unit, 'SICK');
                      const uVacation = getUnitStatusCount(unit, 'VACATION') + getUnitStatusCount(unit, 'LEAVE');
                      const uUnassigned = unit.unassigned || 0;
                      const uRate = uTotal > 0 ? Math.round((uAvailable / uTotal) * 100) : 0;
                      
                      const isSelected = selectedUnitId === unit.unit_id;
                      
                      return (
                        <TableRow 
                          key={unit.unit_id}
                          className={`transition-colors group ${
                            isSelected
                              ? 'bg-brand-50/60 hover:bg-brand-100/60 dark:bg-brand-950/15 dark:hover:bg-brand-950/25'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <TableCell 
                            onClick={() => selectOrganizationUnit(unit.unit_id)}
                            className={`font-bold flex items-center justify-between gap-1.5 select-none cursor-pointer ${
                              isSelected ? 'text-brand-650 dark:text-brand-400' : 'text-slate-850 dark:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSelected && (
                                <span className="h-2 w-2 rounded-full bg-brand-600 dark:bg-brand-500 animate-pulse shrink-0" />
                              )}
                              <span>{unit.unit_name}</span>
                            </div>
                            <ChevronRight className={`h-3.5 w-3.5 transition-transform text-slate-400 dark:text-slate-500 shrink-0 group-hover:text-brand-600 dark:group-hover:text-brand-400 ${isRtl ? 'rotate-180' : ''}`} />
                          </TableCell>
                          
                          <TableCell className="select-none font-semibold">
                            <span className={uRate >= 80 ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'}>
                              {uRate}% ({uAvailable}/{uTotal})
                            </span>
                          </TableCell>
                          
                          <TableCell className="select-none font-semibold">
                            {uUnassigned > 0 ? (
                              <Badge variant="destructive" className="font-bold">
                                {uUnassigned} לטיפול
                              </Badge>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 font-normal">0</span>
                            )}
                          </TableCell>

                          <TableCell className="text-slate-600 dark:text-slate-350 font-medium select-none">{uSick}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-350 font-medium select-none">{uVacation}</TableCell>
                          <TableCell className="text-slate-650 dark:text-slate-300 font-bold select-none">{uTotal}</TableCell>
                          
                          <TableCell className={isRtl ? 'text-left' : 'text-right'}>
                            <div className={`flex ${isRtl ? 'justify-end' : 'justify-start'}`}>
                              {uUnassigned > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/workforce/scheduling`)}
                                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer min-h-[28px]"
                                >
                                  <span>{t('buttons:schedule_now')}</span>
                                  <ArrowLeft className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <Badge variant="success" className="text-[10px] font-bold select-none px-2 py-0.5">
                                  {t('buttons:assigned_success')}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards View (hidden on desktop) */}
              <div className="block md:hidden space-y-3">
                {childUnits.map((unit) => {
                  const uTotal = unit.total_personnel || 0;
                  const uAvailable = getUnitStatusCount(unit, 'AVAILABLE');
                  const uSick = getUnitStatusCount(unit, 'SICK');
                  const uVacation = getUnitStatusCount(unit, 'VACATION') + getUnitStatusCount(unit, 'LEAVE');
                  const uUnassigned = unit.unassigned || 0;
                  const uRate = uTotal > 0 ? Math.round((uAvailable / uTotal) * 100) : 0;
                  
                  const isSelected = selectedUnitId === unit.unit_id;

                  return (
                    <div
                      key={unit.unit_id}
                      className={`p-4 rounded-xl border transition-all ${
                        isSelected 
                          ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/10' 
                          : 'border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs'
                      }`}
                    >
                      {/* Card Header clickable area for selecting unit context */}
                      <div 
                        onClick={() => selectOrganizationUnit(unit.unit_id)}
                        className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 mb-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isSelected && (
                            <span className="h-2 w-2 rounded-full bg-brand-600 dark:bg-brand-500 animate-pulse shrink-0" />
                          )}
                          <span className={`font-bold text-xs truncate ${isSelected ? 'text-brand-650 dark:text-brand-400' : 'text-slate-800 dark:text-white'}`}>
                            {unit.unit_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            uRate >= 80 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                          }`}>
                            {uRate}% כשירות
                          </span>
                          <ChevronRight className={`h-3.5 w-3.5 text-slate-400 shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {/* Operational status details */}
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between select-none">
                        
                        {/* Core Stats row */}
                        <div className="grid grid-cols-4 gap-2 text-center flex-1">
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/50">
                            <span className="block text-[8px] font-bold text-slate-450 uppercase tracking-wider">זמינים</span>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{uAvailable}/{uTotal}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/50">
                            <span className="block text-[8px] font-bold text-slate-450 uppercase tracking-wider">ללא שיבוץ</span>
                            <span className={`text-[11px] font-bold ${uUnassigned > 0 ? 'text-rose-600 dark:text-rose-455' : 'text-slate-700 dark:text-slate-200'}`}>
                              {uUnassigned}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/50">
                            <span className="block text-[8px] font-bold text-slate-455 uppercase tracking-wider">חולים</span>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{uSick}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/50">
                            <span className="block text-[8px] font-bold text-slate-455 uppercase tracking-wider">חופשה</span>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{uVacation}</span>
                          </div>
                        </div>

                        {/* Operational Scheduling Shortcut or success badge */}
                        {uUnassigned > 0 ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/workforce/scheduling`)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-[0.97] transition-all cursor-pointer min-h-[44px] shrink-0"
                          >
                            <span>{t('buttons:schedule_now')}</span>
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <Badge variant="success" className="text-[10px] font-bold select-none px-2.5 py-1.5 shrink-0 self-center">
                            {t('buttons:assigned_success')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
