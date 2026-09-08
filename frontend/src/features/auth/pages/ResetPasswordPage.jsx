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
    if (!token) { setErrorMessage(t('auth.resetPassword.missingToken')); return; }
    if (newPassword !== confirmPassword) { setErrorMessage(t('auth.errors.passwordMismatch')); return; }
    if (newPassword.length < 8) { setErrorMessage(t('auth.errors.passwordTooShort')); return; }

    setIsSubmitting(true);
    try {
      const response = await resetPasswordApi({ token, newPassword, confirmPassword });
      setSuccessMessage(response.message || t('auth.resetPassword.successTitle'));
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || t('auth.errors.resetFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-lang-row">
          <LanguageSwitcher variant="compact" />
        </div>

        <div className="auth-header">
          <h1>{t('auth.resetPassword.title')}</h1>
          <p>{t('auth.resetPassword.subtitle')}</p>
        </div>

        {successMessage ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div className="icon-circle icon-circle-success" style={{ margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontWeight: 800, color: 'var(--color-success)', marginBottom: 8 }}>
              {t('auth.resetPassword.successTitle')}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>{successMessage}</p>
            <Link to="/login" className="btn btn-primary btn-block">
              {t('auth.resetPassword.signInNow')} <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <>
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            {!token && <Alert variant="warning">{t('auth.resetPassword.invalidLink')}</Alert>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">{t('auth.resetPassword.newPasswordLabel')}</label>
                <div className="input-wrapper">
                  <input id="newPassword" type={showNew ? 'text' : 'password'} required
                    className="form-input with-icon-right" placeholder="••••••••"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSubmitting || !token} autoComplete="new-password" />
                  <button type="button" className="input-icon-right" onClick={() => setShowNew(v => !v)} tabIndex={-1}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">{t('auth.resetPassword.confirmPasswordLabel')}</label>
                <div className="input-wrapper">
                  <input id="confirmPassword" type={showConfirm ? 'text' : 'password'} required
                    className="form-input with-icon-right" placeholder="••••••••"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting || !token} autoComplete="new-password" />
                  <button type="button" className="input-icon-right" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting || !token} style={{ marginTop: 6 }}>
                {isSubmitting
                  ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />{t('auth.resetPassword.submitting')}</>
                  : t('auth.resetPassword.submitBtn')
                }
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
