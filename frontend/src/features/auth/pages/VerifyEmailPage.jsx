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
    <div className="auth-wrapper">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-header">
          <h1>{t('auth.verifyEmail.title', 'Verify Your Email')}</h1>
        </div>

        {status === 'verifying' && (
          <div style={{ padding: '32px 0' }}>
            <LoadingSpinner label={t('auth.verifyEmail.verifying', 'Verifying your email address...')} />
          </div>
        )}

        {status === 'success' && (
          <div style={{ padding: '12px 0' }}>
            <div className="icon-circle icon-circle-success" style={{ margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontWeight: 800, color: 'var(--color-success)', marginBottom: 8 }}>
              {t('auth.verifyEmail.successTitle', 'Email Verified Successfully')}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: '0.9rem', lineHeight: 1.6 }}>
              {message}
            </p>
            <Link to="/login" className="btn btn-primary btn-block">
              {t('auth.verifyEmail.continueToLogin', 'Continue to Sign In')} <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: '12px 0' }}>
            <div className="icon-circle icon-circle-danger" style={{ margin: '0 auto 16px' }}>
              <AlertCircle size={36} />
            </div>
            <h3 style={{ fontWeight: 800, color: 'var(--color-danger)', marginBottom: 8 }}>
              {t('auth.verifyEmail.errorTitle', 'Verification Failed')}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: '0.9rem', lineHeight: 1.6 }}>
              {message}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/resend-verification" className="btn btn-primary btn-block">
                {t('auth.verifyEmail.requestNewLink', 'Request a New Verification Link')}
              </Link>
              <Link to="/login" className="btn btn-secondary btn-block">
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
