import * as React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Lock, User, AlertCircle } from "lucide-react";

export interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const { login, loading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    const ok = await login({ username, password, rememberMe });
    if (ok) {
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full text-right" dir="rtl">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Username Field */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          שם משתמש
        </label>
        <div className="relative">
          <Input
            type="text"
            placeholder="הזן שם משתמש"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="pr-10"
          />
          <User className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          סיסמה
        </label>
        <div className="relative">
          <Input
            type="password"
            placeholder="הזן סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pr-10"
          />
          <Lock className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Remember Me Option */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
          />
          <span>זכור אותי במכשיר זה</span>
        </label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        loading={loading}
        fullWidth
        className="mt-2 font-bold"
      >
        התחבר למערכת
      </Button>
    </form>
  );
};
LoginForm.displayName = "LoginForm";
