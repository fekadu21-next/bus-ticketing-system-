import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { Bus, User, LogOut, Shield, Building2, CheckCircle } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="brand-logo">
          <Bus size={26} color="var(--color-primary)" />
          <span>{t('nav.brand')}</span>
        </Link>

        <nav>
          <ul className="nav-links">
            {isAuthenticated ? (
              <>
                <li>
                  <Link
                    to="/dashboard"
                    className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  >
                    {t('nav.dashboard')}
                  </Link>
                </li>

                {user?.roles?.includes(ROLES.PLATFORM_ADMIN) && (
                  <li>
                    <Link
                      to="/admin"
                      className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                    >
                      <Shield size={16} /> {t('nav.admin')}
                    </Link>
                  </li>
                )}

                {(user?.roles?.includes(ROLES.OPERATIONAL_MANAGER) || user?.roles?.includes(ROLES.PLATFORM_ADMIN)) && (
                  <li>
                    <Link
                      to="/operations"
                      className={`nav-link ${isActive('/operations') ? 'active' : ''}`}
                    >
                      <Building2 size={16} /> {t('nav.operations')}
                    </Link>
                  </li>
                )}

                {(user?.roles?.includes(ROLES.TICKET_VERIFIER) || user?.roles?.includes(ROLES.PLATFORM_ADMIN)) && (
                  <li>
                    <Link
                      to="/verify-ticket"
                      className={`nav-link ${isActive('/verify-ticket') ? 'active' : ''}`}
                    >
                      <CheckCircle size={16} /> {t('nav.verifyPass')}
                    </Link>
                  </li>
                )}

                <li className="nav-user-menu">
                  <Link
                    to="/profile"
                    className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                  >
                    <User size={16} />
                    <span>{user?.firstName}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary btn-sm"
                    title={t('nav.logout')}
                  >
                    <LogOut size={14} /> {t('nav.logout')}
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/login"
                    className={`nav-link ${isActive('/login') ? 'active' : ''}`}
                  >
                    {t('nav.signIn')}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    {t('nav.createAccount')}
                  </Link>
                </li>
              </>
            )}

            <li>
              <LanguageSwitcher variant="compact" />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
