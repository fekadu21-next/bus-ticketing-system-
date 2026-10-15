import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  CheckCheck,
} from "lucide-react";

import logoImg from "../../assets/logo.png";

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    currentRole,
    activePage,
    setActivePage,
    organizations,
    activeOrg,
    selectedOrgId,
    buses,
    trips,
    bookings,
    payments = [],
    users = [],
    auditLogs = [],
    settings = {},
    adminStats = null,
    coordinatorStats = null,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    toggleSidebar,
  } = useApp();



  // Notification seen state persisted per role in localStorage
  const storageKey = `dashboard_seen_badges_${currentRole || "CONSOLE"}`;
  const [seenBadges, setSeenBadges] = React.useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const markItemAsSeen = (itemId) => {
    setSeenBadges((prev) => {
      const updated = { ...prev, [itemId]: true };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save seen badges:", err);
      }
      return updated;
    });
  };

  const resetAllBadges = (e) => {
    e?.stopPropagation();
    const allSeen = {
      organizations: true,
      users: true,
      buses: true,
      routes: true,
      trips: true,
      bookings: true,
      payments: true,
      tickets: true,
      reports: true,
      audit: true,
      drivers: true,
      verifiers: true,
    };
    setSeenBadges(allSeen);
    try {
      localStorage.setItem(storageKey, JSON.stringify(allSeen));
    } catch (err) {
      console.error(err);
    }
  };

  // Raw counts of items requiring operational attention
  const pendingApprovalsCount = organizations.filter(
    (o) => o.status === "PENDING"
  ).length;

  const pendingBookingsCount = bookings.filter(
    (bk) => (bk.organizationId === selectedOrgId || currentRole === "ADMIN") && bk.status === "PENDING"
  ).length;

  const todayStr = new Date().toISOString().split("T")[0];
  const newTripsCount = trips.filter(
    (t) => (t.organizationId === selectedOrgId || currentRole === "ADMIN") && (t.departureDate === todayStr || t.status === "DRAFT")
  ).length;

  const pendingPaymentsCount = payments.filter(
    (p) => (p.organizationId === selectedOrgId || currentRole === "ADMIN") && p.status === "PENDING"
  ).length;

  const adminNavGroups = [
    {
      group: "Overview & Access",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        {
          id: "organizations",
          label: "Organizations",
          icon: Building2,
          badge: !seenBadges.organizations && pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
          badgeType: "warning",
        },
        {
          id: "users",
          label: "Users & Roles",
          icon: Users,
          badge: !seenBadges.users && users.filter((u) => !u.isActive).length > 0 ? users.filter((u) => !u.isActive).length : null,
          badgeType: "primary",
        },
      ],
    },
    {
      group: "Transit Infrastructure",
      items: [
        { id: "stations", label: "Stations", icon: MapPin },
        { id: "buses", label: "Fleet Buses", icon: Bus },
        { id: "routes", label: "Routes", icon: RouteIcon },
        {
          id: "trips",
          label: "Trips & Schedules",
          icon: CalendarDays,
          badge: !seenBadges.trips && newTripsCount > 0 ? newTripsCount : null,
          badgeType: "primary",
        },
      ],
    },
    {
      group: "Ticketing & Finance",
      items: [
        {
          id: "bookings",
          label: "Bookings",
          icon: Ticket,
          badge: !seenBadges.bookings && pendingBookingsCount > 0 ? pendingBookingsCount : null,
          badgeType: "warning",
        },
        {
          id: "payments",
          label: "Payments",
          icon: CreditCard,
          badge: !seenBadges.payments && pendingPaymentsCount > 0 ? pendingPaymentsCount : null,
          badgeType: "primary",
        },
        { id: "tickets", label: "Tickets & QR", icon: QrCode },
      ],
    },
    {
      group: "Governance & System",
      items: [
        { id: "reports", label: "Reports", icon: BarChart3 },
        {
          id: "audit",
          label: "Audit Logs",
          icon: FileSpreadsheet,
          badge: !seenBadges.audit && auditLogs.length > 0 ? Math.min(auditLogs.length, 5) : null,
          badgeType: "primary",
        },
        { id: "settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  const managerNavGroups = [
    {
      group: "Core Operations",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      group: "Fleet & Scheduling",
      items: [
        { id: "buses", label: "Fleet & Buses", icon: Bus },
        { id: "routes", label: "Routes & Corridors", icon: RouteIcon },
        {
          id: "trips",
          label: "Trips & Schedules",
          icon: CalendarDays,
          badge: !seenBadges.trips && newTripsCount > 0 ? newTripsCount : null,
          badgeType: "primary",
        },
        { id: "seats", label: "Seat Allocations", icon: Grid3X3 },
      ],
    },
    {
      group: "Bookings & Revenue",
      items: [
        {
          id: "bookings",
          label: "Bookings",
          icon: Ticket,
          badge: !seenBadges.bookings && pendingBookingsCount > 0 ? pendingBookingsCount : null,
          badgeType: "warning",
        },
        {
          id: "payments",
          label: "Payments & Revenue",
          icon: CreditCard,
          badge: !seenBadges.payments && pendingPaymentsCount > 0 ? pendingPaymentsCount : null,
          badgeType: "primary",
        },
      ],
    },
    {
      group: "Personnel & Verification",
      items: [
        { id: "drivers", label: "Drivers", icon: UserCheck },
        { id: "verifiers", label: "Ticket Verifiers", icon: QrCode },
      ],
    },
    {
      group: "Analytics & Settings",
      items: [
        { id: "reports", label: "Reports & KPIs", icon: BarChart3 },
        { id: "settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  const navGroups = currentRole === "ADMIN" ? adminNavGroups : managerNavGroups;

  // Total active unread badge count across all groups
  const totalActiveBadges = navGroups.reduce(
    (acc, group) => acc + group.items.filter((item) => Boolean(item.badge)).length,
    0
  );

  const handleNavClick = (id) => {
    markItemAsSeen(id);
    setActivePage(id);
    const basePath = currentRole === "ADMIN" ? "/admin" : "/operator";
    const targetUrl = id === "dashboard" ? basePath : `${basePath}/${id}`;
    if (location.pathname !== targetUrl) {
      navigate(targetUrl);
    }
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
              <span>
                {currentRole === "ADMIN"
                  ? "Platform Admin Console"
                  : `${activeOrg?.name || "Operator"} Portal`}
              </span>
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
        {totalActiveBadges > 0 && !isSidebarCollapsed && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.4rem 0.75rem",
              marginBottom: "0.6rem",
              background: "rgba(59, 130, 246, 0.12)",
              borderRadius: "6px",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              fontSize: "0.72rem",
              color: "#93c5fd",
            }}
          >
            <span>🔔 {totalActiveBadges} new alert{totalActiveBadges > 1 ? "s" : ""}</span>
            <button
              onClick={resetAllBadges}
              style={{
                background: "transparent",
                border: "none",
                color: "#60a5fa",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.7rem",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                padding: "2px 4px",
              }}
              title="Clear all notification badges"
            >
              <CheckCheck size={13} /> Clear all
            </button>
          </div>
        )}

        {navGroups.map((group, gIdx) => (
          <div key={group.group || gIdx} style={{ marginBottom: "0.5rem" }}>
            {!isSidebarCollapsed && (
              <div className="nav-group-title">{group.group}</div>
            )}

            {group.items.map((item) => {
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
                    <span
                      className={
                        isSidebarCollapsed
                          ? "badge-dot"
                          : `badge-count ${item.badgeType ? `badge-${item.badgeType}` : ""}`
                      }
                    >
                      {isSidebarCollapsed ? "" : item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>



      {/* Footer */}
      <div className="sidebar-footer">
        <div className="role-scope-badge">
          <div className="role-title">
            <ShieldCheck size={16} />
            {!isSidebarCollapsed && (
              <span>
                {currentRole === "ADMIN" ? "Platform Admin" : "Bus Operator"}
              </span>
            )}
          </div>
          {!isSidebarCollapsed && (
            <div className="scope-name">
              {currentRole === "ADMIN"
                ? (selectedOrgId && selectedOrgId !== "ALL"
                    ? `🏢 ${organizations.find((o) => o.id === selectedOrgId)?.name || "All Organizations"}`
                    : "🌐 System-Wide Scope")
                : `🏢 ${activeOrg?.name || "Assigned Organization"}`}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
