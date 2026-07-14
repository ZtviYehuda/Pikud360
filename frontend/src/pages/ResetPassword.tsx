import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { Lock } from 'lucide-react';

export default function ResetPassword() {
  const { direction } = useUIStore();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const isRTL = direction === 'rtl';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === confirmPassword) {
      setSubmitted(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 transition-colors duration-200 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200/60 bg-white p-8 shadow-xl dark:border-slate-800/80 dark:bg-slate-900 glassmorphism">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mt-6 font-heading text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isRTL ? 'איפוס סיסמה' : 'Reset Password'}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isRTL ? 'הזן את הסיסמה החדשה עבור חשבונך' : 'Enter your new account password'}
          </p>
        </div>

        {submitted ? (
          <div className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
            {isRTL 
              ? 'סיסמתך שונתה בהצלחה! מנתב לדף ההתחברות...' 
              : 'Password reset successfully! Redirecting to login...'}
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'סיסמה חדשה' : 'New Password'}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-slate-950 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-850 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'אימות סיסמה חדשה' : 'Confirm New Password'}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-slate-950 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-850 dark:text-white"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={password !== confirmPassword || password.length === 0}
                className="flex w-full justify-center rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-md hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRTL ? 'עדכן סיסמה' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
