import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Mail } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { t } = useTranslation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 transition-colors duration-200 dark:bg-slate-950 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-8 shadow-xl">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="mt-6 font-heading text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('common:login_title')}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t('common:login')}
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('common:email_label')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('common:email_placeholder')}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('common:password_label')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('common:password_placeholder')}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Links: Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <Link
              to="/forgot-password"
              className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400"
            >
              {t('common:forgot_password')}
            </Link>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full py-3 h-auto"
            >
              {t('common:submit_login')}
            </Button>
          </div>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="mt-6 border-t border-slate-200/60 pt-6 dark:border-slate-800">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-4">
            {t('common:app_name')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={loginAsAdmin}
              className="font-semibold"
            >
              {t('common:admin')}
            </Button>
            <Button
              variant="outline"
              onClick={loginAsOperator}
              className="font-semibold"
            >
              {t('common:profile')}
            </Button>
          </div>
        </div>
        
      </Card>
    </div>
  );
}
