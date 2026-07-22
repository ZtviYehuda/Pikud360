import * as React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { ShieldCheck, UserCheck, ShieldAlert } from "lucide-react";

export interface QuickLoginSelectorProps {
  onSuccess?: () => void;
}

export const QuickLoginSelector: React.FC<QuickLoginSelectorProps> = ({ onSuccess }) => {
  const { quickLogin, loading } = useAuthStore();

  const handleSelect = async (userId: number) => {
    const ok = await quickLogin(userId);
    if (ok) {
      onSuccess?.();
    }
  };

  return (
    <div className="space-y-3 pt-4 border-t border-slate-200/60 dark:border-slate-800 text-right select-none">
      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
        כניסה מהירה (סביבת בדיקות)
      </span>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleSelect(1)}
          disabled={loading}
          className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
        >
          <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">מפקד</span>
        </button>

        <button
          onClick={() => handleSelect(2)}
          disabled={loading}
          className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
        >
          <ShieldAlert className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">מנהל</span>
        </button>

        <button
          onClick={() => handleSelect(3)}
          disabled={loading}
          className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
        >
          <UserCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">קצין</span>
        </button>
      </div>
    </div>
  );
};
QuickLoginSelector.displayName = "QuickLoginSelector";
