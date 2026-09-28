import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import Alert from '@/components/ui/Alert';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { Bus, Eye, EyeOff, ArrowRight, Building } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    const result = await login(formData.email, formData.password);
    setIsSubmitting(false);

    if (result.success) {
      // Direct user to requested protected page OR their specific role dashboard
      const targetPath = location.state?.from?.pathname || result.redirectPath || '/dashboard';
      navigate(targetPath, { replace: true });
    } else {
      setErrorMessage(result.error);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Language switcher */}
        <div className="auth-lang-row">
          <LanguageSwitcher variant="compact" />
        </div>

        {/* Logo + Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <Bus size={28} color="var(--color-primary)" />
          </div>
          <h1>{t('auth.login.title', 'Welcome Back')}</h1>
          <p>{t('auth.login.subtitle', 'Sign in to your bus ticketing account')}</p>
        </div>

        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              {t('auth.login.emailLabel', 'Email Address')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="form-input"
              placeholder={t('auth.login.emailPlaceholder', 'name@example.com')}
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>
                {t('auth.login.passwordLabel', 'Password')}
              </label>
              <Link to="/forgot-password" className="text-link" style={{ fontSize: '0.82rem' }}>
                {t('auth.login.forgotPassword', 'Forgot password?')}
              </Link>
            </div>
            <div className="input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input with-icon-right"
                placeholder={t('auth.login.passwordPlaceholder', '••••••••')}
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-icon-right btn-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
            style={{ marginTop: 6 }}
          >
            {isSubmitting ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 8 }} />
                {t('auth.login.submitting', 'Signing in...')}
              </>
            ) : (
              <>
                {t('auth.login.submitBtn', 'Sign In')} <ArrowRight size={16} style={{ marginLeft: 6 }} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-link">
          {t('auth.login.noAccount', "Don't have an account?")}{' '}
          <Link to="/register">{t('auth.login.registerLink', 'Register here')}</Link>
        </div>

        {/* Operator registration shortcut */}
        <div className="auth-operator-shortcut">
          <Link to="/partner-register" className="operator-link">
            <Building size={15} style={{ marginRight: 6 }} />
            {t('auth.login.operatorLink', 'Are you a bus operator? Register your organization →')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
