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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('partnerRegister.pageTitle')}</h1>
            <p className="text-amber-100">
              {t('partnerRegister.pageSubtitle')}
            </p>
          </div>

          {/* Stepper Pill Indicator */}
          <div className="flex items-center justify-center gap-2 md:gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep >= 1 ? 'bg-white text-amber-600' : 'bg-white/20 text-white'}`}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span className="text-sm font-medium hidden sm:inline">{t('partnerRegister.steps.org')}</span>
            </div>
            <div className="w-8 h-0.5 bg-white/30" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep >= 2 ? 'bg-white text-amber-600' : 'bg-white/20 text-white'}`}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span className="text-sm font-medium hidden sm:inline">{t('partnerRegister.steps.rep')}</span>
            </div>
            <div className="w-8 h-0.5 bg-white/30" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep >= 3 ? 'bg-white text-amber-600' : 'bg-white/20 text-white'}`}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span className="text-sm font-medium hidden sm:inline">{t('partnerRegister.steps.account')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {errorMsg && (
          <div className="mb-6">
            <Alert variant="danger">{errorMsg}</Alert>
          </div>
        )}

        {isSuccess ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 md:p-12 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t('partnerRegister.success.title')}</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {t('partnerRegister.success.desc')}{' '}
              <strong className="text-slate-900 dark:text-white">{formData.loginEmail || formData.repEmail}</strong>.
            </p>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 mb-8 text-left">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">{t('partnerRegister.success.nextTitle')}</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{t('partnerRegister.success.next1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{t('partnerRegister.success.next2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{t('partnerRegister.success.next3')}</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors duration-200">
                {t('partnerRegister.success.proceedLogin')}
              </Link>
              <Link to="/" className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg text-base font-semibold hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                {t('partnerRegister.success.returnHome')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            {/* STEP 1: ORGANIZATION INFORMATION */}
            {currentStep === 1 && (
              <div className="animate-in fade-in duration-300">
                <div className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-semibold mb-4">{t('partnerRegister.step1.counter')}</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('partnerRegister.step1.title')}</h3>

                <form onSubmit={handleNext} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('partnerRegister.step1.orgName')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="orgName"
                        value={formData.orgName}
                        onChange={handleChange}
                        placeholder="e.g. Selam Bus"
                        className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          stepErrors.orgName 
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-slate-900 dark:text-white' 
                            : 'border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500'
                        }`}
                      />
                      {stepErrors.orgName && <span className="text-xs text-red-500">{stepErrors.orgName}</span>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('partnerRegister.step1.orgEmail')}</label>
                      <input
                        type="email"
                        name="orgEmail"
                        value={formData.orgEmail}
                        onChange={handleChange}
                        placeholder="e.g. info@company.com"
                        className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('partnerRegister.step1.orgType')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="orgType"
                        value={formData.orgType}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white appearance-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Private Bus Company">Private Bus Company</option>
                        <option value="Public Transport Enterprise">Public Transport Enterprise</option>
                        <option value="Cross-Country Transport Association">Cross-Country Transport Association</option>
                        <option value="Tour & Travel Agency">Tour &amp; Travel Agency</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('partnerRegister.step1.city')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white appearance-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('partnerRegister.step1.regNumber')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="regNumber"
                        value={formData.regNumber}
                        onChange={handleChange}
                        placeholder="e.g. REG-12345"
                        className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          stepErrors.regNumber 
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-slate-900 dark:text-white' 
                            : 'border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500'
                        }`}
                      />
                      {stepErrors.regNumber && <span className="text-xs text-red-500">{stepErrors.regNumber}</span>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('partnerRegister.step1.address')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="e.g. 123 Main Street, Addis Ababa"
                        className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          stepErrors.address 
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-slate-900 dark:text-white' 
                            : 'border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500'
                        }`}
                      />
                      {stepErrors.address && <span className="text-xs text-red-500">{stepErrors.address}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('partnerRegister.step1.phone')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="orgPhone"
                        value={formData.orgPhone}
                        onChange={handleChange}
                        placeholder="e.g. 09xxxxxxxx"
                        className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          stepErrors.orgPhone 
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-slate-900 dark:text-white' 
                            : 'border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500'
                        }`}
                      />
                      {stepErrors.orgPhone && <span className="text-xs text-red-500">{stepErrors.orgPhone}</span>}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2">
                      {t('common.next')} <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: AUTHORIZED REPRESENTATIVE */}
            {currentStep === 2 && (
              <div className="animate-in fade-in duration-300">
                <div className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-semibold mb-4">{t('partnerRegister.step2.counter')}</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('partnerRegister.step2.title')}</h3>

                <form onSubmit={handleNext} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('partnerRegister.step2.fullName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="repFullName"
                      value={formData.repFullName}
                      onChange={handleChange}
                      placeholder="e.g. Ahmed Mohammed"
                      className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        stepErrors.repFullName 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-slate-900 dark:text-white' 
                          : 'border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500'
                      }`}
                    />
                    {stepErrors.repFullName && <span className="text-xs text-red-500">{stepErrors.repFullName}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('partnerRegister.step2.position')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="repPosition"
                      value={formData.repPosition}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white appearance-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Operations Manager">Operations Manager</option>
                      <option value="General Manager">General Manager</option>
                      <option value="Fleet Coordinator">Fleet Coordinator</option>
                      <option value="Managing Director">Managing Director</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('partnerRegister.step2.phone')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="repPhone"
                      value={formData.repPhone}
                      onChange={handleChange}
                      placeholder="e.g. 09xxxxxxxx"
                      className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        stepErrors.repPhone 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-slate-900 dark:text-white' 
                          : 'border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500'
                      }`}
                    />
                    {stepErrors.repPhone && <span className="text-xs text-red-500">{stepErrors.repPhone}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('partnerRegister.step2.email')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="repEmail"
                      value={formData.repEmail}
                      onChange={handleChange}
                      placeholder="e.g. ahmed@company.com"
                      className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        stepErrors.repEmail 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-slate-900 dark:text-white' 
                          : 'border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500'
                      }`}
                    />
                    {stepErrors.repEmail && <span className="text-xs text-red-500">{stepErrors.repEmail}</span>}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <button type="button" onClick={handleBack} className="px-6 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                      <ArrowLeft size={16} /> {t('common.back')}
                    </button>
                    <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2">
                      {t('common.next')} <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: CREATE ACCOUNT */}
            {currentStep === 3 && (
              <div className="animate-in fade-in duration-300">
                <div className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-semibold mb-4">{t('partnerRegister.step3.counter')}</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('partnerRegister.step3.title')}</h3>

                <form onSubmit={handleNext} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('partnerRegister.step3.loginEmail')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="loginEmail"
                      value={formData.loginEmail}
                      onChange={handleChange}
                      placeholder="e.g. ahmed@company.com"
                      className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        stepErrors.loginEmail 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-slate-900 dark:text-white' 
                          : 'border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500'
                      }`}
                    />
                    {stepErrors.loginEmail && <span className="text-xs text-red-500">{stepErrors.loginEmail}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('partnerRegister.step3.password')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        stepErrors.password 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-slate-900 dark:text-white' 
                          : 'border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500'
                      }`}
                    />
                    {stepErrors.password && <span className="text-xs text-red-500">{stepErrors.password}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('partnerRegister.step3.confirmPassword')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        stepErrors.confirmPassword 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-slate-900 dark:text-white' 
                          : 'border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500'
                      }`}
                    />
                    {stepErrors.confirmPassword && <span className="text-xs text-red-500">{stepErrors.confirmPassword}</span>}
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm text-slate-600 dark:text-slate-400">
                      {t('partnerRegister.step3.agreeTerms')}
                    </label>
                  </div>
                  {stepErrors.agreeTerms && <span className="text-xs text-red-500 ml-7">{stepErrors.agreeTerms}</span>}

                  <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <button type="button" onClick={handleBack} className="px-6 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                      <ArrowLeft size={16} /> {t('common.back')}
                    </button>
                    <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2">
                      {t('partnerRegister.step3.reviewBtn')} <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 4: REVIEW APPLICATION */}
            {currentStep === 4 && (
              <div className="animate-in fade-in duration-300">
                <div className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-semibold mb-4">{t('partnerRegister.step4.counter')}</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('partnerRegister.step4.title')}</h3>

                <div className="space-y-6">
                  {/* Organization Review Block */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
                      <h4 className="font-semibold text-slate-900 dark:text-white">{t('partnerRegister.step4.orgSection')}</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Name:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.orgName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Type:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.orgType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">License:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.regNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Location:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.address}, {formData.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Phone:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.orgPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Representative Review Block */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <UserCheck size={18} className="text-blue-600 dark:text-blue-400" />
                      <h4 className="font-semibold text-slate-900 dark:text-white">{t('partnerRegister.step4.repSection')}</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Full Name:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.repFullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Position:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.repPosition}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Phone:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.repPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Email:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.repEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Review Block */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <KeyRound size={18} className="text-blue-600 dark:text-blue-400" />
                      <h4 className="font-semibold text-slate-900 dark:text-white">{t('partnerRegister.step4.accSection')}</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Login Email:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.loginEmail || formData.repEmail}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-between mt-8">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    disabled={isSubmitting}
                  >
                    &larr; {t('partnerRegister.step4.editBtn')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
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
