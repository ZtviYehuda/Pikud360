import * as React from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ExportButtonProps {
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  onClick?: () => void;
  loading?: boolean;
  className?: string;
  label?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExportCSV,
  onExportExcel,
  onExportPDF,
  onClick,
  loading = false,
  className,
  label = "ייצוא",
}) => {
  if (onClick && !onExportCSV && !onExportExcel && !onExportPDF) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        title={label}
        className={cn(
          "h-9 px-3 rounded-xl bg-card hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground border border-border/50 hover:border-primary/40 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shrink-0 shadow-2xs group cursor-pointer disabled:opacity-50",
          className
        )}
      >
        <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="hidden sm:inline">{label}</span>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={loading}
          className={cn(
            "h-9 px-3 rounded-xl bg-card hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground border border-border/50 hover:border-primary/40 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shrink-0 shadow-2xs group cursor-pointer disabled:opacity-50",
            className
          )}
        >
          <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="hidden sm:inline">{label}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground/70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent dir="rtl" align="end" className="rounded-xl border border-border/60 shadow-lg">
        {onExportCSV && (
          <DropdownMenuItem onClick={onExportCSV} className="text-xs font-bold gap-2 cursor-pointer">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>ייצוא בקובץ CSV</span>
          </DropdownMenuItem>
        )}
        {onExportExcel && (
          <DropdownMenuItem onClick={onExportExcel} className="text-xs font-bold gap-2 cursor-pointer">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>ייצוא בקובץ Excel</span>
          </DropdownMenuItem>
        )}
        {onExportPDF && (
          <DropdownMenuItem onClick={onExportPDF} className="text-xs font-bold gap-2 cursor-pointer">
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span>ייצוא בדוח PDF</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
ExportButton.displayName = "ExportButton";
