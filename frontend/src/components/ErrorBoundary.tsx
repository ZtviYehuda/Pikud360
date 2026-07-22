import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center bg-slate-50 p-4"
          dir="rtl"
        >
          <div className="max-w-md w-full bg-white rounded-2xl  border p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">
              שגיאה לא צפויה
            </h1>
            <p className="text-slate-500 mb-6">
              אירעה שגיאה בטעינת המערכת. נסה לרענן את העמוד או להתחבר מחדש.
            </p>

            <div
              className="bg-slate-100 p-4 rounded-lg text-left text-xs font-mono text-slate-700 overflow-auto max-h-40 mb-6"
              dir="ltr"
            >
              {this.state.error?.message}
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                רענן עמוד
              </Button>
              <Button
                onClick={this.handleReset}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                התחבר מחדש (נקה מטמון)
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
