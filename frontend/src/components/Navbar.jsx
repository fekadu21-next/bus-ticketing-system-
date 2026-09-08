import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Bus, User, LogOut, Shield, Building2, CheckCircle } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
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
          <Bus size={28} color="#2563eb" />
          <span>Intercity Bus Lines</span>
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
                    Dashboard
                  </Link>
                </li>

                {user?.roles?.includes('PLATFORM_ADMIN') && (
                  <li>
                    <Link
                      to="/admin"
                      className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Shield size={16} /> Admin
                    </Link>
                  </li>
                )}

                {(user?.roles?.includes('OPERATIONAL_MANAGER') || user?.roles?.includes('PLATFORM_ADMIN')) && (
                  <li>
                    <Link
                      to="/operations"
                      className={`nav-link ${isActive('/operations') ? 'active' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Building2 size={16} /> Operations
                    </Link>
                  </li>
                )}

                {(user?.roles?.includes('TICKET_VERIFIER') || user?.roles?.includes('PLATFORM_ADMIN')) && (
                  <li>
                    <Link
                      to="/verify-ticket"
                      className={`nav-link ${isActive('/verify-ticket') ? 'active' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <CheckCircle size={16} /> Verify Pass
                    </Link>
                  </li>
                )}

                <li className="nav-user-menu">
                  <Link
                    to="/profile"
                    className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <User size={16} />
                    <span>{user?.firstName}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    title="Sign out of account"
                  >
                    <LogOut size={15} /> Logout
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
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                    Create Account
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
