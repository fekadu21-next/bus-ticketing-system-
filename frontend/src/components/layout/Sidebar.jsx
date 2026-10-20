import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  Bell,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

import logoImg from "../../assets/logo.png";

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    currentRole,
    activePage,
    setActivePage,
    organizations = [],
    activeOrg,
    selectedOrgId,
    buses = [],
    trips = [],
    bookings = [],
    payments = [],
    users = [],
    verifications = [],
    auditLogs = [],
    settings = {},
    adminStats = null,
    coordinatorStats = null,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    toggleSidebar,
  } = useApp();

  const { t } = useTranslation();

  // Notification Drawer Modal State
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [notifCategoryFilter, setNotifCategoryFilter] = useState("ALL"); // ALL | ORG | TRIP | SECURITY

  // Persistent read state for notifications
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      const saved = localStorage.getItem("platform_read_notifications");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Calculate real notifications based on active system data
  const dynamicNotifications = useMemo(() => {
    const list = [];

    // 1. Organization events: Pending or newly added organizations
    organizations.forEach((org) => {
      const isPending = org.status === "PENDING";
      list.push({
        id: `notif-org-${org.id}`,
        category: "ORG",
        title: isPending ? "New Organization Registration" : "Organization Profile Active",
        message: isPending
          ? `Transport operator "${org.name}" registered and is awaiting administrative approval.`
          : `Operator "${org.name}" is verified and active on the platform.`,
        timestamp: org.createdAt || "Recently",
        targetPage: "organizations",
        icon: Building2,
        color: isPending ? "#f59e0b" : "#10b981",
        badge: isPending ? "Pending Approval" : "Verified",
        actionText: "Review Organization",
      });
    });

    // 2. Trip events: Newly created or scheduled trips
    trips.forEach((trip) => {
      list.push({
        id: `notif-trip-${trip.id}`,
        category: "TRIP",
        title: "New Trip Created & Scheduled",
        message: `Trip "${trip.tripCode || 'TRIP'}" scheduled on route "${trip.routeName || 'Intercity'}" by ${trip.organizationName || 'Operator'}.`,
        timestamp: trip.departureDate ? `${trip.departureDate} at ${trip.departureTime || '06:00 AM'}` : "Scheduled",
        targetPage: "trips",
        icon: CalendarDays,
        color: "#2563eb",
        badge: trip.status || "PUBLISHED",
        actionText: "Inspect Trip",
      });
    });

    // 3. Security & Ticket QR Scan events
    verifications
      .filter((v) => v.status === "ALREADY_USED" || v.status === "INVALID")
      .forEach((v) => {
        const isDuplicate = v.status === "ALREADY_USED";
        list.push({
          id: `notif-vrf-${v.id}`,
          category: "SECURITY",
          title: isDuplicate ? "Duplicate QR Scan Flagged" : "Invalid Ticket Scan Rejected",
          message: `Boarding attempt rejected for ticket #${v.ticketNumber} at terminal "${v.stationName || 'Autobus Terra'}".`,
          timestamp: v.scannedAt || "Recently",
          targetPage: "tickets",
          icon: ShieldCheck,
          color: "#ef4444",
          badge: isDuplicate ? "Duplicate Scan" : "Security Alert",
          actionText: "View QR Log",
        });
      });

    return list;
  }, [organizations, trips, verifications]);

  // Compute unread count
  const unreadNotifCount = useMemo(() => {
    return dynamicNotifications.filter((n) => !readNotifIds[n.id]).length;
  }, [dynamicNotifications, readNotifIds]);

  const markNotificationAsRead = (id) => {
    setReadNotifIds((prev) => {
      const updated = { ...prev, [id]: true };
      try {
        localStorage.setItem("platform_read_notifications", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save read notification:", err);
      }
      return updated;
    });
  };

  const markAllNotificationsAsRead = () => {
    const all = {};
    dynamicNotifications.forEach((n) => {
      all[n.id] = true;
    });
    setReadNotifIds(all);
    try {
      localStorage.setItem("platform_read_notifications", JSON.stringify(all));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (notifCategoryFilter === "ALL") return dynamicNotifications;
    return dynamicNotifications.filter((n) => n.category === notifCategoryFilter);
  }, [dynamicNotifications, notifCategoryFilter]);

  // Notification seen state persisted per role in localStorage
  const storageKey = `dashboard_seen_badges_${currentRole || "CONSOLE"}`;
  const [seenBadges, setSeenBadges] = useState(() => {
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
      notifications: true,
    };
    setSeenBadges(allSeen);
    markAllNotificationsAsRead();
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
      group: t("sidebar.overview", "Overview & Access"),
      items: [
        { id: "dashboard", label: t("sidebar.overviewItem", "Overview"), icon: LayoutDashboard },
        {
          id: "notifications",
          label: t("sidebar.notifications", "Notifications"),
          icon: Bell,
          badge: unreadNotifCount > 0 ? unreadNotifCount : null,
          badgeType: "warning",
          isNotificationTrigger: true,
        },
        {
          id: "organizations",
          label: t("sidebar.organizations", "Organizations"),
          icon: Building2,
          badge: !seenBadges.organizations && pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
          badgeType: "warning",
        },
        {
          id: "users",
          label: t("sidebar.users", "Users & Roles"),
          icon: Users,
          badge: !seenBadges.users && users.filter((u) => !u.isActive).length > 0 ? users.filter((u) => !u.isActive).length : null,
          badgeType: "primary",
        },
      ],
    },
    {
      group: t("sidebar.transit", "Transit Infrastructure"),
      items: [
        { id: "stations", label: t("sidebar.stations", "Stations"), icon: MapPin },
        { id: "buses", label: t("sidebar.buses", "Fleet Buses"), icon: Bus },
        { id: "routes", label: t("sidebar.routes", "Routes & Corridors"), icon: RouteIcon },
        {
          id: "trips",
          label: t("sidebar.trips", "Trips & Schedules"),
          icon: CalendarDays,
          badge: !seenBadges.trips && newTripsCount > 0 ? newTripsCount : null,
          badgeType: "primary",
        },
      ],
    },
    {
      group: t("sidebar.ticketing", "Ticketing & Finance"),
      items: [
        {
          id: "bookings",
          label: t("sidebar.bookings", "Bookings"),
          icon: Ticket,
          badge: !seenBadges.bookings && pendingBookingsCount > 0 ? pendingBookingsCount : null,
          badgeType: "warning",
        },
        {
          id: "payments",
          label: t("sidebar.payments", "Payments & Revenue"),
          icon: CreditCard,
          badge: !seenBadges.payments && pendingPaymentsCount > 0 ? pendingPaymentsCount : null,
          badgeType: "primary",
        },
        { id: "tickets", label: t("sidebar.tickets", "Tickets & QR"), icon: QrCode },
      ],
    },
    {
      group: t("sidebar.governance", "Governance & System"),
      items: [
        { id: "reports", label: t("sidebar.reports", "Reports & KPIs"), icon: BarChart3 },
        {
          id: "audit",
          label: t("sidebar.audit", "Audit Logs"),
          icon: FileSpreadsheet,
          badge: !seenBadges.audit && auditLogs.length > 0 ? Math.min(auditLogs.length, 5) : null,
          badgeType: "primary",
        },
        { id: "settings", label: t("sidebar.settings", "Settings"), icon: Settings },
      ],
    },
  ];

  const managerNavGroups = [
    {
      group: t("sidebar.coreOperations", "Core Operations"),
      items: [
        { id: "dashboard", label: t("sidebar.overviewItem", "Overview"), icon: LayoutDashboard },
        {
          id: "notifications",
          label: t("sidebar.notifications", "Notifications"),
          icon: Bell,
          badge: unreadNotifCount > 0 ? unreadNotifCount : null,
          badgeType: "warning",
          isNotificationTrigger: true,
        },
      ],
    },
    {
      group: t("sidebar.fleetScheduling", "Fleet & Scheduling"),
      items: [
        { id: "buses", label: t("sidebar.buses", "Fleet & Buses"), icon: Bus },
        { id: "routes", label: t("sidebar.routes", "Routes & Corridors"), icon: RouteIcon },
        {
          id: "trips",
          label: t("sidebar.trips", "Trips & Schedules"),
          icon: CalendarDays,
          badge: !seenBadges.trips && newTripsCount > 0 ? newTripsCount : null,
          badgeType: "primary",
        },
        { id: "seats", label: t("sidebar.seats", "Seat Allocations"), icon: Grid3X3 },
      ],
    },
    {
      group: t("sidebar.bookingsRevenue", "Bookings & Revenue"),
      items: [
        {
          id: "bookings",
          label: t("sidebar.bookings", "Bookings"),
          icon: Ticket,
          badge: !seenBadges.bookings && pendingBookingsCount > 0 ? pendingBookingsCount : null,
          badgeType: "warning",
        },
        {
          id: "payments",
          label: t("sidebar.payments", "Payments & Revenue"),
          icon: CreditCard,
          badge: !seenBadges.payments && pendingPaymentsCount > 0 ? pendingPaymentsCount : null,
          badgeType: "primary",
        },
      ],
    },
    {
      group: t("sidebar.personnel", "Personnel & Verification"),
      items: [
        { id: "drivers", label: t("sidebar.drivers", "Drivers"), icon: UserCheck },
        { id: "verifiers", label: t("sidebar.verifiers", "Ticket Verifiers"), icon: QrCode },
      ],
    },
    {
      group: t("sidebar.analytics", "Analytics & Settings"),
      items: [
        { id: "reports", label: t("sidebar.reports", "Reports & KPIs"), icon: BarChart3 },
        { id: "settings", label: t("sidebar.settings", "Settings"), icon: Settings },
      ],
    },
  ];

  const navGroups = currentRole === "ADMIN" ? adminNavGroups : managerNavGroups;

  // Total active unread badge count across all groups
  const totalActiveBadges = navGroups.reduce(
    (acc, group) => acc + group.items.filter((item) => Boolean(item.badge)).length,
    0
  );

  const handleNavClick = (item) => {
    if (item.isNotificationTrigger || item.id === "notifications") {
      setShowNotificationsDrawer(true);
      return;
    }

    markItemAsSeen(item.id);
    setActivePage(item.id);
    const basePath = currentRole === "ADMIN" ? "/admin" : "/operator";
    const targetUrl = item.id === "dashboard" ? basePath : `${basePath}/${item.id}`;
    if (location.pathname !== targetUrl) {
      navigate(targetUrl);
    }
    // Auto-close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }
  };

  const handleNotificationAction = (notif) => {
    markNotificationAsRead(notif.id);
    setShowNotificationsDrawer(false);
    if (notif.targetPage) {
      setActivePage(notif.targetPage);
      const basePath = currentRole === "ADMIN" ? "/admin" : "/operator";
      const targetUrl = `${basePath}/${notif.targetPage}`;
      navigate(targetUrl);
    }
  };

  return (
    <>
      <aside className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div
            onClick={() => handleNavClick({ id: "dashboard" })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              overflow: "hidden",
              cursor: "pointer",
              flex: 1,
            }}
            title="Go to Overview"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleNavClick({ id: "dashboard" });
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
            <div className="sidebar-alert-strip">
              <span>🔔 {totalActiveBadges} active alert{totalActiveBadges > 1 ? "s" : ""}</span>
              <button
                onClick={resetAllBadges}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  padding: "2px 4px",
                  opacity: 0.9,
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
                    onClick={() => handleNavClick(item)}
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

      {/* Sidebar Notifications Slideout Drawer */}
      {showNotificationsDrawer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1300,
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.5)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowNotificationsDrawer(false)}
          />

          {/* Drawer Content */}
          <div
            style={{
              position: "relative",
              zIndex: 1310,
              width: "100%",
              maxWidth: "420px",
              height: "100vh",
              background: "var(--bg-card, #ffffff)",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid var(--border-color, #e2e8f0)",
              animation: "slideInLeft 0.25s ease-out",
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--bg-card)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(37, 99, 235, 0.1)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bell size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                    Notifications
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {unreadNotifCount} unread alert{unreadNotifCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {unreadNotifCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--primary)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: "4px",
                    }}
                    title="Mark all notifications as read"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotificationsDrawer(false)}
                  style={{
                    background: "rgba(100, 116, 139, 0.1)",
                    border: "none",
                    borderRadius: "8px",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--text-main)",
                  }}
                  aria-label="Close notifications"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div
              style={{
                display: "flex",
                gap: "0.35rem",
                padding: "0.75rem 1.25rem",
                borderBottom: "1px solid var(--border-color)",
                overflowX: "auto",
                background: "var(--bg-main, #f8fafc)",
              }}
            >
              {[
                { key: "ALL", label: `All (${dynamicNotifications.length})` },
                { key: "ORG", label: `🏢 Organizations` },
                { key: "TRIP", label: `🚌 Trips` },
                { key: "SECURITY", label: `🛡️ Security` },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => setNotifCategoryFilter(c.key)}
                  style={{
                    padding: "0.3rem 0.65rem",
                    borderRadius: "99px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    border: "1px solid",
                    borderColor:
                      notifCategoryFilter === c.key
                        ? "var(--primary)"
                        : "var(--border-color)",
                    background:
                      notifCategoryFilter === c.key
                        ? "var(--primary)"
                        : "var(--bg-card)",
                    color:
                      notifCategoryFilter === c.key
                        ? "#ffffff"
                        : "var(--text-muted)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Notifications List Body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {filteredNotifications.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem 1.5rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <CheckCircle2 size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.5 }} />
                  <h4 style={{ margin: 0, fontSize: "0.95rem" }}>All Caught Up!</h4>
                  <p style={{ margin: "4px 0 0", fontSize: "0.78rem" }}>
                    No notifications in this category.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const isRead = Boolean(readNotifIds[notif.id]);
                  const Icon = notif.icon;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationAction(notif)}
                      style={{
                        padding: "1rem",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                        background: isRead ? "var(--bg-card)" : "rgba(37, 99, 235, 0.04)",
                        display: "flex",
                        gap: "0.85rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        position: "relative",
                      }}
                    >
                      {/* Unread indicator dot */}
                      {!isRead && (
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "var(--primary, #2563eb)",
                          }}
                        />
                      )}

                      {/* Icon */}
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "8px",
                          background: `${notif.color}15`,
                          color: notif.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={18} />
                      </div>

                      {/* Text content */}
                      <div style={{ flex: 1, paddingRight: isRead ? 0 : "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background: `${notif.color}20`,
                              color: notif.color,
                            }}
                          >
                            {notif.badge}
                          </span>
                        </div>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "0.85rem",
                            fontWeight: isRead ? 600 : 700,
                            color: "var(--text-main)",
                          }}
                        >
                          {notif.title}
                        </h4>
                        <p
                          style={{
                            margin: "4px 0 6px",
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                            lineHeight: 1.35,
                          }}
                        >
                          {notif.message}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Clock size={12} /> {notif.timestamp}
                          </span>
                          <span
                            style={{
                              color: "var(--primary)",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                            }}
                          >
                            {notif.actionText} <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
