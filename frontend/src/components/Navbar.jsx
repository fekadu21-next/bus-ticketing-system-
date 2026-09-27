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
  Search,
  Building,
  Check,
  ArrowRight,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout, getDashboardPath } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [partnerPopupOpen, setPartnerPopupOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="navbar-dark">
      <div className="navbar-container">
        {/* Brand Logo with Custom Image */}
        <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
          <div className="brand-img-box">
            <img
              src="/b907ff8e-96c1-4830-b55d-6461943fc151.png"
              alt="BusTicket Logo"
              className="brand-logo-img"
              onError={(e) => {
                // Fallback to /logo.png if needed
                e.currentTarget.src = '/logo.png';
              }}
            />
          </div>
          <div className="brand-text">
            <span className="brand-title">{t('nav.brand')}</span>
            <span className="brand-subtitle">{t('nav.subtitle')}</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          <ul className="nav-links">
            <li>
              <Link
                to="/"
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
              >
                {t('nav.home')}
              </Link>
            </li>
            <li>
              <Link
                to="/search-trips"
                className={`nav-link ${isActive('/search-trips') ? 'active' : ''}`}
              >
                {t('nav.searchTrips')}
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className={`nav-link ${isActive('/about') ? 'active' : ''}`}
              >
                {t('nav.about')}
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
              >
                {t('nav.contact')}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Right Navigation Actions */}
        <div className="nav-right-actions">
          {/* Quick search icon */}
          <Link
            to="/search-trips"
            className="nav-icon-btn"
            title={t('nav.searchTrips')}
            aria-label={t('nav.searchTrips')}
          >
            <Search size={18} />
          </Link>

          {/* Theme Toggle Button (Light/Dark Mode) */}
          <button
            type="button"
            className="nav-icon-btn theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? t('nav.lightMode') : t('nav.darkMode')}
            aria-label={isDark ? t('nav.lightMode') : t('nav.darkMode')}
          >
            {isDark ? <Sun size={19} className="theme-icon sun-icon" /> : <Moon size={19} className="theme-icon moon-icon" />}
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher variant="compact" />

          {isAuthenticated ? (
            <div className="auth-user-controls">
              <Link
                to={getDashboardPath()}
                className="btn btn-primary btn-sm"
              >
                {user?.roles?.includes(ROLES.ADMIN) && <Shield size={15} style={{ marginRight: 6 }} />}
                {user?.roles?.includes(ROLES.BOOKING_COORDINATOR) && <Building2 size={15} style={{ marginRight: 6 }} />}
                {user?.roles?.includes(ROLES.TICKET_VERIFIER) && <CheckCircle size={15} style={{ marginRight: 6 }} />}
                {t('nav.dashboard')}
              </Link>

              <Link to="/profile" className="user-profile-badge" title={t('nav.profile')}>
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Profile"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginRight: 6,
                      border: '1.5px solid #93c5fd',
                    }}
                  />
                ) : (
                  <User size={16} />
                )}
                <span className="user-name-label">
                  {[user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.name || (user?.email ? user.email.split('@')[0] : 'User')}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="btn btn-outline-light btn-sm"
                title={t('nav.logout')}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="guest-nav-buttons">
              <Link to="/login" className="btn btn-outline-light btn-sm">
                {t('nav.signIn')}
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                {t('nav.createAccount')}
              </Link>

              {/* Become a Partner dropdown/button */}
              <div
                className="partner-menu-container"
                onMouseEnter={() => setPartnerPopupOpen(true)}
                onMouseLeave={() => setPartnerPopupOpen(false)}
              >
                <Link
                  to="/partner-register"
                  className="btn btn-partner btn-sm partner-nav-btn"
                  onClick={() => setPartnerPopupOpen(false)}
                >
                  <Building size={16} style={{ marginRight: 6 }} />
                  {t('nav.becomePartner')}
                </Link>

                {/* Partner hover teaser popover */}
                {partnerPopupOpen && (
                  <div className="partner-hover-popover">
                    <div className="partner-popover-header">
                      <div className="partner-popover-icon">
                        <Building size={22} color="var(--color-partner)" />
                      </div>
                      <div>
                        <h4>{t('nav.partnerPopupTitle')}</h4>
                        <p>{t('nav.partnerPopupDesc')}</p>
                      </div>
                    </div>
                    <ul className="partner-features-list">
                      {partnerFeatures.map((feat, idx) => (
                        <li key={idx}>
                          <span className="check-bullet">
                            <Check size={13} strokeWidth={3} />
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/partner-register"
                      className="btn btn-partner btn-block"
                      onClick={() => setPartnerPopupOpen(false)}
                    >
                      {t('nav.startApplication')} <ArrowRight size={16} style={{ marginLeft: 6 }} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile menu hamburger toggle button */}
          <button
            type="button"
            className="mobile-hamburger-btn"
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
          className="mobile-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Sliding Menu */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <div className="brand-logo">
            <img
              src="/b907ff8e-96c1-4830-b55d-6461943fc151.png"
              alt="BusTicket Logo"
              className="brand-logo-img"
              style={{ width: 34, height: 34, borderRadius: 8 }}
            />
            <span className="brand-title" style={{ fontSize: '1.1rem' }}>{t('nav.brand')}</span>
          </div>

          <div className="mobile-controls-row">
            <button
              type="button"
              className="nav-icon-btn theme-toggle-btn"
              onClick={toggleTheme}
              title={isDark ? t('nav.lightMode') : t('nav.darkMode')}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <LanguageSwitcher variant="compact" />
            <button
              type="button"
              className="nav-icon-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close Menu"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <ul className="mobile-nav-links">
          <li>
            <Link to="/" className={isActive('/') ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
              {t('nav.home')}
            </Link>
          </li>
          <li>
            <Link to="/search-trips" className={isActive('/search-trips') ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
              {t('nav.searchTrips')}
            </Link>
          </li>
          <li>
            <Link to="/about" className={isActive('/about') ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
              {t('nav.about')}
            </Link>
          </li>
          <li>
            <Link to="/contact" className={isActive('/contact') ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
              {t('nav.contact')}
            </Link>
          </li>

          {isAuthenticated ? (
            <li className="mobile-auth-section">
              <div className="mobile-user-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Profile"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1.5px solid #93c5fd',
                    }}
                  />
                ) : (
                  <User size={20} />
                )}
                <span style={{ fontWeight: 600 }}>
                  {[user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.name || (user?.email ? user.email.split('@')[0] : 'User')}
                </span>
              </div>
              <Link
                to={getDashboardPath()}
                className="btn btn-primary btn-block"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.dashboard')}
              </Link>
              <Link
                to="/profile"
                className="btn btn-outline-light btn-block"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.profile')}
              </Link>
              <button onClick={handleLogout} className="btn btn-danger btn-block">
                <LogOut size={16} style={{ marginRight: 6 }} />
                {t('nav.logout')}
              </button>
            </li>
          ) : (
            <li className="mobile-auth-actions">
              <Link
                to="/login"
                className="btn btn-outline-light btn-block"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.signIn')}
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-block"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.createAccount')}
              </Link>
              <Link
                to="/partner-register"
                className="btn btn-partner btn-block"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Building size={16} style={{ marginRight: 6 }} />
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
