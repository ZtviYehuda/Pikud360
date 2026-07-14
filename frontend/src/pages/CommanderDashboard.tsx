import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { schedulingService } from '../services/schedulingService';
import { 
  Users, Calendar, AlertTriangle, ChevronDown, ChevronUp, GitFork, 
  TrendingUp, Activity, CheckCircle, Clock, AlertOctagon, Eye, RefreshCw
} from 'lucide-react';
import Unauthorized from './Unauthorized';

export default function CommanderDashboard() {
  const { direction } = useUIStore();
  const { hasPermission } = useAuthStore();
  const isRTL = direction === 'rtl';

  if (!hasPermission('dashboard.view')) {
    return <Unauthorized />;
  }

  // Persist selected organization unit
  const [selectedUnitId, setSelectedUnitId] = useState(() => {
    return localStorage.getItem('pikud360_dashboard_unit_id') || 'unit-uuid-555';
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    return localStorage.getItem('pikud360_dashboard_date') || new Date().toISOString().split('T')[0];
  });

  const [range, setRange] = useState<'day' | 'week' | 'month'>(() => {
    return (localStorage.getItem('pikud360_dashboard_range') as any) || 'day';
  });

  const [orgTree, setOrgTree] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selector dropdown state
  const [isTreeDropdownOpen, setIsTreeDropdownOpen] = useState(false);
  const treeDropdownRef = useRef<HTMLDivElement>(null);

  // Navigation history/breadcrumbs
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);

  // Persist unit selection and dates
  useEffect(() => {
    localStorage.setItem('pikud360_dashboard_unit_id', selectedUnitId);
  }, [selectedUnitId]);

  useEffect(() => {
    localStorage.setItem('pikud360_dashboard_date', selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    localStorage.setItem('pikud360_dashboard_range', range);
  }, [range]);

  // Load tree and summary data
  useEffect(() => {
    loadTree();
  }, []);

  useEffect(() => {
    loadDashboardSummary();
  }, [selectedUnitId, selectedDate, range]);

  // Handle closing tree dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (treeDropdownRef.current && !treeDropdownRef.current.contains(event.target as Node)) {
        setIsTreeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadTree = async () => {
    try {
      const treeData = await schedulingService.getOrganizationTree();
      setOrgTree(treeData);
    } catch (err) {
      setOrgTree([
        {
          id: 'unit-uuid-555',
          name: isRTL ? 'מפקדת חטיבה' : 'Brigade HQ',
          code: 'BRIG_HQ',
          children: [
            { id: 'unit-uuid-666', name: isRTL ? 'פלוגה א' : 'Company A', code: 'CO_A', children: [] },
            { id: 'unit-uuid-777', name: isRTL ? 'פלוגה ב' : 'Company B', code: 'CO_B', children: [] }
          ]
        }
      ]);
    }
  };

  const loadDashboardSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await schedulingService.getCommanderDashboardSummary(selectedUnitId, selectedDate, range);
      setSummary(data);
    } catch (err: any) {
      setError(isRTL ? 'שגיאה בטעינת נתוני המערכת' : 'Error loading dashboard metrics');
      // Fallback details
      setSummary({
        total_personnel: 20,
        assigned: 15,
        unassigned: 5,
        availability_percentage: 75.0,
        sick_percentage: 10.0,
        training_percentage: 5.0,
        mission_percentage: 10.0,
        shortage_index: 25.0,
        status_distribution: {
          AVAILABLE: 15,
          SICK: 2,
          TRAINING: 1,
          MISSION: 2
        },
        child_units: [
          { unit_id: 'unit-uuid-666', unit_name: isRTL ? 'פלוגה א' : 'Company A', total_personnel: 12, assigned: 10, unassigned: 2, status_distribution: { AVAILABLE: 10, SICK: 1, TRAINING: 1 } },
          { unit_id: 'unit-uuid-777', unit_name: isRTL ? 'פלוגה ב' : 'Company B', total_personnel: 8, assigned: 5, unassigned: 3, status_distribution: { AVAILABLE: 5, SICK: 1, MISSION: 2 } }
        ],
        alerts: [
          { id: 'alert-1', alert_type: 'SICK_THRESHOLD_EXCEEDED', severity: 'WARNING', message: isRTL ? 'אחוז חולים גבוה ביחידה (10%)' : 'Sickness rate exceeds normal threshold (10%)', status: 'ACTIVE', created_at: new Date().toISOString() }
        ],
        transfers_count: 2
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to find name of current active unit in the tree recursively
  const findUnitName = (nodes: any[], id: string): string | null => {
    for (const node of nodes) {
      if (node.id === id) return node.name;
      if (node.children) {
        const found = findUnitName(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const currentUnitName = findUnitName(orgTree, selectedUnitId) || (isRTL ? 'מפקדת חטיבה' : 'Brigade HQ');

  // Breadcrumbs track selection
  useEffect(() => {
    if (orgTree.length > 0) {
      const path: { id: string; name: string }[] = [];
      const buildPath = (nodes: any[], targetId: string): boolean => {
        for (const n of nodes) {
          if (n.id === targetId) {
            path.push({ id: n.id, name: n.name });
            return true;
          }
          if (n.children && buildPath(n.children, targetId)) {
            path.unshift({ id: n.id, name: n.name });
            return true;
          }
        }
        return false;
      };
      buildPath(orgTree, selectedUnitId);
      setBreadcrumbs(path);
    }
  }, [selectedUnitId, orgTree]);

  // Recursive tree node renderer inside custom dropdown selector
  const renderTreeNodes = (nodes: any[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id} className="space-y-1 text-right">
        <button
          type="button"
          onClick={() => {
            setSelectedUnitId(node.id);
            setIsTreeDropdownOpen(false);
          }}
          className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
            selectedUnitId === node.id 
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/20 dark:text-brand-400 font-bold' 
              : 'text-slate-700 dark:text-slate-350'
          }`}
          style={{ paddingLeft: isRTL ? '12px' : `${depth * 16 + 12}px`, paddingRight: isRTL ? `${depth * 16 + 12}px` : '12px' }}
        >
          <GitFork className="h-3.5 w-3.5 opacity-60 text-slate-400" />
          <span>{node.name}</span>
        </button>
        {node.children && node.children.length > 0 && (
          <div className="space-y-1">
            {renderTreeNodes(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* 1. Header with Breadcrumbs and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
        <div className="space-y-1.5 text-right">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-2xs text-slate-400 font-semibold tracking-wider uppercase">
            <span>{isRTL ? 'מודיעין תכנון' : 'PLANNING INTELLIGENCE'}</span>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                <span>/</span>
                <span 
                  onClick={() => setSelectedUnitId(crumb.id)}
                  className={`hover:text-brand-500 cursor-pointer transition-colors ${idx === breadcrumbs.length - 1 ? 'text-brand-550 dark:text-brand-400 font-bold' : ''}`}
                >
                  {crumb.name}
                </span>
              </React.Fragment>
            ))}
          </div>

          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-brand-555 animate-pulse" />
            {isRTL ? 'לוח בקרה מודיעיני לכוח אדם' : 'Workforce Intelligence Dashboard'}
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            {isRTL ? 'תמונה מבצעית של רמות הכשירות, שיעורי התחלואה ומדדי המצבה ביחידות.' : 'Operational picture of workforce readiness, sickness rates, and manpower availability.'}
          </p>
        </div>

        {/* Control Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Org Tree Selector Dropdown */}
          <div className="relative flex items-center gap-2" ref={treeDropdownRef}>
            <label className="text-xs font-bold text-slate-455">{isRTL ? 'יחידה:' : 'Unit:'}</label>
            <button
              type="button"
              onClick={() => setIsTreeDropdownOpen(!isTreeDropdownOpen)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-850 dark:bg-slate-950 text-slate-800 dark:text-white flex items-center gap-2 cursor-pointer font-semibold shadow-sm hover:bg-slate-100/50"
            >
              <span>{currentUnitName}</span>
              {isTreeDropdownOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {isTreeDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-slate-250 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xl p-2 z-55 max-h-60 overflow-y-auto animate-fade-in">
                {orgTree.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    {isRTL ? 'אין יחידות זמינות' : 'No units available'}
                  </div>
                ) : (
                  renderTreeNodes(orgTree)
                )}
              </div>
            )}
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-850 dark:bg-slate-950 font-mono text-slate-800 dark:text-white font-semibold"
            />
          </div>

          {/* Range Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200/50 dark:border-slate-850">
            {(['day', 'week', 'month'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`py-1 px-3 text-2xs font-bold rounded-md transition-all cursor-pointer ${
                  range === r
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {r === 'day' ? (isRTL ? 'יומי' : 'Daily') : r === 'week' ? (isRTL ? 'שבועי' : 'Weekly') : (isRTL ? 'חודשי' : 'Monthly')}
              </button>
            ))}
          </div>

          {/* Manual Refresh */}
          <button
            onClick={loadDashboardSummary}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            title={isRTL ? 'רענן נתונים' : 'Refresh Metrics'}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200/40 bg-red-50/50 dark:border-red-950/20 dark:bg-red-950/10 p-4 text-xs font-semibold text-red-650 dark:text-red-400 flex items-center gap-2">
          <AlertOctagon className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Top-level Alert Banners */}
      {summary && summary.alerts && summary.alerts.length > 0 && (
        <div className="space-y-2">
          {summary.alerts.map((alert: any) => (
            <div
              key={alert.id}
              className={`rounded-xl border p-4 text-xs flex items-start gap-3 shadow-sm animate-scale-up ${
                alert.severity === 'CRITICAL'
                  ? 'bg-red-50/40 border-red-250 dark:bg-red-950/10 dark:border-red-900 text-red-750 dark:text-red-400'
                  : 'bg-amber-50/40 border-amber-250 dark:bg-amber-950/10 dark:border-amber-900 text-amber-750 dark:text-amber-400'
              }`}
            >
              <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${alert.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`} />
              <div className="flex-1 space-y-1 text-right">
                <div className="flex items-center gap-2">
                  <span className="font-bold uppercase tracking-wider text-2xs">
                    {alert.severity === 'CRITICAL' ? (isRTL ? 'חריגה קריטית' : 'CRITICAL BREACH') : (isRTL ? 'התראת קשב' : 'WARNING')}
                  </span>
                  <span className="text-2xs opacity-60">•</span>
                  <span className="text-2xs opacity-60">
                    {new Date(alert.created_at || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 leading-normal">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Operational KPIs and Gauge grid */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Dashboard Left Side: Metric Cards (Span 3) */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Total Personnel */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 glassmorphism relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-brand-500/5 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'סה"כ כוח אדם' : 'Total Personnel'}</span>
                <Users className="h-5 w-5 text-brand-655" />
              </div>
              <h4 className="font-heading text-3xl font-extrabold mt-3 text-slate-800 dark:text-white">{summary.total_personnel}</h4>
              <p className="text-3xs text-slate-450 mt-1">{isRTL ? 'כולל יחידות משנה בכפופות' : 'Includes recursive child units'}</p>
            </div>

            {/* Assigned */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 glassmorphism relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'משובץ ממוצע' : 'Daily Assigned Average'}</span>
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <h4 className="font-heading text-3xl font-extrabold mt-3 text-slate-800 dark:text-white">{summary.assigned}</h4>
              <p className="text-3xs text-emerald-600 dark:text-emerald-450 mt-1 font-semibold">
                {roundToDecimal(summary.assigned / (summary.total_personnel || 1) * 100)}% {isRTL ? 'שיבוץ ממוצע' : 'average rate'}
              </p>
            </div>

            {/* Unassigned */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 glassmorphism relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'לא משובץ ממוצע' : 'Daily Unassigned Average'}</span>
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <h4 className="font-heading text-3xl font-extrabold mt-3 text-slate-800 dark:text-white">{summary.unassigned}</h4>
              <p className="text-3xs text-slate-450 mt-1">{isRTL ? 'איזון תכנון נדרש' : 'Requires scheduling attention'}</p>
            </div>

            {/* Availability Percentage */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 glassmorphism relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'שיעור זמינות' : 'Availability Rate'}</span>
                <Activity className="h-5 w-5 text-indigo-500" />
              </div>
              <h4 className="font-heading text-3xl font-extrabold mt-3 text-slate-800 dark:text-white">{summary.availability_percentage}%</h4>
              <p className="text-3xs text-slate-450 mt-1">{isRTL ? 'שיעור זמינות לפעילות מיידית' : 'Ready for immediate deployment'}</p>
            </div>

            {/* Sick Percentage */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 glassmorphism relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'שיעור תחלואה' : 'Sickness Rate'}</span>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <h4 className="font-heading text-3xl font-extrabold mt-3 text-slate-800 dark:text-white">{summary.sick_percentage}%</h4>
              <p className="text-3xs text-slate-450 mt-1">{isRTL ? 'חולים מתוך סה"כ המצבה' : 'Sick personnel out of total'}</p>
            </div>

            {/* Training / Mission / Pending transfers */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 glassmorphism relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'אימונים ומשימות' : 'Training & Mission'}</span>
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <h4 className="font-heading text-2xl font-bold mt-3 text-slate-850 dark:text-white">
                {summary.training_percentage}% / {summary.mission_percentage}%
              </h4>
              <p className="text-3xs text-slate-450 mt-1">
                {isRTL ? `בקשות העברה ממתינות: ${summary.transfers_count}` : `Pending Transfer Requests: ${summary.transfers_count}`}
              </p>
            </div>
          </div>

          {/* Shortage Index Gauge (Span 1) */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 glassmorphism flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              {isRTL ? 'מדד מחסור בכוח אדם' : 'Manpower Shortage Index'}
            </span>

            {/* Gauge Graphic */}
            <div className="relative h-32 w-32 flex items-center justify-center">
              <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                {/* Background Ring */}
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  strokeWidth="8"
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800"
                  fill="transparent"
                />
                {/* Foreground Progress Dial */}
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  strokeWidth="9"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - (summary.shortage_index || 0) / 100)}`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  className={
                    summary.shortage_index > 40
                      ? 'text-red-500'
                      : summary.shortage_index > 20
                      ? 'text-amber-500'
                      : 'text-brand-555'
                  }
                  fill="transparent"
                />
              </svg>

              <div className="text-center space-y-0.5 z-10">
                <span className="font-heading text-3xl font-extrabold text-slate-900 dark:text-white">
                  {summary.shortage_index}%
                </span>
                <p className="text-4xs text-slate-400 font-bold uppercase tracking-widest">{isRTL ? 'מחסור' : 'SHORTAGE'}</p>
              </div>
            </div>

            <p className="text-3xs text-slate-455 mt-4 max-w-[200px] leading-relaxed">
              {isRTL 
                ? 'מחושב כמכפיל המצבות הבלתי-זמינות והחולים מסה"כ המצבה.' 
                : 'Proportion of workforce unavailable for immediate combat tasking.'}
            </p>
          </div>
        </div>
      )}

      {/* 4. Child Units aggregates breakdown table */}
      {summary && summary.child_units && (
        <div className="rounded-xl bg-white border border-slate-200/80 shadow-sm dark:bg-slate-900 dark:border-slate-800/80 overflow-hidden">
          <div className="py-4 px-5 border-b border-slate-150 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
            <div className="text-right">
              <h3 className="font-heading text-sm font-bold text-slate-800 dark:text-white">
                {isRTL ? 'פירוט יחידות משנה כפופות' : 'Child Units Manpower Breakdown'}
              </h3>
              <p className="text-3xs text-slate-450 mt-0.5">
                {isRTL ? 'לחץ על שורת יחידה לביצוע קידוח מטה (Drill Down) לנתוניה.' : 'Click on a row to drill down into the child unit operational view.'}
              </p>
            </div>
            <span className="text-2xs font-bold bg-slate-200/60 dark:bg-slate-800 py-1 px-2.5 rounded text-slate-700 dark:text-slate-350">
              {isRTL ? 'סה"כ יחידות כפופות: ' : 'Direct Children: '} {summary.child_units.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 text-3xs font-extrabold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-5 text-right">{isRTL ? 'שם יחידה' : 'Unit Name'}</th>
                  <th className="py-3 px-4 text-center">{isRTL ? 'סה"כ כוח אדם' : 'Total Strength'}</th>
                  <th className="py-3 px-4 text-center">{isRTL ? 'משובץ ממוצע' : 'Daily Assigned'}</th>
                  <th className="py-3 px-4 text-center">{isRTL ? 'לא משובץ ממוצע' : 'Daily Unassigned'}</th>
                  <th className="py-3 px-4 text-center">{isRTL ? 'זמינות ממוצעת' : 'Available Rate'}</th>
                  <th className="py-3 px-5 text-right">{isRTL ? 'פעולות' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {summary.child_units.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-455 italic">
                      {isRTL ? 'אין יחידות כפופות ישירות ליחידה הנוכחית' : 'No direct child units exist for the current selection.'}
                    </td>
                  </tr>
                ) : (
                  summary.child_units.map((child: any) => {
                    const availRate = roundToDecimal((child.status_distribution?.AVAILABLE || 0) / (child.total_personnel || 1) * 100);
                    return (
                      <tr 
                        key={child.unit_id}
                        onClick={() => setSelectedUnitId(child.unit_id)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group text-xs text-slate-700 dark:text-slate-330 font-semibold"
                      >
                        <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white flex items-center gap-2 text-right">
                          <GitFork className="h-4 w-4 opacity-50 text-slate-400" />
                          {child.unit_name}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-900 dark:text-white font-mono font-bold">
                          {child.total_personnel}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-emerald-600 dark:text-emerald-450">
                          {child.assigned}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-amber-600 dark:text-amber-450">
                          {child.unassigned}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-mono font-bold ${
                            availRate >= 70
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450'
                              : availRate >= 50
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450'
                              : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-450'
                          }`}>
                            {availRate}%
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUnitId(child.unit_id);
                            }}
                            className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded bg-brand-50 hover:bg-brand-100 text-brand-650 hover:text-brand-800 dark:bg-brand-950/20 dark:text-brand-400 text-2xs font-bold transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                          >
                            <Eye className="h-3 w-3" />
                            {isRTL ? 'חקור' : 'Explore'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function roundToDecimal(num: number): number {
  return Math.round(num * 10) / 10;
}
