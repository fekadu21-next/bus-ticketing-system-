import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  UserCheck,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building,
} from 'lucide-react';
import Alert from '@/components/ui/Alert';

export const PartnerRegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Organization Information
    orgName: '',
    orgEmail: '',
    orgType: 'Private Bus Company',
    city: 'Addis Ababa',
    regNumber: '',
    address: '',
    orgPhone: '',

    // Step 2: Authorized Representative
    repFullName: '',
    repPosition: 'Operations Manager',
    repPhone: '',
    repEmail: '',

    // Step 3: Account Credentials
    loginEmail: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [stepErrors, setStepErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'repEmail' && !formData.loginEmail) {
      setFormData((prev) => ({ ...prev, loginEmail: value }));
    }
    if (stepErrors[name]) {
      setStepErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateStep1 = () => {
    const errs = {};
    if (!formData.orgName.trim()) errs.orgName = t('common.required');
    if (!formData.orgType) errs.orgType = t('common.required');
    if (!formData.city) errs.city = t('common.required');
    if (!formData.regNumber.trim()) errs.regNumber = t('common.required');
    if (!formData.address.trim()) errs.address = t('common.required');
    if (!formData.orgPhone.trim()) errs.orgPhone = t('common.required');

    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!formData.repFullName.trim()) errs.repFullName = t('common.required');
    if (!formData.repPosition.trim()) errs.repPosition = t('common.required');
    if (!formData.repPhone.trim()) errs.repPhone = t('common.required');
    if (!formData.repEmail.trim()) {
      errs.repEmail = t('common.required');
    } else if (!/\S+@\S+\.\S+/.test(formData.repEmail)) {
      errs.repEmail = 'Invalid email address';
    }

    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs = {};
    const emailToValidate = formData.loginEmail || formData.repEmail;
    if (!emailToValidate) {
      errs.loginEmail = t('common.required');
    } else if (!/\S+@\S+\.\S+/.test(emailToValidate)) {
      errs.loginEmail = 'Invalid email address';
    }

    if (!formData.password) {
      errs.password = t('common.required');
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      errs.password = 'Must contain uppercase and number';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeTerms) {
      errs.agreeTerms = t('common.required');
    }

    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      if (!formData.loginEmail) {
        setFormData((prev) => ({ ...prev, loginEmail: prev.repEmail }));
      }
      setCurrentStep(3);
    } else if (currentStep === 3 && validateStep3()) {
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const nameParts = formData.repFullName.trim().split(' ');
    const firstName = nameParts[0] || 'Representative';
    const lastName = nameParts.slice(1).join(' ') || 'Contact';

    try {
      const regResult = await register({
        firstName,
        lastName,
        email: formData.loginEmail || formData.repEmail,
        phone: formData.repPhone || formData.orgPhone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (regResult.success) {
        const partnerProfile = {
          organization: {
            name: formData.orgName,
            email: formData.orgEmail || formData.repEmail,
            type: formData.orgType,
            city: formData.city,
            regNumber: formData.regNumber,
            address: formData.address,
            phone: formData.orgPhone,
          },
          representative: {
            fullName: formData.repFullName,
            position: formData.repPosition,
            phone: formData.repPhone,
            email: formData.repEmail,
          },
          submittedAt: new Date().toISOString(),
          status: 'PENDING_APPROVAL',
        };
        localStorage.setItem(`partner_app_${formData.loginEmail}`, JSON.stringify(partnerProfile));

        setIsSuccess(true);
      } else {
        setErrorMsg(regResult.error || 'Failed to submit application. Please check your information.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="partner-register-page">
      {/* Top Banner Header */}
      <div className="partner-header-bar">
        <div className="partner-header-container">
          <div>
            <h1 className="partner-page-title">{t('partnerRegister.pageTitle')}</h1>
            <p className="partner-page-subtitle">
              {t('partnerRegister.pageSubtitle')}
            </p>
          </div>

          {/* Stepper Pill Indicator */}
          <div className="step-pill-indicator">
            <div className={`step-pill-item ${currentStep >= 1 ? 'active' : ''}`}>
              <span className="step-num">1</span>
              <span className="step-text">{t('partnerRegister.steps.org')}</span>
            </div>
            <div className="step-pill-line" />
            <div className={`step-pill-item ${currentStep >= 2 ? 'active' : ''}`}>
              <span className="step-num">2</span>
              <span className="step-text">{t('partnerRegister.steps.rep')}</span>
            </div>
            <div className="step-pill-line" />
            <div className={`step-pill-item ${currentStep >= 3 ? 'active' : ''}`}>
              <span className="step-num">3</span>
              <span className="step-text">{t('partnerRegister.steps.account')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="partner-body-container">
        {errorMsg && (
          <div style={{ maxWidth: 800, margin: '0 auto 20px' }}>
            <Alert type="danger" message={errorMsg} onClose={() => setErrorMsg(null)} />
          </div>
        )}

        {isSuccess ? (
          <div className="registration-success-card">
            <div className="success-icon-badge">
              <CheckCircle2 size={48} color="#059669" />
            </div>
            <h2>{t('partnerRegister.success.title')}</h2>
            <p className="success-message">
              {t('partnerRegister.success.desc')}{' '}
              <strong>{formData.loginEmail || formData.repEmail}</strong>.
            </p>
            <div className="success-info-box">
              <h4>{t('partnerRegister.success.nextTitle')}</h4>
              <ul>
                <li>{t('partnerRegister.success.next1')}</li>
                <li>{t('partnerRegister.success.next2')}</li>
                <li>{t('partnerRegister.success.next3')}</li>
              </ul>
            </div>
            <div className="success-actions">
              <Link to="/login" className="btn btn-primary btn-lg">
                {t('partnerRegister.success.proceedLogin')}
              </Link>
              <Link to="/" className="btn btn-outline btn-lg">
                {t('partnerRegister.success.returnHome')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="wizard-card-wrapper">
            {/* STEP 1: ORGANIZATION INFORMATION */}
            {currentStep === 1 && (
              <div className="wizard-step-card animate-fade">
                <div className="step-badge-counter">{t('partnerRegister.step1.counter')}</div>
                <h3 className="wizard-card-title">{t('partnerRegister.step1.title')}</h3>

                <form onSubmit={handleNext} className="wizard-form">
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label className="form-label">
                        {t('partnerRegister.step1.orgName')} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="orgName"
                        value={formData.orgName}
                        onChange={handleChange}
                        placeholder="e.g. Selam Bus"
                        className={`form-input ${stepErrors.orgName ? 'input-error' : ''}`}
                      />
                      {stepErrors.orgName && <span className="form-error-text">{stepErrors.orgName}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">{t('partnerRegister.step1.orgEmail')}</label>
                      <input
                        type="email"
                        name="orgEmail"
                        value={formData.orgEmail}
                        onChange={handleChange}
                        placeholder="e.g. info@company.com"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label className="form-label">
                        {t('partnerRegister.step1.orgType')} <span className="text-danger">*</span>
                      </label>
                      <select
                        name="orgType"
                        value={formData.orgType}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="Private Bus Company">Private Bus Company</option>
                        <option value="Public Transport Enterprise">Public Transport Enterprise</option>
                        <option value="Cross-Country Transport Association">Cross-Country Transport Association</option>
                        <option value="Tour & Travel Agency">Tour &amp; Travel Agency</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {t('partnerRegister.step1.city')} <span className="text-danger">*</span>
                      </label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="Addis Ababa">Addis Ababa</option>
                        <option value="Hawassa">Hawassa</option>
                        <option value="Bahir Dar">Bahir Dar</option>
                        <option value="Gondar">Gondar</option>
                        <option value="Dire Dawa">Dire Dawa</option>
                        <option value="Mekelle">Mekelle</option>
                        <option value="Adama (Nazret)">Adama (Nazret)</option>
                        <option value="Jimma">Jimma</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label className="form-label">
                        {t('partnerRegister.step1.regNumber')} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="regNumber"
                        value={formData.regNumber}
                        onChange={handleChange}
                        placeholder="e.g. REG-12345"
                        className={`form-input ${stepErrors.regNumber ? 'input-error' : ''}`}
                      />
                      {stepErrors.regNumber && <span className="form-error-text">{stepErrors.regNumber}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {t('partnerRegister.step1.address')} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="e.g. 123 Main Street, Addis Ababa"
                        className={`form-input ${stepErrors.address ? 'input-error' : ''}`}
                      />
                      {stepErrors.address && <span className="form-error-text">{stepErrors.address}</span>}
                    </div>
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label className="form-label">
                        {t('partnerRegister.step1.phone')} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="orgPhone"
                        value={formData.orgPhone}
                        onChange={handleChange}
                        placeholder="e.g. 09xxxxxxxx"
                        className={`form-input ${stepErrors.orgPhone ? 'input-error' : ''}`}
                      />
                      {stepErrors.orgPhone && <span className="form-error-text">{stepErrors.orgPhone}</span>}
                    </div>
                  </div>

                  <div className="wizard-actions-right">
                    <button type="submit" className="btn btn-primary btn-md">
                      {t('common.next')} <ArrowRight size={16} style={{ marginLeft: 6 }} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: AUTHORIZED REPRESENTATIVE */}
            {currentStep === 2 && (
              <div className="wizard-step-card animate-fade">
                <div className="step-badge-counter">{t('partnerRegister.step2.counter')}</div>
                <h3 className="wizard-card-title">{t('partnerRegister.step2.title')}</h3>

                <form onSubmit={handleNext} className="wizard-form">
                  <div className="form-group">
                    <label className="form-label">
                      {t('partnerRegister.step2.fullName')} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="repFullName"
                      value={formData.repFullName}
                      onChange={handleChange}
                      placeholder="e.g. Ahmed Mohammed"
                      className={`form-input ${stepErrors.repFullName ? 'input-error' : ''}`}
                    />
                    {stepErrors.repFullName && <span className="form-error-text">{stepErrors.repFullName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t('partnerRegister.step2.position')} <span className="text-danger">*</span>
                    </label>
                    <select
                      name="repPosition"
                      value={formData.repPosition}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="Operations Manager">Operations Manager</option>
                      <option value="General Manager">General Manager</option>
                      <option value="Fleet Coordinator">Fleet Coordinator</option>
                      <option value="Managing Director">Managing Director</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t('partnerRegister.step2.phone')} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="repPhone"
                      value={formData.repPhone}
                      onChange={handleChange}
                      placeholder="e.g. 09xxxxxxxx"
                      className={`form-input ${stepErrors.repPhone ? 'input-error' : ''}`}
                    />
                    {stepErrors.repPhone && <span className="form-error-text">{stepErrors.repPhone}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t('partnerRegister.step2.email')} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      name="repEmail"
                      value={formData.repEmail}
                      onChange={handleChange}
                      placeholder="e.g. ahmed@company.com"
                      className={`form-input ${stepErrors.repEmail ? 'input-error' : ''}`}
                    />
                    {stepErrors.repEmail && <span className="form-error-text">{stepErrors.repEmail}</span>}
                  </div>

                  <div className="wizard-actions-split">
                    <button type="button" onClick={handleBack} className="btn btn-outline btn-md">
                      <ArrowLeft size={16} style={{ marginRight: 6 }} /> {t('common.back')}
                    </button>
                    <button type="submit" className="btn btn-primary btn-md">
                      {t('common.next')} <ArrowRight size={16} style={{ marginLeft: 6 }} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: CREATE ACCOUNT */}
            {currentStep === 3 && (
              <div className="wizard-step-card animate-fade">
                <div className="step-badge-counter">{t('partnerRegister.step3.counter')}</div>
                <h3 className="wizard-card-title">{t('partnerRegister.step3.title')}</h3>

                <form onSubmit={handleNext} className="wizard-form">
                  <div className="form-group">
                    <label className="form-label">
                      {t('partnerRegister.step3.loginEmail')} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      name="loginEmail"
                      value={formData.loginEmail}
                      onChange={handleChange}
                      placeholder="e.g. ahmed@company.com"
                      className={`form-input ${stepErrors.loginEmail ? 'input-error' : ''}`}
                    />
                    {stepErrors.loginEmail && <span className="form-error-text">{stepErrors.loginEmail}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t('partnerRegister.step3.password')} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className={`form-input ${stepErrors.password ? 'input-error' : ''}`}
                    />
                    {stepErrors.password && <span className="form-error-text">{stepErrors.password}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t('partnerRegister.step3.confirmPassword')} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className={`form-input ${stepErrors.confirmPassword ? 'input-error' : ''}`}
                    />
                    {stepErrors.confirmPassword && <span className="form-error-text">{stepErrors.confirmPassword}</span>}
                  </div>

                  <div className="form-checkbox-row">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={handleChange}
                      />
                      <span className="checkbox-text">
                        {t('partnerRegister.step3.agreeTerms')}
                      </span>
                    </label>
                    {stepErrors.agreeTerms && <span className="form-error-text">{stepErrors.agreeTerms}</span>}
                  </div>

                  <div className="wizard-actions-split">
                    <button type="button" onClick={handleBack} className="btn btn-outline btn-md">
                      <ArrowLeft size={16} style={{ marginRight: 6 }} /> {t('common.back')}
                    </button>
                    <button type="submit" className="btn btn-primary btn-md">
                      {t('partnerRegister.step3.reviewBtn')} <ArrowRight size={16} style={{ marginLeft: 6 }} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 4: REVIEW APPLICATION */}
            {currentStep === 4 && (
              <div className="wizard-step-card animate-fade">
                <div className="step-badge-counter">{t('partnerRegister.step4.counter')}</div>
                <h3 className="wizard-card-title">{t('partnerRegister.step4.title')}</h3>

                <div className="review-summary-container">
                  {/* Organization Review Block */}
                  <div className="review-block">
                    <div className="review-block-header">
                      <Building2 size={18} color="#2563eb" />
                      <h4>{t('partnerRegister.step4.orgSection')}</h4>
                    </div>
                    <div className="review-details-list">
                      <div className="review-row">
                        <span className="review-label">Name:</span>
                        <span className="review-value">{formData.orgName}</span>
                      </div>
                      <div className="review-row">
                        <span className="review-label">Type:</span>
                        <span className="review-value">{formData.orgType}</span>
                      </div>
                      <div className="review-row">
                        <span className="review-label">License:</span>
                        <span className="review-value">{formData.regNumber}</span>
                      </div>
                      <div className="review-row">
                        <span className="review-label">Location:</span>
                        <span className="review-value">{formData.address}, {formData.city}</span>
                      </div>
                      <div className="review-row">
                        <span className="review-label">Phone:</span>
                        <span className="review-value">{formData.orgPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Representative Review Block */}
                  <div className="review-block">
                    <div className="review-block-header">
                      <UserCheck size={18} color="#2563eb" />
                      <h4>{t('partnerRegister.step4.repSection')}</h4>
                    </div>
                    <div className="review-details-list">
                      <div className="review-row">
                        <span className="review-label">Full Name:</span>
                        <span className="review-value">{formData.repFullName}</span>
                      </div>
                      <div className="review-row">
                        <span className="review-label">Position:</span>
                        <span className="review-value">{formData.repPosition}</span>
                      </div>
                      <div className="review-row">
                        <span className="review-label">Phone:</span>
                        <span className="review-value">{formData.repPhone}</span>
                      </div>
                      <div className="review-row">
                        <span className="review-label">Email:</span>
                        <span className="review-value">{formData.repEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Review Block */}
                  <div className="review-block">
                    <div className="review-block-header">
                      <KeyRound size={18} color="#2563eb" />
                      <h4>{t('partnerRegister.step4.accSection')}</h4>
                    </div>
                    <div className="review-details-list">
                      <div className="review-row">
                        <span className="review-label">Login Email:</span>
                        <span className="review-value">{formData.loginEmail || formData.repEmail}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="wizard-actions-split">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="btn btn-outline btn-md"
                    disabled={isSubmitting}
                  >
                    &larr; {t('partnerRegister.step4.editBtn')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="btn btn-partner btn-md"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('partnerRegister.step4.submitting') : t('partnerRegister.step4.submitBtn')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerRegisterPage;
