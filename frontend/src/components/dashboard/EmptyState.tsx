import { LucideIcon, FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm max-w-lg mx-auto">
      <div className="p-4 bg-slate-50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-550 rounded-2xl mb-4">
        <Icon className="h-10 w-10" />
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-450 dark:text-slate-400 text-xs leading-relaxed max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs py-2 px-4 shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
