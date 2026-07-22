import { LucideIcon, FileQuestion, HelpCircle } from "lucide-react";
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
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl shadow-xs max-w-lg mx-auto w-full text-right select-none",
        className
      )}
    >
      {/* Icon Frame */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-500 rounded-xl mb-4 transition-all duration-300">
        <Icon className="h-10 w-10 shrink-0" />
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
