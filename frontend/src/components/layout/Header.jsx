import React from "react";
import { useApp } from "../../context/AppContext";
import {
  Search,
  Bell,
  ShieldCheck,
  Building2,
  UserCheck,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export const Header = () => {
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
    toggleSidebar,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const pendingApprovalsCount = organizations.filter(
    (o) => o.status === "PENDING"
  ).length;

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

        {/* Desktop toggle + search */}
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
        {/* Role Switcher – hidden on small mobile */}
        <div className="mode-switcher header-role-switcher">
          <button
            className={currentRole === "ADMIN" ? "active" : ""}
            onClick={() => setCurrentRole("ADMIN")}
          >
            <ShieldCheck size={14} />
            <span className="role-label">Admin</span>
          </button>
          <button
            className={currentRole === "MANAGER" ? "active" : ""}
            onClick={() => setCurrentRole("MANAGER")}
          >
            <Building2 size={14} />
            <span className="role-label">Manager</span>
          </button>
        </div>

        {/* Org selector – only for Manager */}
        {currentRole === "MANAGER" && (
          <div className="org-selector-wrap">
            <select
              className="org-selector-select"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
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
            <div className="avatar">
              {currentRole === "ADMIN" ? "ST" : "DH"}
            </div>
            <div className="user-info desktop-only">
              <h4>{currentRole === "ADMIN" ? "Solomon Tekle" : "Dawit Haile"}</h4>
              <span>
                {currentRole === "ADMIN"
                  ? "Platform Admin"
                  : `${activeOrg?.name || "Selam Bus"} (Manager)`}
              </span>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" className="desktop-only" />
          </div>

          {showUserMenu && (
            <div className="dropdown-panel user-panel">
              <div style={{ padding: "0.65rem 1rem", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                  {currentRole === "ADMIN" ? "Solomon Tekle" : "Dawit Haile"}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {currentRole === "ADMIN" ? "admin@platform.gov.et" : "ops@selambus.et"}
                </div>
              </div>
              <button className="dropdown-btn">
                <UserCheck size={14} /> Profile & Security
              </button>
              <button className="dropdown-btn danger-btn">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
