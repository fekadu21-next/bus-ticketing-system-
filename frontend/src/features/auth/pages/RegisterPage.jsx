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
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-green-500',
};

const STRENGTH_TEXT_COLORS = {
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-yellow-500',
  4: 'text-green-500',
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher variant="compact" />
          </div>
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t('auth.register.successTitle', 'Registration Successful')}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
            {successMessage}
          </p>
          <Link to="/resend-verification" className="w-full px-4 py-2.5 bg-slate-600 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors duration-200 inline-block">
            {t('auth.verifyEmail.resendBtn', 'Resend Verification Email')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher variant="compact" />
        </div>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Bus size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('auth.register.title', 'Create an Account')}</h1>
          <p className="text-slate-600 dark:text-slate-400">{t('auth.register.subtitle', 'Register as a passenger to book intercity trips')}</p>
        </div>

        {errorMessage && (
          <Alert variant="danger">
            <div>{errorMessage}</div>
            {errorDetails.length > 0 && (
              <ul className="mt-2 ml-5 text-sm list-disc">
                {errorDetails.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="firstName">
                {t('auth.register.firstNameLabel', 'First Name')} *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={t('auth.register.firstNamePlaceholder', 'Abebe')}
                value={formData.firstName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="lastName">
                {t('auth.register.lastNameLabel', 'Last Name')} *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={t('auth.register.lastNamePlaceholder', 'Kebede')}
                value={formData.lastName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
              {t('auth.register.emailLabel', 'Email Address')} *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={t('auth.register.emailPlaceholder', 'abebe@example.com')}
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="phone">
              {t('auth.register.phoneLabel', 'Phone Number')}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={t('auth.register.phonePlaceholder', '+251 911 234567')}
              value={formData.phone}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
                {t('auth.register.passwordLabel', 'Password')} *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed pr-10"
                  placeholder={t('auth.register.passwordPlaceholder', 'Min 8 characters')}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`flex-1 rounded-full ${score >= i ? STRENGTH_COLORS[score] : 'bg-slate-200 dark:bg-slate-700'}`} />
                    ))}
                  </div>
                  <span className={`text-xs mt-1 block ${STRENGTH_TEXT_COLORS[score]}`}>
                    {labelKey ? t(`auth.register.${labelKey}`, labelKey.replace('strength', '')) : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="confirmPassword">
                {t('auth.register.confirmPasswordLabel', 'Confirm Password')} *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed pr-10"
                  placeholder={t('auth.register.confirmPasswordPlaceholder', 'Repeat password')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('auth.register.submitting', 'Creating account...')}
              </>
            ) : (
              <>
                {t('auth.register.submitBtn', 'Register Account')} <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          {t('auth.register.hasAccount', 'Already have an account?')}{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
            {t('auth.register.loginLink', 'Sign in here')}
          </Link>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Link to="/partner-register" className="flex items-center justify-center gap-2 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium">
            {t('auth.register.operatorLink', 'Are you a bus operator? Register your organization →')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
