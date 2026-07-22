import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle, X, RotateCcw, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";

// ==========================================
// Types & Interfaces
// ==========================================
export type ToastType = "success" | "warning" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  undoLabel?: string;
  onUndo?: () => void;
}

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface FeedbackContextType {
  toast: (msg: Omit<ToastMessage, "id">) => void;
  confirm: (opts: ConfirmOptions) => void;
}

const FeedbackContext = React.createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = (): FeedbackContextType => {
  const context = React.useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
};

// ==========================================
// FeedbackProvider Component
// ==========================================
export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);
  const [confirmOpts, setConfirmOpts] = React.useState<ConfirmOptions | null>(null);

  // Trigger auto-dismissing toast messages
  const toast = React.useCallback((msg: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...msg, id };
    setToasts((prev) => [...prev, newToast]);

    const delay = msg.duration || 4000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, delay);
  }, []);

  // Trigger confirm modal triggers
  const confirm = React.useCallback((opts: ConfirmOptions) => {
    setConfirmOpts(opts);
  }, []);

  const handleConfirm = () => {
    if (confirmOpts) {
      confirmOpts.onConfirm();
      setConfirmOpts(null);
    }
  };

  const handleCancel = () => {
    if (confirmOpts) {
      if (confirmOpts.onCancel) confirmOpts.onCancel();
      setConfirmOpts(null);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      {/* 1. Toaster Stack (Float Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-3 w-full max-w-sm pointer-events-none select-none text-right">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-lg pointer-events-auto flex gap-3 items-start animate-in slide-in-from-bottom-5 duration-200",
              t.type === "success" && "border-emerald-500/30",
              t.type === "warning" && "border-amber-500/30",
              t.type === "error" && "border-rose-500/30",
              t.type === "info" && "border-cyan-500/30"
            )}
          >
            {/* Status Icons */}
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              {t.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {t.type === "error" && <XCircle className="h-5 w-5 text-rose-500" />}
              {t.type === "info" && <AlertCircle className="h-5 w-5 text-cyan-500" />}
            </div>

            {/* Title / Description */}
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight font-heading">
                {t.title}
              </h4>
              {t.description && (
                <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-normal">
                  {t.description}
                </p>
              )}

              {/* Undo capability */}
              {t.undoLabel && t.onUndo && (
                <button
                  onClick={() => {
                    if (t.onUndo) t.onUndo();
                    removeToast(t.id);
                  }}
                  className="flex items-center gap-1 mt-2 text-[10px] font-bold text-cyan-600 hover:text-cyan-550 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{t.undoLabel}</span>
                </button>
              )}
            </div>

            {/* Dismiss Cross */}
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-md cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>

          </div>
        ))}
      </div>

      {/* 2. Global Confirm Dialog Overlay */}
      {confirmOpts && (
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-slate-950/65 backdrop-blur-xs z-100 flex items-center justify-center p-4 text-right animate-in fade-in duration-200 select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            
            {/* Header info */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                {confirmOpts.title}
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed font-medium">
                {confirmOpts.description}
              </p>
            </div>

            {/* Actions button footer */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleCancel}
                className="h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer"
              >
                {confirmOpts.cancelLabel || "ביטול"}
              </button>
              <button
                onClick={handleConfirm}
                className={cn(
                  "h-9 px-4 rounded-lg text-xs font-bold text-white transition-all shadow-xs cursor-pointer",
                  confirmOpts.isDanger
                    ? "bg-rose-500 hover:bg-rose-550"
                    : "bg-cyan-600 hover:bg-cyan-550"
                )}
              >
                {confirmOpts.confirmLabel || "אישור"}
              </button>
            </div>

          </div>
        </div>
      )}

    </FeedbackContext.Provider>
  );
};
