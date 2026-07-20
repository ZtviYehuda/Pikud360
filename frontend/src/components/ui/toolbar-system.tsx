import * as React from "react";
import { Search, Download, Upload, Plus, RefreshCw, Layers, SlidersHorizontal, Check, Trash } from "lucide-react";
import { cn } from "../../lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "./dropdown-menu";

// ==========================================
// EnterpriseToolbar Component Props
// ==========================================
export interface EnterpriseToolbarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  onCreateClick?: () => void;
  createLabel?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  
  // Density state
  density?: "compact" | "standard" | "relaxed";
  onDensityChange?: (density: "compact" | "standard" | "relaxed") => void;
  
  // Columns selector
  columns?: { id: string; label: string; visible: boolean }[];
  onColumnToggle?: (id: string) => void;
  
  // Bulk selection details
  selectionCount?: number;
  bulkActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
  }[];
  
  // Additional items
  children?: React.ReactNode;
}

export const EnterpriseToolbar: React.FC<EnterpriseToolbarProps> = ({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "חפש ברשומות...",
  onCreateClick,
  createLabel = "הוסף רשומה",
  onRefresh,
  onExport,
  onImport,
  density = "standard",
  onDensityChange,
  columns,
  onColumnToggle,
  selectionCount = 0,
  bulkActions,
  children,
}) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-4 text-right select-none shadow-xs">
      
      {/* 1. Main Row (Search & Common actions) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Search input field */}
        {onSearchChange && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-9 pl-3 pr-9 rounded-lg border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-950 text-slate-850 dark:text-white transition-all focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-550/60"
            />
          </div>
        )}

        {/* Action Trigger Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {children}

          {onImport && (
            <button
              onClick={onImport}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>יבוא</span>
            </button>
          )}

          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>יצוא</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer"
              title="רענן נתונים"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Density selector dropdown */}
          {onDensityChange && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer focus:outline-hidden">
                <Layers className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 text-right">
                <DropdownMenuItem onClick={() => onDensityChange("compact")} className="flex justify-between items-center cursor-pointer">
                  <span>צפוף</span>
                  {density === "compact" && <Check className="h-3.5 w-3.5 text-cyan-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDensityChange("standard")} className="flex justify-between items-center cursor-pointer">
                  <span>רגיל</span>
                  {density === "standard" && <Check className="h-3.5 w-3.5 text-cyan-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDensityChange("relaxed")} className="flex justify-between items-center cursor-pointer">
                  <span>מרווח</span>
                  {density === "relaxed" && <Check className="h-3.5 w-3.5 text-cyan-600" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Columns Visibility Selector */}
          {columns && onColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer focus:outline-hidden">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 text-right p-1.5 space-y-1">
                <span className="block px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">עמודות מוצגות</span>
                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />
                {columns.map((col) => (
                  <DropdownMenuItem
                    key={col.id}
                    onClick={() => onColumnToggle(col.id)}
                    className="flex justify-between items-center cursor-pointer text-xs"
                  >
                    <span>{col.label}</span>
                    {col.visible && <Check className="h-3.5 w-3.5 text-cyan-600" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {onCreateClick && (
            <button
              onClick={onCreateClick}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-cyan-600 hover:bg-cyan-550 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>{createLabel}</span>
            </button>
          )}

        </div>

      </div>

      {/* 2. Bulk Actions Overlay Banner */}
      {selectionCount > 0 && bulkActions && bulkActions.length > 0 && (
        <div className="w-full bg-cyan-600/5 dark:bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              סומנו {selectionCount} פריטים
            </span>
          </div>
          <div className="flex items-center gap-2">
            {bulkActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className={cn(
                  "flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-bold cursor-pointer transition-all",
                  action.danger
                    ? "bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
                )}
              >
                {action.icon ? action.icon : action.danger ? <Trash className="h-3.5 w-3.5" /> : null}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
EnterpriseToolbar.displayName = "EnterpriseToolbar";
