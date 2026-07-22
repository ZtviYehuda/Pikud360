import { type LucideIcon, FileQuestion, HelpCircle } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  
  // Primary Action
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  
  // Secondary Action
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  
  // Help Link
  helpLinkLabel?: string;
  helpLinkHref?: string;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  helpLinkLabel,
  helpLinkHref,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 rounded-xl select-none mx-auto w-full",
        compact ? "p-5 max-w-sm my-4" : "p-8 md:p-12 shadow-xs max-w-lg",
        className
      )}
    >
      {/* Icon Frame */}
      <div className={cn(
        "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 rounded-xl transition-all duration-300",
        compact ? "p-2.5 mb-2.5" : "p-4 mb-4"
      )}>
        <Icon className={cn("shrink-0", compact ? "h-6 w-6" : "h-10 w-10")} />
      </div>

      {/* Text Info */}
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 font-heading leading-snug">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-sm mb-6 font-medium">
        {description}
      </p>

      {/* Actions Row */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        {primaryActionLabel && onPrimaryAction && (
          <Button
            type="button"
            onClick={onPrimaryAction}
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-550 text-white font-bold h-8 text-xs px-4 rounded-md transition-all duration-200 shadow-xs cursor-pointer"
          >
            {primaryActionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            type="button"
            onClick={onSecondaryAction}
            variant="outline"
            size="sm"
            className="border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold h-8 text-xs px-4 rounded-md transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
          >
            {secondaryActionLabel}
          </Button>
        )}
      </div>

      {/* Help Link Block */}
      {helpLinkLabel && helpLinkHref && (
        <a
          href={helpLinkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 mt-5 text-[10px] font-bold text-cyan-600 hover:text-cyan-550 transition-colors uppercase tracking-wider"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>{helpLinkLabel}</span>
        </a>
      )}
    </div>
  );
}
