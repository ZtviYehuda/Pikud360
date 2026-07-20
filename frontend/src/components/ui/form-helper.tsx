import * as React from "react";
import { cn } from "../../lib/utils";
import { Info, AlertCircle, Check, X } from "lucide-react";

// ==========================================
// 1. EnterpriseInput Component
// ==========================================
export interface EnterpriseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const EnterpriseInput = React.forwardRef<HTMLInputElement, EnterpriseInputProps>(
  ({ className, label, error, helperText, type = "text", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full text-right select-none">
        {label && (
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={type}
            className={cn(
              "w-full h-9 px-3 rounded-lg border text-xs bg-white dark:bg-slate-900 text-slate-850 dark:text-white transition-all focus:outline-hidden focus:ring-2",
              error
                ? "border-red-500/50 focus:ring-red-500/20"
                : "border-slate-200 dark:border-slate-800 focus:ring-cyan-500/20 focus:border-cyan-550/60"
            )}
            {...props}
          />
        </div>
        {error ? (
          <span className="flex items-center gap-1 text-[9px] font-bold text-red-500 mt-0.5">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </span>
        ) : helperText ? (
          <span className="flex items-center gap-1 text-[9px] text-slate-400 font-medium mt-0.5">
            <Info className="h-3 w-3 shrink-0" />
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);
EnterpriseInput.displayName = "EnterpriseInput";

// ==========================================
// 2. EnterpriseSelect Component
// ==========================================
export interface EnterpriseSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const EnterpriseSelect = React.forwardRef<HTMLSelectElement, EnterpriseSelectProps>(
  ({ className, label, error, helperText, options, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full text-right select-none">
        {label && (
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full h-9 px-3 rounded-lg border text-xs bg-white dark:bg-slate-900 text-slate-850 dark:text-white transition-all focus:outline-hidden focus:ring-2",
            error
              ? "border-red-500/50 focus:ring-red-500/20"
              : "border-slate-200 dark:border-slate-800 focus:ring-cyan-500/20 focus:border-cyan-550/60"
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <span className="flex items-center gap-1 text-[9px] font-bold text-red-500 mt-0.5">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </span>
        ) : helperText ? (
          <span className="flex items-center gap-1 text-[9px] text-slate-400 font-medium mt-0.5">
            <Info className="h-3 w-3 shrink-0" />
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);
EnterpriseSelect.displayName = "EnterpriseSelect";

// ==========================================
// 3. FormStepper Component
// ==========================================
export interface FormStepperProps {
  steps: string[];
  currentStep: number;
}

export const FormStepper: React.FC<FormStepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-between w-full select-none text-right py-4 border-b border-slate-100 dark:border-slate-850/60 mb-6">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;

        return (
          <div key={idx} className="flex items-center gap-2 flex-1 last:flex-initial">
            <div
              className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                isCompleted
                  ? "bg-cyan-600 text-white"
                  : isActive
                  ? "bg-cyan-500/10 text-cyan-650 dark:text-cyan-400 border border-cyan-500/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              )}
            >
              {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
            </div>
            <span
              className={cn(
                "text-xs font-bold hidden sm:inline",
                isActive ? "text-slate-850 dark:text-white" : "text-slate-400"
              )}
            >
              {step}
            </span>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-slate-100 dark:bg-slate-800 mx-4 hidden sm:block" />
            )}
          </div>
        );
      })}
    </div>
  );
};
FormStepper.displayName = "FormStepper";

// ==========================================
// 4. StickySaveBar Component
// ==========================================
export interface StickySaveBarProps {
  isDirty: boolean;
  onSave: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const StickySaveBar: React.FC<StickySaveBarProps> = ({
  isDirty,
  onSave,
  onCancel,
  loading = false,
}) => {
  if (!isDirty) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-72 md:right-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/85 rounded-xl shadow-xl p-4 flex items-center justify-between z-40 text-right select-none animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-slate-850 dark:text-white">שינויים שלא נשמרו</span>
        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">יש לך שינויים שלא נשמרו בטופס הנוכחי.</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex items-center gap-1.5 h-8.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
          <span>ביטול</span>
        </button>
        <button
          onClick={onSave}
          disabled={loading}
          className="flex items-center gap-1.5 h-8.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-550 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          <Check className="h-4 w-4" />
          <span>{loading ? "שומר..." : "שמור שינויים"}</span>
        </button>
      </div>
    </div>
  );
};
StickySaveBar.displayName = "StickySaveBar";
