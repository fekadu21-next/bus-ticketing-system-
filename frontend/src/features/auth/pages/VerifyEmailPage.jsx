import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { verifyEmailApi } from '@/features/auth/auth.api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('auth.verifyEmail.missingToken', 'Verification token is missing. Please check the link from your email.'));
      return;
    }

    const verify = async () => {
      try {
        const response = await verifyEmailApi({ token });
        setStatus('success');
        setMessage(response.message || t('auth.verifyEmail.successTitle', 'Email Verified Successfully'));
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || err.message || t('auth.errors.verifyFailed', 'Email verification failed or link has expired.'));
      }
    };

    verify();
  }, [token, t]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('auth.verifyEmail.title', 'Verify Your Email')}</h1>
        </div>

        {status === 'verifying' && (
          <div className="py-8">
            <LoadingSpinner label={t('auth.verifyEmail.verifying', 'Verifying your email address...')} />
          </div>
        )}

        {status === 'success' && (
          <div className="py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
              {t('auth.verifyEmail.successTitle', 'Email Verified Successfully')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
              {message}
            </p>
            <Link to="/login" className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 inline-block flex items-center justify-center gap-2">
              {t('auth.verifyEmail.continueToLogin', 'Continue to Sign In')} <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={36} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
              {t('auth.verifyEmail.errorTitle', 'Verification Failed')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
              {message}
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/resend-verification" className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200">
                {t('auth.verifyEmail.requestNewLink', 'Request a New Verification Link')}
              </Link>
              <Link to="/login" className="w-full px-4 py-2.5 bg-slate-600 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors duration-200">
                {t('auth.verifyEmail.backToLogin', 'Back to Sign In')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
