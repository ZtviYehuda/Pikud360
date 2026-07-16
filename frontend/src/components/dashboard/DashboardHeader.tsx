import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GitFork, Calendar, RefreshCw, ChevronDown, ChevronUp, Users, ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { OrganizationUnit } from '../../types';
import { useCommanderWorkspace } from '../../features/commander/context/CommanderWorkspaceContext';
import { buildBreadcrumbs, findUnitName, findParentUnit, findUnitById, getUnitTypeLabel } from '../../features/commander/utils/organization';
import { SummaryData } from '../../services/analyticsService';

interface DashboardHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  summary: SummaryData | null;
  alertsCount: number;
}

export default function DashboardHeader({
  selectedDate,
  onDateChange,
  onRefresh,
  loading = false,
  summary,
  alertsCount
}: DashboardHeaderProps) {
  const { orgTree, selectedUnitId, selectOrganizationUnit } = useCommanderWorkspace();
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

  const currentUnitName = useMemo(() => {
    return findUnitName(orgTree, selectedUnitId) || t('common:app_name');
  }, [orgTree, selectedUnitId, t]);

  const breadcrumbs = useMemo(() => {
    return buildBreadcrumbs(orgTree, selectedUnitId);
  }, [orgTree, selectedUnitId]);

  const parentUnit = useMemo(() => {
    return findParentUnit(orgTree, selectedUnitId);
  }, [orgTree, selectedUnitId]);

  const selectedUnitNode = useMemo(() => {
    return findUnitById(orgTree, selectedUnitId);
  }, [orgTree, selectedUnitId]);

  const unitTypeLabel = useMemo(() => {
    return getUnitTypeLabel(selectedUnitNode, t);
  }, [selectedUnitNode, t]);

  // Recursive dropdown node renderer
  const renderTreeNodes = (nodes: OrganizationUnit[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id} className="space-y-1">
        <button
          type="button"
          onClick={() => {
            selectOrganizationUnit(node.id);
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
    <div className="flex flex-col gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
      
      {/* Identity & Operational Status */}
      <div className="space-y-2 text-right">

        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
          <span>{t('common:commander_dashboard')}</span>
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id}>
                <span>/</span>
                {isLast ? (
                  <span className="text-brand-650 dark:text-brand-400 font-bold select-none">
                    {crumb.name}
                  </span>
                ) : (
                  <span
                    onClick={() => selectOrganizationUnit(crumb.id)}
                    className="hover:text-brand-500 cursor-pointer transition-colors"
                  >
                    {crumb.name}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Organization name as primary heading */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 dark:bg-brand-400/10">
            <ShieldAlert className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {currentUnitName}
            </h1>
            <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
              {unitTypeLabel}
            </p>
          </div>
        </div>

        {/* Operational KPI chips — exactly 3 data points */}
        {summary && (
          <div className="flex flex-wrap gap-2 select-none">

            {/* Total Personnel */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
              <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {t('dashboard:total_strength')}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                {summary.total_personnel}
              </span>
            </div>

            {/* Available Personnel */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/10 border border-emerald-200/60 dark:border-emerald-900/30">
              <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                {t('dashboard:available')}
              </span>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {summary.available}
              </span>
            </div>

            {/* Active Alerts — 3-tier severity */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              alertsCount === 0
                ? 'bg-slate-50 border-slate-200/70 dark:bg-slate-900 dark:border-slate-800'
                : 'bg-rose-50/70 border-rose-200/60 dark:bg-rose-950/15 dark:border-rose-900/30'
            }`}>
              <span className={`h-2 w-2 rounded-full shrink-0 ${
                alertsCount === 0
                  ? 'bg-slate-300 dark:bg-slate-600'
                  : alertsCount >= 3
                    ? 'bg-rose-500 animate-pulse'
                    : 'bg-rose-500'
              }`} />
              <span className={`text-[10px] font-semibold ${
                alertsCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {t('dashboard:active_alerts_kpi')}
              </span>
              <span className={`text-xs font-bold ${
                alertsCount > 0 ? 'text-rose-800 dark:text-rose-300' : 'text-slate-700 dark:text-slate-300'
              }`}>
                {alertsCount}
              </span>
            </div>

          </div>
        )}
      </div>

      {/* Control Filters: stack vertically on mobile, horizontal on sm+ */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">

        {/* Org Tree Selector Dropdown */}
        <div className="relative flex items-center gap-2" ref={treeDropdownRef}>
          <label className="text-xs font-bold text-slate-455">{t('analytics:unit')}:</label>
          {parentUnit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => selectOrganizationUnit(parentUnit.id)}
              className="h-11 w-11 sm:h-8 sm:w-8 p-0 flex items-center justify-center shrink-0"
              title={t('buttons:back_to_parent')}
            >
              <ArrowRight className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsTreeDropdownOpen(!isTreeDropdownOpen)}
            className="h-11 sm:h-8 py-2 px-3 text-xs flex items-center gap-2 font-semibold shadow-2xs shrink-0"
          >
            <span>{currentUnitName}</span>
            {isTreeDropdownOpen ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
          </Button>

          {isTreeDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xl p-2 z-50 max-h-60 overflow-y-auto animate-fade-in">
              {orgTree.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-455">
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
          <label className="text-xs font-bold text-slate-455">{t('common:calendar')}:</label>
          <div className="relative flex-1 sm:flex-none">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="pl-8 pr-3 font-semibold cursor-pointer h-11 sm:h-8 w-full sm:w-36"
            />
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-455 pointer-events-none" />
          </div>
        </div>

        {/* Refresh */}
        <div className="flex items-center gap-2 sm:border-l border-slate-200/80 dark:border-slate-800 sm:pl-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-11 sm:h-8 w-11 sm:w-8 p-0 flex items-center justify-center shrink-0"
            title={t('buttons:refresh')}
          >
            <RefreshCw className={`h-4.5 w-4.5 sm:h-3.5 sm:w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

      </div>
    </div>
  );
}
