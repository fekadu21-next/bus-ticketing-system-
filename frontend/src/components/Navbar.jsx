import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { formatUserFullName, isUserAdmin, isUserOperator, isUserPassenger } from '@/utils/userUtils';
import {
  User,
  LogOut,
  Shield,
  Building2,
  Building,
  Check,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Ticket,
  Globe,
} from 'lucide-react';
import { PlatformFeedbackModal } from '@/components/feedback/PlatformFeedbackModal';

// ── Telegram-style theme toggle ──────────────────────────────────────────────
const ThemeToggle = ({ isDark, toggleTheme }) => (
  <button
    type="button"
    onClick={toggleTheme}
    aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    className="relative inline-flex items-center w-[46px] h-[26px] rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0"
    style={{
      background: isDark
        ? 'linear-gradient(135deg,#2563eb,#1d4ed8)'
        : 'rgba(148,163,184,0.35)',
      border: isDark ? '1.5px solid #3b82f6' : '1.5px solid #cbd5e1',
    }}
  >
    <span
      className="absolute left-[5px] text-[10px] select-none pointer-events-none transition-opacity duration-200"
      style={{ opacity: isDark ? 1 : 0 }}
    >
      🌙
    </span>
    <span
      className="absolute right-[5px] text-[10px] select-none pointer-events-none transition-opacity duration-200"
      style={{ opacity: isDark ? 0 : 1 }}
    >
      ☀️
    </span>
    <span
      className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-md transition-all duration-300"
      style={{ left: isDark ? '23px' : '3px' }}
    />
  </button>
);

// ── Compact language dropdown ────────────────────────────────────────────────


const LangDropdown = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const isAmharic =
    i18n.language === 'am' || i18n.language?.startsWith('am');

  const current = isAmharic ? 'አማርኛ' : 'ENGLISH';

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    if (open) document.addEventListener('mousedown', handler);

    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-bold"
        aria-label="Language"
      >
        <span>{current}</span>

        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''
            }`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-[140px] rounded-xl shadow-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 py-1 z-50">
          {[
            { code: 'en', label: 'ENGLISH' },
            { code: 'am', label: 'አማርኛ' },
          ].map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                i18n.changeLanguage(lang.code);
                setOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2 text-sm font-semibold transition-colors ${i18n.language === lang.code
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isOperator, isPassenger } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [partnerPopupOpen, setPartnerPopupOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [platformFeedbackOpen, setPlatformFeedbackOpen] = useState(false);

  const userIsAdmin = isUserAdmin(user);
  const userIsOperator = isUserOperator(user);
  const userIsPassenger = isUserPassenger(user);

  // Close mobile drawer and user dropdown whenever location changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#user-menu-container')) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const partnerFeatures = [
    t('home.partnerSection.f1', 'Fleet Management Tools'),
    t('home.partnerSection.f2', 'Real-Time Booking Sync'),
    t('home.partnerSection.f3', 'Automated Seat Allocation'),
    t('home.partnerSection.f4', 'Instant Digital Payouts'),
    t('home.partnerSection.f5', 'Dedicated 24/7 Support'),
  ];

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-50 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[100px] flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link
          to="/"
          className="flex items-center text-decoration-none group"
          onClick={() => setMobileMenuOpen(false)}
        >
          <img
            src="/logo.png"
            alt="BusTicket"
            className="h-20 w-auto object-contain group-hover:scale-105 transition-transform duration-200 flex-shrink-0"
          />
        </Link>

        {/* Desktop Navigation Links with Pink-Red Hover & Underline */}
        <nav className="hidden lg:flex items-center h-full" aria-label="Main Navigation">
          <ul className="flex items-center gap-2 h-full">
            <li className="h-full flex items-center">
              <Link
                to="/"
                className={`relative px-4 py-2.5 text-[16px] font-semibold transition-all duration-300 group flex items-center gap-1.5 ${isActive('/')
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
              >
                {t('nav.home', 'Home')}
                <span
                  className={`absolute bottom-[-2px] left-3 right-3 h-[2.5px] rounded-full transition-all duration-300 ${isActive('/')
                    ? 'bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.45)] scale-x-100'
                    : 'bg-blue-400 scale-x-0 group-hover:scale-x-100 opacity-90'
                    }`}
                />
              </Link>
            </li>
            <li className="h-full flex items-center">
              <Link
                to="/search-trips"
                className={`relative px-4 py-2.5 text-[16px] font-semibold transition-all duration-300 group flex items-center gap-1.5 ${isActive('/search-trips')
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
              >
                {t('nav.searchTrips', 'Search Trips')}
                <span
                  className={`absolute bottom-[-2px] left-3 right-3 h-[2.5px] rounded-full transition-all duration-300 ${isActive('/search-trips')
                    ? 'bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.45)] scale-x-100'
                    : 'bg-blue-400 scale-x-0 group-hover:scale-x-100 opacity-90'
                    }`}
                />
              </Link>
            </li>


            <li className="h-full flex items-center">
              <Link
                to="/about"
                className={`relative px-4 py-2.5 text-[16px] font-semibold transition-all duration-300 group flex items-center gap-1.5 ${isActive('/about')
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
              >
                {t('nav.about', 'About')}
                <span
                  className={`absolute bottom-[-2px] left-3 right-3 h-[2.5px] rounded-full transition-all duration-300 ${isActive('/about')
                    ? 'bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.45)] scale-x-100'
                    : 'bg-blue-400 scale-x-0 group-hover:scale-x-100 opacity-90'
                    }`}
                />
              </Link>
            </li>
            <li className="h-full flex items-center">
              <Link
                to="/contact"
                className={`relative px-4 py-2.5 text-[16px] font-semibold transition-all duration-300 group flex items-center gap-1.5 ${isActive('/contact')
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
              >
                {t('nav.contact', 'Contact')}
                <span
                  className={`absolute bottom-[-2px] left-3 right-3 h-[2.5px] rounded-full transition-all duration-300 ${isActive('/contact')
                    ? 'bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.45)] scale-x-100'
                    : 'bg-blue-400 scale-x-0 group-hover:scale-x-100 opacity-90'
                    }`}
                />
              </Link>
            </li>
          </ul>
        </nav>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-2.5">
          {/* Telegram-style Theme Toggle */}
          <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />

          {/* Language Dropdown */}
          <LangDropdown />

          {isAuthenticated ? (
            <div className="flex items-center gap-2">

              {userIsAdmin && (
                <Link
                  to="/admin"
                  className="hidden md:flex px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm"
                >
                  <Shield size={14} />
                  Platform Admin
                </Link>
              )}

              {userIsOperator && (
                <Link
                  to="/operator"
                  className="hidden md:flex px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/80 border border-amber-200/80 dark:border-amber-800/60 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm"
                >
                  <Building2 size={14} />
                  Operator Console
                </Link>
              )}

              {/* User Dropdown Trigger */}
              <div className="relative" id="user-menu-container">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 transition-all duration-200 shadow-sm cursor-pointer"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Profile"
                      className="w-7 h-7 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-black text-xs">
                      {(formatUserFullName(user, 'U') || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight max-w-[130px] truncate">
                      {formatUserFullName(user, 'Valued User')}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider leading-none mt-0.5">
                      {userIsAdmin ? 'Administrator' : userIsOperator ? 'Operator' : 'Passenger'}
                    </span>
                  </div>

                  <ChevronDown
                    size={14}
                    className={`text-slate-400 dark:text-slate-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {/* Dropdown Menu Popup */}
                {userDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl shadow-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 py-2 text-slate-800 dark:text-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header */}
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Signed in as</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                        {formatUserFullName(user, user?.email || 'User')}
                      </div>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {userIsAdmin ? 'Administrator' : userIsOperator ? 'Bus Operator' : 'Passenger Account'}
                      </span>
                    </div>


                    {userIsAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <Shield size={16} />
                        Admin Dashboard
                      </Link>
                    )}

                    {userIsOperator && (
                      <Link
                        to="/operator"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <Building2 size={16} />
                        Operator Dashboard
                      </Link>
                    )}

                    {userIsPassenger && (
                      <Link
                        to="/my-bookings"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <Ticket size={16} />
                        My Bookings
                      </Link>
                    )}

                    <Link
                      to={userIsAdmin ? "/admin/profile" : userIsOperator ? "/operator/profile" : "/profile"}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <User size={16} />
                      My Profile
                    </Link>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* High Contrast, Professional Login Button */}
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 transition-all duration-200 shadow-sm"
              >
                {t('nav.signIn', 'Sign In')}
              </Link>

              {/* Prominent Register Button */}
              <Link
                to="/register"
                className="hidden sm:inline-flex px-3.5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200"
              >
                {t('nav.createAccount', 'Register')}
              </Link>

              {/* Become a Partner Button */}
              <div
                className="hidden md:block relative group"
                onMouseEnter={() => setPartnerPopupOpen(true)}
                onMouseLeave={() => setPartnerPopupOpen(false)}
              >
                <Link
                  to="/partner-register"
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all duration-200 flex items-center gap-1.5"
                  onClick={() => setPartnerPopupOpen(false)}
                >
                  <Building size={15} />
                  <span>{t('nav.becomePartner', 'Partner')}</span>
                </Link>

                {/* Partner hover teaser popover */}
                {partnerPopupOpen && (
                  <div className="absolute top-full right-0 mt-2 w-72 p-4 rounded-2xl shadow-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white z-50 animate-in fade-in duration-150">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Building size={20} className="text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {t('nav.partnerPopupTitle', 'Become a Partner')}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {t('nav.partnerPopupDesc', 'Register your bus company or transport association.')}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-1.5 mb-4 text-xs">
                      {partnerFeatures.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <span className="text-emerald-500 flex-shrink-0">
                            <Check size={13} strokeWidth={3} />
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/partner-register"
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold hover:from-amber-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm"
                      onClick={() => setPartnerPopupOpen(false)}
                    >
                      {t('nav.startApplication', 'Start Application')} <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Mobile menu hamburger toggle button */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-xl transition-colors duration-200 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay Backdrop & Sliding Menu (Only in DOM when open) */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1200] animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div
            className="fixed top-0 right-0 w-[85vw] max-w-[340px] h-screen bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 z-[1250] p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 ease-out"
          >
            <div>
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center">
                  <img
                    src="/logo.png"
                    alt="BusTicket"
                    className="h-16 w-auto object-contain"
                  />
                </div>

                <button
                  type="button"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close Menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Links */}
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/"
                    className={`block px-3.5 py-2.5 rounded-xl text-[15.5px] font-semibold transition-colors ${isActive('/')
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-l-4 border-blue-600 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 hover:bg-blue-50/30'
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.home', 'Home')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/search-trips"
                    className={`block px-3.5 py-2.5 rounded-xl text-[15.5px] font-semibold transition-colors ${isActive('/search-trips')
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-l-4 border-blue-600 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 hover:bg-blue-50/30'
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.searchTrips', 'Search Trips')}
                  </Link>
                </li>
                {isAuthenticated && userIsPassenger && (
                  <li>
                    <Link
                      to="/my-bookings"
                      className={`block px-3.5 py-2.5 rounded-xl text-[15.5px] font-semibold transition-colors flex items-center gap-2 ${isActive('/my-bookings')
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-l-4 border-blue-600 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 hover:bg-blue-50/30'
                        }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Ticket size={16} />
                      My Bookings
                    </Link>
                  </li>
                )}
                <li>
                  <Link
                    to="/about"
                    className={`block px-3.5 py-2.5 rounded-xl text-[15.5px] font-semibold transition-colors ${isActive('/about')
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-l-4 border-blue-600 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 hover:bg-blue-50/30'
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.about', 'About')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className={`block px-3.5 py-2.5 rounded-xl text-[15.5px] font-semibold transition-colors ${isActive('/contact')
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-l-4 border-blue-600 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:text-blue-600 hover:bg-blue-50/30'
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.contact', 'Contact')}
                  </Link>
                </li>

                {isAuthenticated ? (
                  <li className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Profile"
                          className="w-8 h-8 rounded-full object-cover border-2 border-blue-500"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                          {(formatUserFullName(user, 'U') || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {formatUserFullName(user, 'User')}
                        </span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase">
                          {userIsAdmin ? 'Administrator' : userIsOperator ? 'Operator' : 'Passenger'}
                        </span>
                      </div>
                    </div>

                    {userIsAdmin && (
                      <Link
                        to="/admin"
                        className="block w-full py-2.5 px-3 rounded-xl text-xs font-bold text-center bg-indigo-600 text-white hover:bg-indigo-700"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Admin Console
                      </Link>
                    )}
                    {userIsOperator && (
                      <Link
                        to="/operator"
                        className="block w-full py-2.5 px-3 rounded-xl text-xs font-bold text-center bg-amber-600 text-white hover:bg-amber-700"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Operator Dashboard
                      </Link>
                    )}
                    <Link
                      to={userIsAdmin ? "/admin/profile" : userIsOperator ? "/operator/profile" : "/profile"}
                      className="block w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-center bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5"
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </li>
                ) : (
                  <li className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <Link
                      to="/login"
                      className="block w-full py-2.5 px-3 rounded-xl text-xs font-bold text-center border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.signIn', 'Sign In')}
                    </Link>
                    <Link
                      to="/register"
                      className="block w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center shadow-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.createAccount', 'Register')}
                    </Link>
                    <Link
                      to="/partner-register"
                      className="block w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.becomePartner', 'Become a Partner')}
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Mobile Menu Footer Controls */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Theme & Language</span>
              <div className="flex items-center gap-2">
                <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
                <LangDropdown />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Platform Feedback Modal */}
      <PlatformFeedbackModal
        isOpen={platformFeedbackOpen}
        onClose={() => setPlatformFeedbackOpen(false)}
      />
    </header>
  );
};

export default Navbar;
