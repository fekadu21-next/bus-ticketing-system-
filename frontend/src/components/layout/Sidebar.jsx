import React from "react";
import { useApp } from "../../context/AppContext";
import {
  LayoutDashboard,
  Building2,
  Users,
  MapPin,
  Bus,
  Route as RouteIcon,
  CalendarDays,
  Grid3X3,
  Ticket,
  CreditCard,
  QrCode,
  BarChart3,
  FileSpreadsheet,
  Settings,
  UserCheck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import logoImg from "../../assets/logo.png";

export const Sidebar = () => {
  const {
    currentRole,
    activePage,
    setActivePage,
    organizations,
    activeOrg,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    toggleSidebar,
  } = useApp();

  const pendingApprovalsCount = organizations.filter(
    (o) => o.status === "PENDING"
  ).length;

  const adminNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "organizations",
      label: "Organizations",
      icon: Building2,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
    },
    { id: "users", label: "Users", icon: Users },
    { id: "stations", label: "Stations", icon: MapPin },
    { id: "buses", label: "Buses", icon: Bus },
    { id: "routes", label: "Routes", icon: RouteIcon },
    { id: "trips", label: "Trips", icon: CalendarDays },
    { id: "bookings", label: "Bookings", icon: Ticket },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "tickets", label: "Tickets & QR", icon: QrCode },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "audit", label: "Audit Logs", icon: FileSpreadsheet },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const managerNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "buses", label: "Fleet & Buses", icon: Bus },
    { id: "routes", label: "Routes", icon: RouteIcon },
    { id: "trips", label: "Trips", icon: CalendarDays },
    { id: "seats", label: "Seats", icon: Grid3X3 },
    { id: "bookings", label: "Bookings", icon: Ticket },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "drivers", label: "Drivers", icon: UserCheck },
    { id: "verifiers", label: "Verifiers", icon: QrCode },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const navItems = currentRole === "ADMIN" ? adminNavItems : managerNavItems;

  const handleNavClick = (id) => {
    setActivePage(id);
    // Auto-close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }
  };

  return (
    <aside className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div
          onClick={() => handleNavClick("dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            overflow: "hidden",
            cursor: "pointer",
            flex: 1,
          }}
          title="Go to Dashboard"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleNavClick("dashboard");
          }}
        >
          <img
            src={logoImg}
            alt="InterCityBus Logo"
            className="brand-logo-img"
          />
          {!isSidebarCollapsed && (
            <div className="brand-text">
              <h2>InterCityBus</h2>
              <span>Ticket & Management</span>
            </div>
          )}
        </div>

        {/* Desktop collapse button */}
        <button
          className="sidebar-toggle-btn desktop-toggle"
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? "Expand" : "Collapse"}
          aria-label={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>

        {/* Mobile close button */}
        <button
          className="sidebar-toggle-btn mobile-close-btn"
          onClick={() => setIsSidebarCollapsed(true)}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {!isSidebarCollapsed && (
          <div className="nav-group-title">
            {currentRole === "ADMIN" ? "ADMIN" : "BOOKING COORDINATOR"}
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => handleNavClick(item.id)}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <div className="nav-link-content">
                <Icon size={isSidebarCollapsed ? 20 : 17} />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </div>
              {item.badge && (
                <span className={isSidebarCollapsed ? "badge-dot" : "badge-count"}>
                  {isSidebarCollapsed ? "" : item.badge}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="role-scope-badge">
          <div className="role-title">
            <ShieldCheck size={16} />
            {!isSidebarCollapsed && (
              <span>
                {currentRole === "ADMIN" ? "Admin" : "Booking Coordinator"}
              </span>
            )}
          </div>
          {!isSidebarCollapsed && (
            <div className="scope-name">
              {currentRole === "ADMIN"
                ? "All Organizations"
                : `🔒 ${activeOrg?.name || "Selam Bus Line"}`}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
