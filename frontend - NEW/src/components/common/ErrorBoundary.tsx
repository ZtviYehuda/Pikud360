import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 relative overflow-hidden font-sans select-none" dir="rtl">
          {/* Subtle background glow */}
          <div className="absolute w-[400px] h-[400px] rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-3xl pointer-events-none -z-10" />

          <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center gap-6">
            {/* Clean Matzevet Shield Emblem (No spinning light artifacts) */}
            <div className="relative flex items-center justify-center p-2">
              <div className="absolute inset-0 rounded-3xl bg-blue-500/10 blur-xl -z-10" />
              <img
                src="/logo_unit.png"
                alt="סמל היחידה"
                className="w-28 h-28 sm:w-32 sm:h-32 object-contain filter drop-shadow-[0_8px_20px_rgba(59,130,246,0.3)]"
              />
            </div>

            {/* Error Message */}
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                אופס! משהו השתבש
              </h1>
              <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed max-w-[90%]">
                המערכת נתקלה בשגיאה טכנית. פרטי השגיאה מוצגים למטה:
              </p>
            </div>

            {/* Error Details */}
            {this.state.error && (
              <div
                className="w-full bg-slate-100 dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto text-right"
                dir="ltr"
              >
                <div className="text-xs font-bold text-red-600 dark:text-red-400 font-mono block whitespace-pre-wrap leading-relaxed">
                  {this.state.error.message || this.state.error.toString()}
                </div>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-2 whitespace-pre-wrap overflow-x-auto border-t border-slate-200 dark:border-slate-800 pt-2">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mt-2">
              <Button
                size="lg"
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 rounded-xl font-bold transition-all shadow-md gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                רענן ונסה שוב
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/login";
                }}
                className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 h-11 px-6 rounded-xl font-bold transition-all gap-2"
              >
                <Home className="w-4 h-4" />
                חזרה להתחברות
              </Button>
            </div>
          </div>

          {/* Footer Decoration */}
          <div className="absolute bottom-6 text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            SECURE CLIENT ENVIRONMENT
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

