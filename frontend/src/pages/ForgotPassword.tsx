import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { KeyRound, ArrowLeft, ArrowRight, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const { direction } = useUIStore();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const isRTL = direction === 'rtl';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 transition-colors duration-200 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200/60 bg-white p-8 shadow-xl dark:border-slate-800/80 dark:bg-slate-900 glassmorphism">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="mt-6 font-heading text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isRTL ? 'שחזור סיסמה' : 'Forgot Password'}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isRTL ? 'שלח קישור לאיפוס הסיסמה לחשבונך' : 'Send a link to reset your account password'}
          </p>
        </div>

        {submitted ? (
          <div className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
            {isRTL 
              ? 'אם החשבון קיים במערכת, נשלח אליו דואר אלקטרוני עם קישור לאיפוס.' 
              : 'If that account exists, we have sent a reset password link.'}
            <div className="mt-4">
              <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400">
                {isRTL ? 'חזרה לדף ההתחברות' : 'Back to Login'}
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'כתובת אימייל' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-slate-950 placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-850 dark:text-white"
                  placeholder="admin@pikud360.com"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {isRTL ? 'שלח הוראות איפוס' : 'Send Reset Link'}
              </button>
            </div>

            <div className="flex items-center justify-center">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
              >
                {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                {isRTL ? 'חזרה לדף כניסה' : 'Back to sign in'}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
