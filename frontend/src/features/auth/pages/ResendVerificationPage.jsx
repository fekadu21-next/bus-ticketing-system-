import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resendVerificationApi } from '@/features/auth/auth.api';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

const ResendVerificationPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await resendVerificationApi({ email });
    } catch {
      // Suppress errors to prevent account enumeration
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-lang-row">
          <LanguageSwitcher variant="compact" />
        </div>

        <div className="auth-header">
          <h1>{t('auth.resendVerification.title', 'Resend Verification Email')}</h1>
          <p>{t('auth.resendVerification.subtitle', 'Enter your registered email address to get a new verification link')}</p>
        </div>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div className="icon-circle icon-circle-primary" style={{ margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontWeight: 800, marginBottom: 8 }}>
              {t('auth.resendVerification.sentTitle', 'Verification Email Sent')}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: '0.9rem', lineHeight: 1.6 }}>
              {t('auth.resendVerification.sentText', { email, defaultValue: `If an account exists for ${email}, a verification link has been sent.` })}
            </p>
            <Link to="/login" className="btn btn-secondary btn-block">
              <ArrowLeft size={15} /> {t('auth.resendVerification.backToLogin', 'Back to Sign In')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                {t('auth.resendVerification.emailLabel', 'Email Address')}
              </label>
              <input
                id="email"
                type="email"
                required
                className="form-input"
                placeholder={t('auth.resendVerification.emailPlaceholder', 'name@example.com')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting} style={{ marginTop: 6 }}>
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  {t('auth.resendVerification.submitting', 'Sending verification link...')}
                </>
              ) : (
                t('auth.resendVerification.submitBtn', 'Resend Verification Link')
              )}
            </button>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link to="/login" className="back-link">
                <ArrowLeft size={15} /> {t('auth.resendVerification.backToLogin', 'Back to Sign In')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResendVerificationPage;
