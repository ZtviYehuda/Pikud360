import React, { useState, useRef, useEffect } from 'react';
import { GitFork, Calendar, RefreshCw, ChevronDown, ChevronUp, Activity } from 'lucide-react';

interface DashboardHeaderProps {
  orgTree: any[];
  selectedUnitId: string;
  selectedDate: string;
  onUnitChange: (id: string) => void;
  onDateChange: (date: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  lastUpdated: string | null;
  isRTL?: boolean;
}

export default function DashboardHeader({
  orgTree,
  selectedUnitId,
  selectedDate,
  onUnitChange,
  onDateChange,
  onRefresh,
  loading = false,
  lastUpdated,
  isRTL = false
}: DashboardHeaderProps) {
  const [isTreeDropdownOpen, setIsTreeDropdownOpen] = useState(false);
  const treeDropdownRef = useRef<HTMLDivElement>(null);

  // Close tree dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (treeDropdownRef.current && !treeDropdownRef.current.contains(event.target as Node)) {
        setIsTreeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to find unit name recursively
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

  // Breadcrumbs track selection path
  const breadcrumbs = React.useMemo(() => {
    if (orgTree.length === 0) return [];
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
    return path;
  }, [selectedUnitId, orgTree]);

  // Recursive dropdown node renderer
  const renderTreeNodes = (nodes: any[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id} className="space-y-1">
        <button
          type="button"
          onClick={() => {
            onUnitChange(node.id);
            setIsTreeDropdownOpen(false);
          }}
          className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
            selectedUnitId === node.id 
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/20 dark:text-brand-400 font-bold' 
              : 'text-slate-700 dark:text-slate-300'
          }`}
          style={{
            paddingLeft: isRTL ? '12px' : `${depth * 16 + 12}px`,
            paddingRight: isRTL ? `${depth * 16 + 12}px` : '12px'
          }}
        >
          <GitFork className="h-3.5 w-3.5 opacity-60 text-slate-400 shrink-0" />
          <span className="truncate">{node.name}</span>
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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
      <div className={`space-y-1 text-${isRTL ? 'right' : 'left'}`}>
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
          <span>{isRTL ? 'לוח בקרה מפקד' : 'COMMANDER INTELLIGENCE'}</span>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <span>/</span>
              <span 
                onClick={() => onUnitChange(crumb.id)}
                className={`hover:text-brand-500 cursor-pointer transition-colors ${
                  idx === breadcrumbs.length - 1 ? 'text-brand-650 dark:text-brand-400 font-bold' : ''
                }`}
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
          <label className="text-xs font-bold text-slate-450">{isRTL ? 'יחידה:' : 'Unit:'}</label>
          <button
            type="button"
            onClick={() => setIsTreeDropdownOpen(!isTreeDropdownOpen)}
            className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-850 dark:bg-slate-950 text-slate-800 dark:text-white flex items-center gap-2 cursor-pointer font-semibold shadow-2xs hover:bg-slate-100/50"
          >
            <span>{currentUnitName}</span>
            {isTreeDropdownOpen ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
          </button>

          {isTreeDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xl p-2 z-50 max-h-60 overflow-y-auto animate-fade-in">
              {orgTree.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  {isRTL ? 'אין יחידות זמינות' : 'No units available'}
                </div>
              ) : (
                <div className="space-y-1">
                  {renderTreeNodes(orgTree)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-450">{isRTL ? 'תאריך:' : 'Date:'}</label>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-850 dark:bg-slate-950 text-slate-800 dark:text-white font-semibold cursor-pointer shadow-2xs"
            />
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 border-l border-slate-200/80 dark:border-slate-800 pl-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            title={isRTL ? 'רענן נתונים' : 'Refresh metrics'}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {lastUpdated && (
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
              {isRTL ? `עודכן לאחרונה: ${lastUpdated}` : `Updated: ${lastUpdated}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
