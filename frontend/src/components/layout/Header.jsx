import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import {
  Search,
  Bell,
  ShieldCheck,
  Building2,
  User,
  KeyRound,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Lock,
} from "lucide-react";

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    currentRole,
    setCurrentRole,
    selectedOrgId,
    setSelectedOrgId,
    organizations,
    globalSearchQuery,
    setGlobalSearchQuery,
    activeOrg,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const pendingApprovalsCount = organizations.filter(
    (o) => o.status === "PENDING"
  ).length;

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const handleNavigate = (path) => {
    setShowUserMenu(false);
    navigate(path);
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.name ||
    (currentRole === "ADMIN" ? "Solomon Tekle" : "Booking Coordinator");

  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || (currentRole === "ADMIN" ? "ST" : "BC");

  const userEmail = user?.email || (currentRole === "ADMIN" ? "admin@busticket.com" : "coordinator@busticket.com");

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
      <div className="header-right">
        {/* Role Badge Indicator — strict separation without cross-role navigation buttons */}
        <div
          className="header-role-indicator"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            backgroundColor: currentRole === "ADMIN" ? "rgba(239, 68, 68, 0.08)" : "rgba(37, 99, 235, 0.08)",
            border: `1px solid ${currentRole === "ADMIN" ? "#fca5a5" : "#bfdbfe"}`,
            borderRadius: "20px",
            fontSize: "0.82rem",
            fontWeight: 700,
            color: currentRole === "ADMIN" ? "#dc2626" : "#2563eb",
          }}
        >
          {currentRole === "ADMIN" ? (
            <>
              <ShieldCheck size={14} />
              <span>Platform Admin</span>
            </>
          ) : (
            <>
              <Building2 size={14} />
              <span>Booking Coordinator</span>
            </>
          )}
        </div>

        {/* Organization Scope */}
        {currentRole === "ADMIN" ? (
          /* Platform Admin gets Organization Selector Dropdown to inspect any company */
          <div className="org-selector-wrap">
            <select
              className="org-selector-select"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
            >
              <option value="ALL">All Organizations (System-wide)</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          /* Operational Manager is strictly locked to their assigned organization */
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

        {/* Bell / Notifications */}
        <div style={{ position: "relative" }}>
          <button
            className="header-icon-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
          >
            <Bell size={17} />
            {pendingApprovalsCount > 0 && (
              <span className="header-badge">{pendingApprovalsCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="dropdown-panel notif-panel">
              <div className="dropdown-header">
                <h4>Notifications</h4>
                <span
                  style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}
                  onClick={() => setShowNotifications(false)}
                >
                  Clear all
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.75rem" }}>
                {pendingApprovalsCount > 0 ? (
                  <div className="notif-item notif-warning">
                    <div style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                      Pending Approvals ({pendingApprovalsCount})
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Operators awaiting registration review.
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "0.5rem 0" }}>
                    No unread platform alerts.
                  </div>
                )}
                <div className="notif-item">
                  <strong style={{ display: "block", fontSize: "0.78rem" }}>Payment Log</strong>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                    Telebirr TEL-98231999 pending.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User profile */}
        <div style={{ position: "relative" }}>
          <div
            className="user-profile-btn"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
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
              <button className="dropdown-btn" onClick={() => handleNavigate("/profile")}>
                <User size={14} /> Profile & Account
              </button>
              <button className="dropdown-btn" onClick={() => handleNavigate("/change-password")}>
                <KeyRound size={14} /> Change Password
              </button>
              <button className="dropdown-btn danger-btn" onClick={handleLogout}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
