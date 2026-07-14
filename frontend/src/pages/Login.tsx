import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { Shield, Lock, Mail } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { direction } = useUIStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default dummy login
    login('mock-jwt-token-xyz', {
      id: 'usr-1',
      name: 'John Doe',
      email: email || 'admin@pikud360.com',
      roles: ['admin'],
      permissions: ['view_dashboard', 'manage_employees', 'view_reports', 'manage_shifts']
    });
    navigate('/dashboard');
  };

  const loginAsAdmin = () => {
    login('mock-jwt-admin-token', {
      id: 'usr-admin',
      name: 'Administrator',
      email: 'admin@pikud360.com',
      roles: ['admin'],
      permissions: ['view_dashboard', 'manage_employees', 'manage_org', 'view_attendance', 'manage_shifts', 'view_reports', 'view_settings']
    });
    navigate('/dashboard');
  };

  const loginAsOperator = () => {
    login('mock-jwt-operator-token', {
      id: 'usr-operator',
      name: 'Operator User',
      email: 'operator@pikud360.com',
      roles: ['operator'],
      permissions: ['view_dashboard', 'view_attendance', 'view_reports']
    });
    navigate('/dashboard');
  };

  const isRTL = direction === 'rtl';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 transition-colors duration-200 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200/60 bg-white p-8 shadow-xl dark:border-slate-800/80 dark:bg-slate-900 glassmorphism">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="mt-6 font-heading text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isRTL ? 'כניסה למערכת Pikud360' : 'Sign in to Pikud360'}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isRTL ? 'פורטל ניהול כוח אדם ארגוני' : 'Enterprise Workforce Management Portal'}
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md">
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
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'סיסמה' : 'Password'}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-slate-950 placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-850 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Links: Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
            >
              {isRTL ? 'שכחת את הסיסמה?' : 'Forgot your password?'}
            </Link>
          </div>

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              {isRTL ? 'התחבר' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="mt-6 border-t border-slate-200/60 pt-6 dark:border-slate-800">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
            {isRTL ? 'כניסה מהירה להדגמה' : 'Quick Demo Sign In'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={loginAsAdmin}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-300/80 bg-slate-100 py-2 text-xs font-semibold hover:bg-slate-200 dark:border-slate-750 dark:bg-slate-800 dark:hover:bg-slate-750 cursor-pointer"
            >
              {isRTL ? 'מנהל מערכת' : 'Administrator'}
            </button>
            <button
              onClick={loginAsOperator}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-300/80 bg-slate-100 py-2 text-xs font-semibold hover:bg-slate-200 dark:border-slate-750 dark:bg-slate-800 dark:hover:bg-slate-750 cursor-pointer"
            >
              {isRTL ? 'מפעיל' : 'Operator'}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
