import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { formatUserFullName } from "../../utils/userUtils";
import {
  Search,
  Building2,
  User,
  KeyRound,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Lock,
  Globe,
  Sun,
  Moon,
} from "lucide-react";

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    currentRole,
    selectedOrgId,
    setSelectedOrgId,
    organizations,
    globalSearchQuery,
    setGlobalSearchQuery,
    activeOrg,
    setActivePage,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const { isDark, toggleTheme } = useTheme();
  const { i18n } = useTranslation();
  const isAmharic = i18n.language === "am" || i18n.language?.startsWith("am");

  const toggleLanguage = () => {
    const nextLang = isAmharic ? "en" : "am";
    i18n.changeLanguage(nextLang);
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    const basePath = currentRole === "ADMIN" ? "/admin" : "/operator";
    if (setActivePage) setActivePage("profile");
    navigate(`${basePath}/profile`);
  };

  const handleChangePasswordClick = () => {
    setShowUserMenu(false);
    const basePath = currentRole === "ADMIN" ? "/admin" : "/operator";
    if (setActivePage) setActivePage("change-password");
    navigate(`${basePath}/change-password`);
  };

  const displayName = formatUserFullName(
    user,
    currentRole === "ADMIN" ? "System Admin" : "Booking Coordinator"
  );

  const userInitials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || (currentRole === "ADMIN" ? "SA" : "BC");

  const userEmail = user?.email || "";

  return (
    <header className="top-header">
      {/* Left: Mobile hamburger + Desktop search */}
      <div className="header-left">
        {/* Mobile hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          aria-label="Toggle menu"
        >
          {!isSidebarCollapsed ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Desktop search */}
        <div className="header-search desktop-search">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search trips, bookings, tickets..."
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
          />
        </div>

        {/* Mobile search icon */}
        <button
          className="mobile-search-btn"
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          aria-label="Search"
        >
          <Search size={18} />
        </button>
      </div>

      {/* Mobile search bar expanded */}
      {showMobileSearch && (
        <div className="mobile-search-bar">
          <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search..."
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      )}

      {/* Right actions */}
      <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Organization Scope Selector */}
        {currentRole === "ADMIN" ? (
          <div className="org-selector-wrap" style={{ maxWidth: "230px" }}>
            <select
              className="org-selector-select"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              style={{ fontSize: "0.82rem", padding: "5px 10px" }}
              title="Filter platform view by operator"
            >
              <option value="ALL">🏢 All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div
            className="org-locked-badge"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              backgroundColor: "rgba(37, 99, 235, 0.08)",
              border: "1px solid var(--color-primary-border, #bfdbfe)",
              borderRadius: "20px",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--primary, #2563eb)",
            }}
            title="Operational scope is locked to your assigned organization"
          >
            <Lock size={13} />
            <span>{activeOrg?.name || "Assigned Organization"}</span>
          </div>
        )}

        {/* Language Switcher */}
        <button
          className="dashboard-lang-btn"
          onClick={toggleLanguage}
          title={isAmharic ? "Switch to English" : "ወደ አማርኛ ቀይር"}
          aria-label="Toggle language"
        >
          <Globe size={15} />
          <span>{isAmharic ? "EN" : "አማ"}</span>
        </button>

        {/* Theme Toggle (Dark / Light) */}
        <button
          className="header-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={16} style={{ color: "#fbbf24" }} /> : <Moon size={16} />}
        </button>

        {/* User profile dropdown */}
        <div style={{ position: "relative" }}>
          <div
            className="user-profile-btn"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
            }}
          >
            <div className="avatar">{userInitials}</div>
            <div className="user-info desktop-only">
              <h4>{displayName}</h4>
              <span>
                {currentRole === "ADMIN"
                  ? "Platform Admin"
                  : `${activeOrg?.name || "Company"} Booking Coordinator`}
              </span>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" className="desktop-only" />
          </div>

          {showUserMenu && (
            <div className="dropdown-panel user-panel">
              <div style={{ padding: "0.65rem 1rem", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{displayName}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{userEmail}</div>
              </div>

              {/* Theme Preference Quick Switch */}
              <div style={{ padding: "0.55rem 1rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                  {isDark ? <Sun size={14} style={{ color: "#fbbf24" }} /> : <Moon size={14} />} Theme
                </span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-main)",
                    color: "var(--text-main)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {isDark ? <Sun size={15} style={{ color: "#fbbf24" }} /> : <Moon size={15} />}
                </button>
              </div>

              {/* Language Preference Quick Switch */}
              <div style={{ padding: "0.55rem 1rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Globe size={14} /> Language
                </span>
                <button
                  type="button"
                  onClick={toggleLanguage}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-main)",
                    color: "var(--text-main)",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                  }}
                >
                  {isAmharic ? "English" : "አማርኛ"}
                </button>
              </div>

              <div
                className="dropdown-item"
                onClick={handleProfileClick}
              >
                <User size={15} />
                <span>My Profile</span>
              </div>
              <div
                className="dropdown-item"
                onClick={handleChangePasswordClick}
              >
                <KeyRound size={15} />
                <span>Change Password</span>
              </div>
              <div
                className="dropdown-item text-danger"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
