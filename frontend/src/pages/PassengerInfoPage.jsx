import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, User, Mail, Phone, MapPin, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { registerApi, loginApi } from '@/api/auth.api';
import { formatUserFullName } from '@/utils/userUtils';

// Simple ETB formatter
const formatEtb = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ETB';
  return `${amount.toLocaleString()} ETB`;
};

export const PassengerInfoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, register } = useAuth();
  const tripData = location.state?.tripData || {};
  const selectedSeats = location.state?.selectedSeats || [];

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    pickupLocation: '',
    dropoffLocation: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [createAccount, setCreateAccount] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Auto-fill form if user is logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [isAuthenticated, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.pickupLocation.trim()) newErrors.pickupLocation = 'Pickup location is required';
    if (!formData.dropoffLocation.trim()) newErrors.dropoffLocation = 'Dropoff location is required';

    // Password validation if creating account
    if (createAccount && !isAuthenticated) {
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const cleanFirstName = formData.firstName.trim();
    const cleanLastName = formData.lastName.trim();
    const cleanFullName = formatUserFullName({
      firstName: cleanFirstName,
      lastName: cleanLastName,
    }, 'Passenger');

    const cleanPassengerInfo = {
      ...formData,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      fullName: cleanFullName,
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
    };

    // If user wants to create account, register and auto-login first
    if (createAccount && !isAuthenticated) {
      setIsRegistering(true);
      try {
        const registerData = {
          firstName: cleanFirstName,
          lastName: cleanLastName,
          email: cleanPassengerInfo.email,
          phone: cleanPassengerInfo.phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword || formData.password,
        };

        const result = await register(registerData);
        if (result.success) {
          // Successfully registered and auto-logged in via AuthContext!
          navigate('/payment', {
            state: {
              tripData,
              selectedSeats,
              passengerInfo: cleanPassengerInfo,
              newlyRegistered: true,
            },
          });
        } else {
          setErrors((prev) => ({
            ...prev,
            email: result.error || 'Registration failed. Please check your information.',
          }));
        }
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          email: err.response?.data?.message || err.message || 'Registration failed. Please try again.',
        }));
      } finally {
        setIsRegistering(false);
      }
    } else {
      // Either already logged in or continuing as guest
      navigate('/payment', {
        state: {
          tripData,
          selectedSeats,
          passengerInfo: cleanPassengerInfo,
          newlyRegistered: false,
        },
      });
    }
  };


  const totalPrice = tripData.price * selectedSeats.length;

  return (
    <div className="bg-[#f4f7fb] dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 pb-12 transition-colors">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/crops/detail_banner.jpg" alt="" className="w-full h-full object-cover object-[75%_center]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071833]/88 via-[#0b2a4a]/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-6 pt-8 pb-16">
          <Link to={`/trips/${tripData.id}`} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/90 hover:text-white">
            <ArrowLeft size={14} />
            Back to Trip Details
          </Link>
          <h1 className="mt-3 text-[28px] sm:text-[40px] font-black text-white tracking-tight">Passenger Information</h1>
          <p className="mt-1 text-[13px] text-white/80">Please fill in your details to complete the booking.</p>
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 -mt-8 space-y-4 relative z-20">
        <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-4 sm:p-5 transition-colors">
          <h2 className="text-[18px] font-extrabold text-slate-900 dark:text-white mb-4">Trip Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-[#2563eb] mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-slate-900 dark:text-white">{tripData.from}</p>
                <p className="text-[11px] text-slate-400">Departure</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-[#2563eb] mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-slate-900 dark:text-white">{tripData.to}</p>
                <p className="text-[11px] text-slate-400">Destination</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle size={16} className="text-[#2563eb] mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-slate-900 dark:text-white">Seats: {selectedSeats.join(', ')}</p>
                <p className="text-[11px] text-slate-400">Selected</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <p className="text-[14px] text-slate-600 dark:text-slate-400">Total Price</p>
            <p className="text-[22px] sm:text-[24px] font-black text-slate-900 dark:text-white">{formatEtb(totalPrice)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-4 sm:p-5 transition-colors">
          <h2 className="text-[18px] font-extrabold text-slate-900 dark:text-white mb-5">Personal Information</h2>

          {/* Login status indicator */}
          {isAuthenticated ? (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/60 rounded-xl flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-[12px] text-green-800 dark:text-green-300">
                Logged in as <strong>{user?.email}</strong> ({formatUserFullName(user, 'Passenger')}). Your information has been auto-filled.
              </p>
            </div>
          ) : (
            <div className="mb-4 p-3.5 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-start gap-3">
              <User size={18} className="text-[#2563eb] dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-bold text-blue-900 dark:text-blue-200">
                  Booking as Guest Passenger
                </p>
                <p className="text-[12px] text-blue-700 dark:text-blue-300 mt-0.5 leading-relaxed">
                  Fill in your travel details below. <strong>Tip:</strong> Click the <strong>"Create an account"</strong> checkbox below to track your booking recommendations, receive trip updates, and easily manage your digital boarding passes!
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">First Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 ${errors.firstName ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                  />
                </div>
                {errors.firstName && <p className="text-[11px] text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Last Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 ${errors.lastName ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                  />
                </div>
                {errors.lastName && <p className="text-[11px] text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 ${errors.email ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 ${errors.phone ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                  />
                </div>
                {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Pickup Location *</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={handleChange}
                    placeholder="Enter pickup location"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 ${errors.pickupLocation ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                  />
                </div>
                {errors.pickupLocation && <p className="text-[11px] text-red-500 mt-1">{errors.pickupLocation}</p>}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Dropoff Location *</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="dropoffLocation"
                    value={formData.dropoffLocation}
                    onChange={handleChange}
                    placeholder="Enter dropoff location"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 ${errors.dropoffLocation ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                  />
                </div>
                {errors.dropoffLocation && <p className="text-[11px] text-red-500 mt-1">{errors.dropoffLocation}</p>}
              </div>
            </div>

            {/* Create Account Section - Only for non-logged-in users */}
            {!isAuthenticated && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 bg-blue-50/40 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100/80 dark:border-blue-900/40">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createAccount}
                    onChange={(e) => setCreateAccount(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 dark:border-slate-600 text-[#2563eb] focus:ring-[#2563eb]"
                  />
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 block">
                      Click to create an account & track booking recommendations
                    </span>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Check this box and choose a password to save your tickets, unlock personalized journey recommendations, and manage trips anytime.
                    </span>
                  </div>
                </label>

                {createAccount && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password *</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create password (min 6 characters)"
                          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 ${errors.password ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                        />
                      </div>
                      {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password}</p>}
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password *</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm password"
                          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 ${errors.confirmPassword ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                        />
                      </div>
                      {errors.confirmPassword && <p className="text-[11px] text-red-500 mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={isRegistering}
                className="flex-1 h-11 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-slate-400 text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isRegistering ? 'Creating Account...' : 'Continue to Payment'}
                {!isRegistering && <ArrowRight size={15} />}
              </button>
              <Link
                to={`/trips/${tripData.id}`}
                className="h-11 px-6 rounded-full border border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center justify-center transition-all"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PassengerInfoPage;
