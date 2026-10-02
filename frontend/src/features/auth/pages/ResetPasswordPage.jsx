import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPasswordApi } from '@/features/auth/auth.api';
import Alert from '@/components/ui/Alert';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { CheckCircle2, Eye, EyeOff, ArrowRight } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!token) {
      setErrorMessage(t('auth.resetPassword.missingToken', 'Reset token is missing or invalid. Please request a new link.'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage(t('auth.errors.passwordMismatch', 'Passwords do not match.'));
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage(t('auth.errors.passwordTooShort', 'Password must be at least 8 characters long.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await resetPasswordApi({ token, newPassword, confirmPassword });
      setSuccessMessage(response.message || t('auth.resetPassword.successTitle', 'Password Reset Successfully'));
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || t('auth.errors.resetFailed', 'Failed to reset password. The link may have expired.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher variant="compact" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('auth.resetPassword.title', 'Reset Your Password')}</h1>
          <p className="text-slate-600 dark:text-slate-400">{t('auth.resetPassword.subtitle', 'Choose a strong new password for your account')}</p>
        </div>

        {successMessage ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
              {t('auth.resetPassword.successTitle', 'Password Reset Successfully')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">{successMessage}</p>
            <Link to="/login" className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 inline-block flex items-center justify-center gap-2">
              {t('auth.resetPassword.signInNow', 'Sign In with New Password')} <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <>
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            {!token && <Alert variant="warning">{t('auth.resetPassword.invalidLink', 'Invalid or expired reset link. Please request a new one.')}</Alert>}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="newPassword">
                  {t('auth.resetPassword.newPasswordLabel', 'New Password')}
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNew ? 'text' : 'password'}
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed pr-10"
                    placeholder={t('auth.resetPassword.newPasswordPlaceholder', 'Min 8 characters')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSubmitting || !token}
                    autoComplete="new-password"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" onClick={() => setShowNew((v) => !v)} tabIndex={-1}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="confirmPassword">
                  {t('auth.resetPassword.confirmPasswordLabel', 'Confirm Password')}
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed pr-10"
                    placeholder={t('auth.resetPassword.confirmPasswordPlaceholder', 'Repeat password')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting || !token}
                    autoComplete="new-password"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" disabled={isSubmitting || !token}>
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('auth.resetPassword.submitting', 'Updating password...')}
                  </>
                ) : (
                  t('auth.resetPassword.submitBtn', 'Reset Password')
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
