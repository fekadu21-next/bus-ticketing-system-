import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import Alert from '@/components/ui/Alert';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { Bus, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

/** Returns a strength score 0–4 and a label key */
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, labelKey: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['', 'strengthWeak', 'strengthFair', 'strengthGood', 'strengthStrong'];
  return { score, labelKey: labels[score] };
};

const STRENGTH_COLORS = {
  1: 'active-weak',
  2: 'active-fair',
  3: 'active-good',
  4: 'active-strong',
};

const STRENGTH_TEXT_COLORS = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
};

const RegisterPage = () => {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { score, labelKey } = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorDetails([]);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage(t('auth.errors.passwordMismatch', 'Passwords do not match.'));
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage(t('auth.errors.passwordTooShort', 'Password must be at least 8 characters long.'));
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    if (result.success) {
      // If session/token was already established by register
      if (result.data?.accessToken) {
        setIsSubmitting(false);
        navigate('/dashboard', { replace: true });
        return;
      }

      // Immediately establish session via login without redirecting to /login
      const loginResult = await login(formData.email.trim(), formData.password);
      setIsSubmitting(false);

      if (loginResult.success) {
        navigate('/dashboard', { replace: true });
        return;
      } else {
        // If login failed (e.g. backend requires verified email before login)
        setSuccessMessage(result.message || t('auth.register.successText', 'Account created! Please check your email for a verification link.'));
      }
    } else {
      setIsSubmitting(false);
      setErrorMessage(result.error);
      if (result.errors?.length) {
        setErrorDetails(result.errors.map((err) => err.message || err));
      }
    }
  };

  if (successMessage) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-lang-row">
            <LanguageSwitcher variant="compact" />
          </div>
          <div style={{ padding: '8px 0' }}>
            <div className="icon-circle icon-circle-success" style={{ margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontWeight: 800, marginBottom: 8 }}>
              {t('auth.register.successTitle', 'Registration Successful')}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: '0.9rem', lineHeight: 1.6 }}>
              {successMessage}
            </p>
            <Link to="/resend-verification" className="btn btn-secondary btn-block">
              {t('auth.verifyEmail.resendBtn', 'Resend Verification Email')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-lang-row">
          <LanguageSwitcher variant="compact" />
        </div>

        <div className="auth-header">
          <div className="auth-logo">
            <Bus size={26} color="var(--color-primary)" />
          </div>
          <h1>{t('auth.register.title', 'Create an Account')}</h1>
          <p>{t('auth.register.subtitle', 'Register as a passenger to book intercity trips')}</p>
        </div>

        {errorMessage && (
          <Alert variant="danger">
            <div>{errorMessage}</div>
            {errorDetails.length > 0 && (
              <ul style={{ marginTop: 6, paddingLeft: 18, fontSize: '0.82rem' }}>
                {errorDetails.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">
                {t('auth.register.firstNameLabel', 'First Name')} *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="form-input"
                placeholder={t('auth.register.firstNamePlaceholder', 'Abebe')}
                value={formData.firstName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="lastName">
                {t('auth.register.lastNameLabel', 'Last Name')} *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="form-input"
                placeholder={t('auth.register.lastNamePlaceholder', 'Kebede')}
                value={formData.lastName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              {t('auth.register.emailLabel', 'Email Address')} *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="form-input"
              placeholder={t('auth.register.emailPlaceholder', 'abebe@example.com')}
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              {t('auth.register.phoneLabel', 'Phone Number')}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="form-input"
              placeholder={t('auth.register.phonePlaceholder', '+251 911 234567')}
              value={formData.phone}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                {t('auth.register.passwordLabel', 'Password')} *
              </label>
              <div className="input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input with-icon-right"
                  placeholder={t('auth.register.passwordPlaceholder', 'Min 8 characters')}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button type="button" className="input-icon-right" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bars">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`strength-bar ${score >= i ? STRENGTH_COLORS[score] : ''}`} />
                    ))}
                  </div>
                  <span className="strength-label" style={{ color: STRENGTH_TEXT_COLORS[score] }}>
                    {labelKey ? t(`auth.register.${labelKey}`, labelKey.replace('strength', '')) : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                {t('auth.register.confirmPasswordLabel', 'Confirm Password')} *
              </label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  className="form-input with-icon-right"
                  placeholder={t('auth.register.confirmPasswordPlaceholder', 'Repeat password')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button type="button" className="input-icon-right" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting} style={{ marginTop: 6 }}>
            {isSubmitting ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                {t('auth.register.submitting', 'Creating account...')}
              </>
            ) : (
              <>
                {t('auth.register.submitBtn', 'Register Account')} <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-link">
          {t('auth.register.hasAccount', 'Already have an account?')}{' '}
          <Link to="/login">{t('auth.register.loginLink', 'Sign in here')}</Link>
        </div>

        <div className="auth-operator-shortcut">
          <Link to="/partner-register" className="operator-link">
            {t('auth.register.operatorLink', 'Are you a bus operator? Register your organization →')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
