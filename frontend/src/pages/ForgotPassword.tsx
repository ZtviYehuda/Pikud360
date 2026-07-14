import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KeyRound, ArrowRight, Mail } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 transition-colors duration-200 dark:bg-slate-950 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-8 shadow-xl">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="mt-6 font-heading text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('common:forgot_password_title')}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t('common:forgot_password')}
          </p>
        </div>

        {submitted ? (
          <div className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400 mt-8">
            {t('common:reset_link_sent')}
            <div className="mt-4">
              <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400">
                {t('common:back_to_login')}
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
              <Button
                type="submit"
                className="w-full py-3 h-auto"
              >
                {t('common:send_reset_link')}
              </Button>
            </div>

            <div className="flex items-center justify-center">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
              >
                <ArrowRight className="h-4 w-4" />
                {t('common:back_to_login')}
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
