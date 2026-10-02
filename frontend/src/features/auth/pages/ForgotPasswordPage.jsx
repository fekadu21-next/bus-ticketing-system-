import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPasswordApi } from '@/features/auth/auth.api';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await forgotPasswordApi({ email });
    } catch {
      // Suppress to prevent account enumeration
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher variant="compact" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('auth.forgotPassword.title', 'Forgot Password')}</h1>
          <p className="text-slate-600 dark:text-slate-400">{t('auth.forgotPassword.subtitle', 'Enter your email to receive a password reset link')}</p>
        </div>

        {isSubmitted ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {t('auth.forgotPassword.sentTitle', 'Reset Link Sent')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
              {t('auth.forgotPassword.sentText', { email, defaultValue: `If an account exists with ${email}, we have sent password reset instructions.` })}
            </p>
            <Link to="/login" className="w-full px-4 py-2.5 bg-slate-600 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors duration-200 inline-block flex items-center justify-center gap-2">
              <ArrowLeft size={15} /> {t('auth.forgotPassword.backToLogin', 'Back to Sign In')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
                {t('auth.forgotPassword.emailLabel', 'Email Address')}
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={t('auth.forgotPassword.emailPlaceholder', 'name@example.com')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>

            <button type="submit" className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('auth.forgotPassword.submitting', 'Sending link...')}
                </>
              ) : (
                t('auth.forgotPassword.submitBtn', 'Send Reset Link')
              )}
            </button>

            <div className="text-center mt-4">
              <Link to="/login" className="text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 flex items-center justify-center gap-2">
                <ArrowLeft size={15} /> {t('auth.forgotPassword.backToLogin', 'Back to Sign In')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
