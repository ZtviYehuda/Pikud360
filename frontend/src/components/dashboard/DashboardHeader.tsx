import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GitFork, Calendar, RefreshCw, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface DashboardHeaderProps {
  orgTree: any[];
  selectedUnitId: string;
  selectedDate: string;
  onUnitChange: (id: string) => void;
  onDateChange: (date: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  lastUpdated: string | null;
}

export default function DashboardHeader({
  orgTree,
  selectedUnitId,
  selectedDate,
  onUnitChange,
  onDateChange,
  onRefresh,
  loading = false,
  lastUpdated
}: DashboardHeaderProps) {
  const [isTreeDropdownOpen, setIsTreeDropdownOpen] = useState(false);
  const treeDropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

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

  const currentUnitName = findUnitName(orgTree, selectedUnitId) || t('common:app_name');

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
            paddingLeft: '12px',
            paddingRight: `${depth * 16 + 12}px`
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
      <div className="space-y-1 text-right">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
          <span>{t('common:commander_dashboard')}</span>
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
          {t('analytics:title')}
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">
          {t('analytics:desc')}
        </p>
      </div>

      {/* Control Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Org Tree Selector Dropdown */}
        <div className="relative flex items-center gap-2" ref={treeDropdownRef}>
          <label className="text-xs font-bold text-slate-450">{t('analytics:unit')}:</label>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsTreeDropdownOpen(!isTreeDropdownOpen)}
            className="h-8 py-1 px-3 text-xs flex items-center gap-2 font-semibold shadow-2xs"
          >
            <span>{currentUnitName}</span>
            {isTreeDropdownOpen ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
          </Button>

          {isTreeDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xl p-2 z-50 max-h-60 overflow-y-auto animate-fade-in">
              {orgTree.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-450">
                  {t('common:no_data')}
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
          <label className="text-xs font-bold text-slate-450">{t('common:calendar')}:</label>
          <div className="relative">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="pl-8 pr-3 font-semibold cursor-pointer h-8 w-32"
            />
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 border-l border-slate-200/80 dark:border-slate-800 pl-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 w-8 p-0"
            title={t('buttons:refresh')}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {lastUpdated && (
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
              {t('dashboard:last_updated')}: {lastUpdated}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

