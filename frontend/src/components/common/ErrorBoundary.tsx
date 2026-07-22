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
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 relative overflow-hidden font-heebo">
          <div className="toren-lighthouse-flash" />

          <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center">
            {/* Spinning Lighthouse Logo */}
            <div className="relative flex items-center justify-center mb-8">
              <div className="toren-spin-container">
                <img
                  src="/toren_logo_base.png"
                  alt="סמל Toren"
                  className="toren-spin-logo"
                />
                <div className="toren-spin-beam-original" />
                <div className="toren-lantern-flare" />
              </div>
            </div>

            {/* Error Message */}
            <h1
              className="text-4xl font-black mb-3 tracking-tight"
              style={{
                backgroundImage: "linear-gradient(to bottom, var(--foreground), color-mix(in srgb, var(--foreground) 60%, transparent))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              וואופס! משהו השתבש
            </h1>

            <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-[80%]">
              המערכת נתקלה בשגיאה לא צפויה. אל דאגה, המידע שלך שמור ומאובטח.
            </p>

            {/* Error Details (Only in Dev/Debug) */}
            {import.meta.env.DEV && this.state.error && (
              <div
                className="w-full bg-muted p-4 rounded-xl border border-border mb-8 max-h-40 overflow-y-auto text-left"
                dir="ltr"
              >
                <code className="text-xs text-destructive font-mono block whitespace-pre-wrap">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                size="lg"
                onClick={() => window.location.reload()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 gap-2"
              >
                <RefreshCw className="w-5 h-5 animate-spin-slow" />
                רענון המערכת
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => (window.location.href = "/")}
                className="bg-background border border-input hover:bg-accent hover:text-accent-foreground h-12 px-8 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 gap-2"
              >
                <Home className="w-5 h-5" />
                חזרה לראשי
              </Button>
            </div>
          </div>

          {/* Footer Decoration */}
          <div className="absolute bottom-8 text-xs text-muted-foreground/50 font-medium">
            Error Code: 500_CLIENT_CRASH
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

