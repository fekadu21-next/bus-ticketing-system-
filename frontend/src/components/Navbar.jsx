import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
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
  Sun,
  Moon,
  Bus,
  ChevronDown,
  Ticket,
  Bell,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isOperator, isPassenger } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [partnerPopupOpen, setPartnerPopupOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[80px] flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 text-decoration-none group"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md shadow-blue-600/25 group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
            <Bus size={22} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {t('nav.brand', 'BusTicket')}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide mt-1">
              {t('nav.subtitle', 'Smart Journey')}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links with Pink-Red Hover & Underline */}
        <nav className="hidden lg:flex items-center h-full" aria-label="Main Navigation">
          <ul className="flex items-center gap-2 h-full">
            <li className="h-full flex items-center">
              <Link
                to="/"
                className={`relative px-4 py-2.5 text-[16px] font-semibold transition-all duration-300 group flex items-center gap-1.5 ${
                  isActive('/')
                    ? 'text-[#f43f5e] font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:text-[#f43f5e] dark:hover:text-[#fb7185]'
                }`}
              >
                {t('nav.home', 'Home')}
                <span
                  className={`absolute bottom-[-2px] left-3 right-3 h-[2.5px] rounded-full transition-all duration-300 ${
                    isActive('/')
                      ? 'bg-[#f43f5e] shadow-[0_2px_8px_rgba(244,63,94,0.45)] scale-x-100'
                      : 'bg-[#fb7185] scale-x-0 group-hover:scale-x-100 opacity-90'
                  }`}
                />
              </Link>
            </li>
            <li className="h-full flex items-center">
              <Link
                to="/search-trips"
                className={`relative px-4 py-2.5 text-[16px] font-semibold transition-all duration-300 group flex items-center gap-1.5 ${
                  isActive('/search-trips')
                    ? 'text-[#f43f5e] font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:text-[#f43f5e] dark:hover:text-[#fb7185]'
                }`}
              >
                {t('nav.searchTrips', 'Search Trips')}
                <span
                  className={`absolute bottom-[-2px] left-3 right-3 h-[2.5px] rounded-full transition-all duration-300 ${
                    isActive('/search-trips')
                      ? 'bg-[#f43f5e] shadow-[0_2px_8px_rgba(244,63,94,0.45)] scale-x-100'
                      : 'bg-[#fb7185] scale-x-0 group-hover:scale-x-100 opacity-90'
                  }`}
                />
              </Link>
            </li>

            {isAuthenticated && userIsPassenger && (
              <li className="h-full flex items-center">
                <Link
                  to="/my-bookings"
                  className={`relative px-4 py-2.5 text-[16px] font-semibold transition-all duration-300 group flex items-center gap-1.5 ${
                    isActive('/my-bookings')
                      ? 'text-[#f43f5e] font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:text-[#f43f5e] dark:hover:text-[#fb7185]'
                  }`}
                >
                  <Ticket size={16} />
                  My Bookings
                  <span
                    className={`absolute bottom-[-2px] left-3 right-3 h-[2.5px] rounded-full transition-all duration-300 ${
                      isActive('/my-bookings')
                        ? 'bg-[#f43f5e] shadow-[0_2px_8px_rgba(244,63,94,0.45)] scale-x-100'
                        : 'bg-[#fb7185] scale-x-0 group-hover:scale-x-100 opacity-90'
                    }`}
                  />
                </Link>
              </li>
            )}

            <li className="h-full flex items-center">
              <Link
                to="/about"
                className={`relative px-4 py-2.5 text-[16px] font-semibold transition-all duration-300 group flex items-center gap-1.5 ${
                  isActive('/about')
                    ? 'text-[#f43f5e] font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:text-[#f43f5e] dark:hover:text-[#fb7185]'
                }`}
              >
                {t('nav.about', 'About')}
                <span
                  className={`absolute bottom-[-2px] left-3 right-3 h-[2.5px] rounded-full transition-all duration-300 ${
                    isActive('/about')
                      ? 'bg-[#f43f5e] shadow-[0_2px_8px_rgba(244,63,94,0.45)] scale-x-100'
                      : 'bg-[#fb7185] scale-x-0 group-hover:scale-x-100 opacity-90'
                  }`}
                />
              </Link>
            </li>
            <li className="h-full flex items-center">
              <Link
                to="/contact"
                className={`relative px-4 py-2.5 text-[16px] font-semibold transition-all duration-300 group flex items-center gap-1.5 ${
                  isActive('/contact')
                    ? 'text-[#f43f5e] font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:text-[#f43f5e] dark:hover:text-[#fb7185]'
                }`}
              >
                {t('nav.contact', 'Contact')}
                <span
                  className={`absolute bottom-[-2px] left-3 right-3 h-[2.5px] rounded-full transition-all duration-300 ${
                    isActive('/contact')
                      ? 'bg-[#f43f5e] shadow-[0_2px_8px_rgba(244,63,94,0.45)] scale-x-100'
                      : 'bg-[#fb7185] scale-x-0 group-hover:scale-x-100 opacity-90'
                  }`}
                />
              </Link>
            </li>
          </ul>
        </nav>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <button
            type="button"
            className="p-2 rounded-xl transition-colors duration-200 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            onClick={toggleTheme}
            title={isDark ? t('nav.lightMode', 'Light Mode') : t('nav.darkMode', 'Dark Mode')}
            aria-label={isDark ? t('nav.lightMode', 'Light Mode') : t('nav.darkMode', 'Dark Mode')}
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher variant="compact" />

          {isAuthenticated ? (
            <div className="hidden lg:flex items-center gap-2.5">
              
              {/* Quick Action Pill for Current Role */}
              {userIsPassenger && (
                <Link
                  to="/my-bookings"
                  className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/80 border border-blue-200/80 dark:border-blue-800/60 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm"
                >
                  <Ticket size={14} />
                  My Bookings
                </Link>
              )}

              
              {userIsAdmin && (
                <Link
                  to="/admin"
                  className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm"
                >
                  <Shield size={14} />
                  Platform Admin
                </Link>
              )}

              {userIsOperator && (
                <Link
                  to="/operator"
                  className="px-3.5 py-2 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/80 border border-amber-200/80 dark:border-amber-800/60 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm"
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

                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight max-w-[130px] truncate">
                      {formatUserFullName(user, 'Valued User')}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider leading-none mt-0.5">
                      {userIsAdmin ? 'Administrator' : userIsOperator ? 'Operator' : 'Passenger'}
                    </span>
                  </div>

                  <ChevronDown
                    size={14}
                    className={`text-slate-400 dark:text-slate-400 transition-transform duration-200 ${
                      userDropdownOpen ? 'rotate-180' : ''
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
                      to="/notifications"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Bell size={16} />
                      Notifications
                    </Link>

                    <Link
                      to={userIsAdmin ? "/admin/profile" : userIsOperator ? "/operator/profile" : "/profile"}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <User size={16} />
                      My Profile
                    </Link>

                    {/* Theme Preference Toggle with Sun/Moon */}
                    <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-2">
                        {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
                        Appearance
                      </span>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="px-2.5 py-1 text-xs rounded-lg font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                      >
                        {isDark ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} />}
                        {isDark ? 'Light' : 'Dark'}
                      </button>
                    </div>

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
            <div className="hidden lg:flex items-center gap-2.5">
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
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200"
              >
                {t('nav.createAccount', 'Register')}
              </Link>

              {/* Become a Partner Button */}
              <div
                className="relative group"
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
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
                    <Bus size={16} className="text-white" />
                  </div>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {t('nav.brand', 'BusTicket')}
                  </span>
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
                    className={`block px-3.5 py-2.5 rounded-xl text-[15.5px] font-semibold transition-colors ${
                      isActive('/')
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-[#f43f5e] border-l-4 border-[#f43f5e] font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:text-[#f43f5e] hover:bg-rose-50/30'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.home', 'Home')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/search-trips"
                    className={`block px-3.5 py-2.5 rounded-xl text-[15.5px] font-semibold transition-colors ${
                      isActive('/search-trips')
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-[#f43f5e] border-l-4 border-[#f43f5e] font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:text-[#f43f5e] hover:bg-rose-50/30'
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
                      className={`block px-3.5 py-2.5 rounded-xl text-[15.5px] font-semibold transition-colors flex items-center gap-2 ${
                        isActive('/my-bookings')
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-[#f43f5e] border-l-4 border-[#f43f5e] font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:text-[#f43f5e] hover:bg-rose-50/30'
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
                    className={`block px-3.5 py-2.5 rounded-xl text-[15.5px] font-semibold transition-colors ${
                      isActive('/about')
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-[#f43f5e] border-l-4 border-[#f43f5e] font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:text-[#f43f5e] hover:bg-rose-50/30'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.about', 'About')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className={`block px-3.5 py-2.5 rounded-xl text-[15.5px] font-semibold transition-colors ${
                      isActive('/contact')
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-[#f43f5e] border-l-4 border-[#f43f5e] font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:text-[#f43f5e] hover:bg-rose-50/30'
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
                      to="/notifications"
                      className="block w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-center bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Notifications
                    </Link>
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
                <button
                  type="button"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  onClick={toggleTheme}
                >
                  {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
                </button>
                <LanguageSwitcher variant="compact" />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
