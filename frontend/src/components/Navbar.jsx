import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ROLES } from '@/constants/roles';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import {
  User,
  LogOut,
  Shield,
  Building2,
  CheckCircle,
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
} from 'lucide-react';
export const Navbar = () => {
  const { user, isAuthenticated, logout, getDashboardPath } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [partnerPopupOpen, setPartnerPopupOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Close mobile drawer whenever location changes
  useEffect(() => {
    setMobileMenuOpen(false);
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

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const partnerFeatures = [
    t('home.partnerSection.f1'),
    t('home.partnerSection.f2'),
    t('home.partnerSection.f3'),
    t('home.partnerSection.f4'),
    t('home.partnerSection.f5'),
    t('home.partnerSection.f6'),
    t('home.partnerSection.f7'),
  ];

  return (
    <header className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b sticky top-0 z-50 shadow-sm`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 text-decoration-none" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
            <Bus size={22} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 dark:text-white">{t('nav.brand')}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('nav.subtitle')}</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center" aria-label="Main Navigation">
          <ul className="flex items-center gap-1">
            <li>
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive('/') ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              >
                {t('nav.home')}
              </Link>
            </li>
            <li>
              <Link
                to="/search-trips"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive('/search-trips') ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              >
                {t('nav.searchTrips')}
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive('/about') ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              >
                {t('nav.about')}
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive('/contact') ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              >
                {t('nav.contact')}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={`p-2 rounded-lg transition-colors duration-200 ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            onClick={toggleTheme}
            title={isDark ? t('nav.lightMode') : t('nav.darkMode')}
            aria-label={isDark ? t('nav.lightMode') : t('nav.darkMode')}
          >
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher variant="compact" />

          {isAuthenticated ? (
            <div className="hidden lg:flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Profile"
                      className="w-6 h-6 rounded-full object-cover border-2 border-blue-400"
                    />
                  ) : (
                    <User size={16} className="text-slate-600 dark:text-slate-400" />
                  )}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {[user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.name || (user?.email ? user.email.split('@')[0] : 'User')}
                  </span>
                  <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <div className={`absolute top-full right-0 mt-2 w-48 rounded-xl shadow-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} py-2`}>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <User size={16} />
                      My Profile
                    </Link>
                    <Link
                      to="/my-bookings"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Ticket size={16} />
                      My Bookings
                    </Link>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-3">
              <Link to="/login" className={`text-sm font-medium transition-colors duration-200 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                {t('nav.signIn')}
              </Link>
              <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200">
                {t('nav.createAccount')}
              </Link>

              {/* Become a Partner dropdown/button */}
              <div
                className="relative group"
                onMouseEnter={() => setPartnerPopupOpen(true)}
                onMouseLeave={() => setPartnerPopupOpen(false)}
              >
                <Link
                  to="/partner-register"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-200 flex items-center gap-2"
                  onClick={() => setPartnerPopupOpen(false)}
                >
                  <Building size={16} />
                  {t('nav.becomePartner')}
                </Link>

                {/* Partner hover teaser popover */}
                {partnerPopupOpen && (
                  <div className={`absolute top-full right-0 mt-2 w-72 p-4 rounded-xl shadow-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Building size={22} className="text-white" />
                      </div>
                      <div>
                        <h4 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('nav.partnerPopupTitle')}</h4>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('nav.partnerPopupDesc')}</p>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {partnerFeatures.map((feat, idx) => (
                        <li key={idx} className={`flex items-start gap-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <span className="text-green-500 mt-0.5">
                            <Check size={13} strokeWidth={3} />
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/partner-register"
                      className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center gap-2"
                      onClick={() => setPartnerPopupOpen(false)}
                    >
                      {t('nav.startApplication')} <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile menu hamburger toggle button */}
          <button
            type="button"
            className={`lg:hidden p-2 rounded-lg transition-colors duration-200 ${isDark ? 'text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[1200] animate-in fade-in duration-250"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Sliding Menu */}
      <div className={`fixed top-0 right-0 w-[85vw] max-w-[360px] h-screen bg-slate-900 shadow-2xl border-l border-white/12 z-[1250] p-6 flex flex-col overflow-y-auto transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Bus size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">{t('nav.brand')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`p-2 rounded-lg transition-colors duration-200 ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              onClick={toggleTheme}
              title={isDark ? t('nav.lightMode') : t('nav.darkMode')}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <LanguageSwitcher variant="compact" />
            <button
              type="button"
              className={`p-2 rounded-lg transition-colors duration-200 ${isDark ? 'text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close Menu"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <ul className="space-y-1">
          <li>
            <Link to="/" className={`block px-4 py-3 rounded-lg text-base font-semibold transition-colors duration-200 ${isActive('/') ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} onClick={() => setMobileMenuOpen(false)}>
              {t('nav.home')}
            </Link>
          </li>
          <li>
            <Link to="/search-trips" className={`block px-4 py-3 rounded-lg text-base font-semibold transition-colors duration-200 ${isActive('/search-trips') ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} onClick={() => setMobileMenuOpen(false)}>
              {t('nav.searchTrips')}
            </Link>
          </li>
          <li>
            <Link to="/about" className={`block px-4 py-3 rounded-lg text-base font-semibold transition-colors duration-200 ${isActive('/about') ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} onClick={() => setMobileMenuOpen(false)}>
              {t('nav.about')}
            </Link>
          </li>
          <li>
            <Link to="/contact" className={`block px-4 py-3 rounded-lg text-base font-semibold transition-colors duration-200 ${isActive('/contact') ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`} onClick={() => setMobileMenuOpen(false)}>
              {t('nav.contact')}
            </Link>
          </li>

          {isAuthenticated ? (
            <li className="pt-4 mt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/8 rounded-lg">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-blue-400"
                  />
                ) : (
                  <User size={20} className="text-slate-300" />
                )}
                <span className="font-semibold text-white">
                  {[user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.name || (user?.email ? user.email.split('@')[0] : 'User')}
                </span>
              </div>
              <Link
                to="/profile"
                className="block w-full px-4 py-3 rounded-lg text-base font-semibold transition-colors duration-200 text-center bg-white/8 text-white hover:bg-white/15"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Profile
              </Link>
              <Link
                to="/my-bookings"
                className="block w-full px-4 py-3 rounded-lg text-base font-semibold transition-colors duration-200 text-center bg-white/8 text-white hover:bg-white/15"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Bookings
              </Link>
              <button onClick={handleLogout} className="block w-full px-4 py-3 bg-red-600 text-white rounded-lg text-base font-semibold hover:bg-red-700 transition-colors duration-200 text-center flex items-center justify-center gap-2">
                <LogOut size={16} />
                Logout
              </button>
            </li>
          ) : (
            <li className="pt-4 mt-4 border-t border-white/10 space-y-2">
              <Link
                to="/login"
                className={`block w-full px-4 py-3 rounded-lg text-base font-semibold transition-colors duration-200 text-center ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.signIn')}
              </Link>
              <Link
                to="/register"
                className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors duration-200 text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.createAccount')}
              </Link>
              <Link
                to="/partner-register"
                className="block w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-base font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-200 text-center flex items-center justify-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Building size={16} />
                {t('nav.becomePartner')}
              </Link>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
};

export default Navbar;
