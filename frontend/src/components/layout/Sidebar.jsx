import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { isUserAdmin } from "../../utils/userUtils";
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
  LogOut,
  MessageSquareQuote,
  Star,
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
    routes = [],
    trips = [],
    drivers = [],
    verifiers = [],
    bookings = [],
    payments = [],
    users = [],
    stations = [],
    verifications = [],
    auditLogs = [],
    settings = {},
    adminStats = null,
    coordinatorStats = null,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    toggleSidebar,
    resetAppState,
  } = useApp();

  const { logout, user } = useAuth();
  const { t } = useTranslation();

  const handleLogout = async () => {
    if (resetAppState) resetAppState();
    await logout();
    navigate("/login", { replace: true });
  };

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

  const isScopedToCurrentOrg = (orgId) => {
    if (!selectedOrgId || selectedOrgId === "ALL") return true;
    return orgId === selectedOrgId;
  };

  // Calculate real notifications based on active system data
  const dynamicNotifications = useMemo(() => {
    const list = [];

    // 1. Organization events: Pending or newly added organizations
    (organizations || []).forEach((org) => {
      const isPending = org?.status === "PENDING";
      if (!selectedOrgId || selectedOrgId === "ALL" || org?.id === selectedOrgId) {
        list.push({
          id: `notif-org-${org?.id}`,
          category: "ORG",
          title: isPending ? "Organization Awaiting Approval" : "Organization Profile Active",
          message: isPending
            ? `Transport operator "${org?.name}" registered and is awaiting administrative approval.`
            : `Operator "${org?.name}" is verified and active on the platform.`,
          timestamp: org?.createdAt || "Recently",
          targetPage: "organizations",
          icon: Building2,
          color: isPending ? "#f59e0b" : "#10b981",
          badge: isPending ? "Pending Approval" : "Verified",
          actionText: "Review Organization",
        });
      }
    });

    // 2. Trip events: Newly created or scheduled trips
    (trips || []).forEach((trip) => {
      const isDraft = trip?.status === "DRAFT";
      if (isScopedToCurrentOrg(trip?.organizationId || trip?.organization_id)) {
        list.push({
          id: `notif-trip-${trip?.id}`,
          category: "TRIP",
          title: isDraft ? "Trip Requires Action / Publishing" : "New Trip Scheduled",
          message: `Trip "${trip?.tripCode || 'TRIP'}" scheduled on route "${trip?.routeName || 'Intercity'}" by ${trip?.organizationName || 'Operator'}.`,
          timestamp: trip?.departureDate ? `${trip?.departureDate} at ${trip?.departureTime || '06:00 AM'}` : "Scheduled",
          targetPage: "trips",
          icon: CalendarDays,
          color: isDraft ? "#f59e0b" : "#2563eb",
          badge: trip?.status || "PUBLISHED",
          actionText: "Inspect Trip",
        });
      }
    });

    // 3. Payment events: Pending payments
    (payments || [])
      .filter((p) => p?.status === "PENDING" && isScopedToCurrentOrg(p?.organizationId || p?.organization_id))
      .forEach((p) => {
        list.push({
          id: `notif-pay-${p?.id}`,
          category: "PAYMENT",
          title: "Pending Payment Settlement",
          message: `Payment #${p?.paymentReference || p?.id?.slice(0, 8)} (${Number(p?.amount || 0).toLocaleString()} ETB) awaiting verification.`,
          timestamp: p?.paidAt || p?.createdAt || "Pending",
          targetPage: "payments",
          icon: CreditCard,
          color: "#f59e0b",
          badge: "Pending Settlement",
          actionText: "Inspect Payment",
        });
      });

    // 4. Fleet bus maintenance events
    (buses || [])
      .filter((b) => (b?.status === "MAINTENANCE" || b?.status === "INACTIVE" || b?.isActive === false) && isScopedToCurrentOrg(b?.organizationId || b?.organization_id))
      .forEach((b) => {
        list.push({
          id: `notif-bus-${b?.id}`,
          category: "FLEET",
          title: "Bus In Maintenance",
          message: `Bus "${b?.plateNumber || b?.busNumber}" (${b?.organizationName}) flagged for maintenance inspection.`,
          timestamp: b?.lastMaintenance || "Recent",
          targetPage: "buses",
          icon: Bus,
          color: "#f59e0b",
          badge: b?.status || "MAINTENANCE",
          actionText: "View Fleet",
        });
      });

    // 5. Security & Ticket QR Scan events
    (verifications || [])
      .filter((v) => (v?.status === "ALREADY_USED" || v?.status === "INVALID") && isScopedToCurrentOrg(v?.organizationId))
      .forEach((v) => {
        const isDuplicate = v.status === "ALREADY_USED";
        list.push({
          id: `notif-vrf-${v.id}`,
          category: "SECURITY",
          title: isDuplicate ? "Duplicate QR Scan Flagged" : "Invalid Ticket Scan Rejected",
          message: `Boarding attempt rejected for ticket #${v.ticketNumber} at terminal "${v.stationName || 'Autobus Terra'}".`,
          timestamp: v.scannedAt || "Recently",
          targetPage: "bookings",
          icon: ShieldCheck,
          color: "#ef4444",
          badge: isDuplicate ? "Duplicate Scan" : "Security Alert",
          actionText: "View Bookings",
        });
      });

    return list;
  }, [organizations, trips, verifications, payments, buses, selectedOrgId]);

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
      reports: true,
      audit: true,
      drivers: true,
      verifiers: true,
      feedback: true,
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

  // Context Menu State for Navigation Items
  const [contextMenu, setContextMenu] = useState(null); // { x, y, item }
  const contextMenuRef = useRef(null);

  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (e) => {
      if (contextMenuRef.current && contextMenuRef.current.contains(e.target)) return;
      setContextMenu(null);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setContextMenu(null);
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleClickOutside, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleClickOutside, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  // Dynamic counts of items requiring operational attention (scoped to active organization selection)
  const pendingApprovalsCount = (organizations || []).filter(
    (o) => isScopedToCurrentOrg(o?.id) && o?.status === "PENDING"
  ).length;

  const pendingTripsCount = (trips || []).filter(
    (t) => isScopedToCurrentOrg(t?.organizationId || t?.organization_id) && (t?.status === "DRAFT" || t?.status === "PENDING")
  ).length;

  const attentionBusesCount = (buses || []).filter(
    (b) => isScopedToCurrentOrg(b?.organizationId || b?.organization_id) && (b?.status === "MAINTENANCE" || b?.status === "INACTIVE" || b?.isActive === false)
  ).length;

  const attentionRoutesCount = (routes || []).filter(
    (r) => isScopedToCurrentOrg(r?.organizationId || r?.organization_id) && (r?.status === "INACTIVE" || r?.isActive === false)
  ).length;

  const attentionUsersCount = (users || []).filter(
    (u) => isScopedToCurrentOrg(u?.organizationId || u?.organization_id) && (u?.status === "SUSPENDED" || u?.isActive === false || !u?.emailVerified)
  ).length;

  const pendingBookingsCount = (bookings || []).filter(
    (bk) => isScopedToCurrentOrg(bk?.organizationId || bk?.organization_id) && bk?.status === "PENDING"
  ).length;

  const pendingPaymentsCount = (payments || []).filter(
    (p) => isScopedToCurrentOrg(p?.organizationId || p?.organization_id) && p?.status === "PENDING"
  ).length;

  const securityAlertsCount = (verifications || []).filter(
    (v) => isScopedToCurrentOrg(v?.organizationId) && (v?.status === "ALREADY_USED" || v?.status === "INVALID")
  ).length;

  const getItemCount = (itemId) => {
    switch (itemId) {
      case "organizations":
        return pendingApprovalsCount;
      case "trips":
        return pendingTripsCount;
      case "buses":
        return attentionBusesCount;
      case "routes":
        return attentionRoutesCount;
      case "users":
        return attentionUsersCount;
      case "bookings":
        return pendingBookingsCount;
      case "payments":
        return pendingPaymentsCount;
      default:
        return 0;
    }
  };

  const handleItemContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 200;
    const menuHeight = 110;
    const clickX = e.clientX;
    const clickY = e.clientY;

    const x = clickX + menuWidth > window.innerWidth ? Math.max(10, window.innerWidth - menuWidth - 12) : clickX;
    const y = clickY + menuHeight > window.innerHeight ? Math.max(10, window.innerHeight - menuHeight - 12) : clickY;

    setContextMenu({ x, y, item });
  };

  const handleMarkItemRead = (item) => {
    if (!item) return;
    setContextMenu(null);

    const currentCount = getItemCount(item.id);
    setSeenBadges((prev) => {
      const updated = { ...prev, [item.id]: currentCount || true };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save seen badges:", err);
      }
      return updated;
    });

    const matchingNotifIds = dynamicNotifications
      .filter((n) => (item.notifCategory && n.category === item.notifCategory) || n.targetPage === item.id)
      .map((n) => n.id);

    if (matchingNotifIds.length > 0) {
      setReadNotifIds((prev) => {
        const updated = { ...prev };
        matchingNotifIds.forEach((id) => {
          updated[id] = true;
        });
        try {
          localStorage.setItem("platform_read_notifications", JSON.stringify(updated));
        } catch (err) {
          console.error("Failed to save read notification:", err);
        }
        return updated;
      });
    }
  };

  const handleSeeNotifications = (item) => {
    if (!item) return;
    setContextMenu(null);
    setNotifCategoryFilter(item.notifCategory || "ALL");
    setShowNotificationsDrawer(true);
  };

  const formatBadge = (count, itemId) => {
    if (!count || count <= 0) return null;
    if (itemId && seenBadges) {
      const seen = seenBadges[itemId];
      if (seen === true || seen === count) return null;
      if (typeof seen === "number" && count > seen) {
        const diff = count - seen;
        return diff > 99 ? "99+" : String(diff);
      }
    }
    return count > 99 ? "99+" : String(count);
  };

  const adminNavItems = [
    { id: "dashboard", label: t("sidebar.overviewItem", "Overview"), icon: LayoutDashboard },
    {
      id: "organizations",
      label: t("sidebar.organizations", "Organizations"),
      icon: Building2,
      badge: formatBadge(pendingApprovalsCount, "organizations"),
      badgeType: "warning",
      notifCategory: "ORG",
    },
    {
      id: "users",
      label: t("sidebar.users", "Users & Roles"),
      icon: Users,
      badge: formatBadge(attentionUsersCount, "users"),
      badgeType: "primary",
      notifCategory: "USER",
    },
    { id: "stations", label: t("sidebar.stations", "Stations"), icon: MapPin },
    {
      id: "buses",
      label: t("sidebar.buses", "Fleet Buses"),
      icon: Bus,
      badge: formatBadge(attentionBusesCount, "buses"),
      badgeType: "warning",
      notifCategory: "FLEET",
    },
    {
      id: "routes",
      label: t("sidebar.routes", "Routes & Corridors"),
      icon: RouteIcon,
      badge: formatBadge(attentionRoutesCount, "routes"),
      badgeType: "primary",
      notifCategory: "ROUTE",
    },
    {
      id: "trips",
      label: t("sidebar.trips", "Trips & Schedules"),
      icon: CalendarDays,
      badge: formatBadge(pendingTripsCount, "trips"),
      badgeType: "primary",
      notifCategory: "TRIP",
    },
    {
      id: "bookings",
      label: t("sidebar.bookings", "Bookings"),
      icon: Ticket,
      badge: formatBadge(pendingBookingsCount, "bookings"),
      badgeType: "warning",
      notifCategory: "BOOKING",
    },
    {
      id: "payments",
      label: t("sidebar.payments", "Payments & Revenue"),
      icon: CreditCard,
      badge: formatBadge(pendingPaymentsCount, "payments"),
      badgeType: "primary",
      notifCategory: "PAYMENT",
    },
    { id: "reports", label: t("sidebar.reports", "Reports & KPIs"), icon: BarChart3 },
    { id: "audit", label: t("sidebar.audit", "Audit Logs"), icon: FileSpreadsheet },
    { id: "feedback", label: t("sidebar.platformFeedback", "Platform Feedback"), icon: MessageSquareQuote },
    { id: "settings", label: t("sidebar.settings", "Settings"), icon: Settings },
  ];

  const managerNavItems = [
    { id: "dashboard", label: t("sidebar.overviewItem", "Overview"), icon: LayoutDashboard },
    {
      id: "buses",
      label: t("sidebar.buses", "Fleet & Buses"),
      icon: Bus,
      badge: formatBadge(attentionBusesCount, "buses"),
      badgeType: "warning",
      notifCategory: "FLEET",
    },
    {
      id: "routes",
      label: t("sidebar.routes", "Routes & Corridors"),
      icon: RouteIcon,
      badge: formatBadge(attentionRoutesCount, "routes"),
      badgeType: "primary",
      notifCategory: "ROUTE",
    },
    {
      id: "trips",
      label: t("sidebar.trips", "Trips & Schedules"),
      icon: CalendarDays,
      badge: formatBadge(pendingTripsCount, "trips"),
      badgeType: "primary",
      notifCategory: "TRIP",
    },
    { id: "seats", label: t("sidebar.seats", "Seat Allocations"), icon: Grid3X3 },
    {
      id: "bookings",
      label: t("sidebar.bookings", "Bookings"),
      icon: Ticket,
      badge: formatBadge(pendingBookingsCount, "bookings"),
      badgeType: "warning",
      notifCategory: "BOOKING",
    },
    {
      id: "payments",
      label: t("sidebar.payments", "Payments & Revenue"),
      icon: CreditCard,
      badge: formatBadge(pendingPaymentsCount, "payments"),
      badgeType: "primary",
      notifCategory: "PAYMENT",
    },
    { id: "drivers", label: t("sidebar.drivers", "Drivers"), icon: UserCheck, notifCategory: "STAFF" },
    { id: "verifiers", label: t("sidebar.verifiers", "Ticket Verifiers"), icon: QrCode, notifCategory: "STAFF" },
    { id: "feedback", label: t("sidebar.tripFeedback", "Trip Reviews"), icon: Star },
    { id: "reports", label: t("sidebar.reports", "Reports & KPIs"), icon: BarChart3 },
    { id: "settings", label: t("sidebar.settings", "Settings"), icon: Settings },
  ];

  const isAdminSession = currentRole === "ADMIN" || isUserAdmin(user);
  const navItems = isAdminSession ? adminNavItems : managerNavItems;

  // Determine if a specific item is currently active
  const isItemActive = (itemId) => {
    if (activePage === itemId) return true;
    const basePath = isAdminSession ? "/admin" : "/operator";
    if (itemId === "dashboard") {
      return location.pathname === basePath || location.pathname === `${basePath}/`;
    }
    return location.pathname === `${basePath}/${itemId}` || location.pathname.startsWith(`${basePath}/${itemId}/`);
  };

  // Total active unread badge count across all items
  const totalActiveBadges = navItems.filter((item) => Boolean(item.badge)).length;

  const handleNavClick = (item) => {
    if (item.isNotificationTrigger || item.id === "notifications") {
      setShowNotificationsDrawer(true);
      return;
    }

    markItemAsSeen(item.id);
    setActivePage(item.id);
    const basePath = isAdminSession ? "/admin" : "/operator";
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
      const basePath = isAdminSession ? "/admin" : "/operator";
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
                  {isAdminSession
                    ? "Platform Admin Console"
                    : `${activeOrg?.name || "Operations"} Portal`}
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
              className="sidebar-alert-strip"
              onClick={() => {
                setNotifCategoryFilter("ALL");
                setShowNotificationsDrawer(true);
              }}
              style={{ cursor: "pointer" }}
              title="Click to view notification center"
            >
              <span>🔔 {totalActiveBadges} active alert{totalActiveBadges > 1 ? "s" : ""}</span>
              <button
                type="button"
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

          <div className="nav-items-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.id);
              return (
                <div
                  key={item.id}
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() => handleNavClick(item)}
                  onContextMenu={(e) => handleItemContextMenu(e, item)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleNavClick(item);
                    }
                  }}
                >
                  <div className="nav-link-content">
                    <Icon size={isSidebarCollapsed ? 20 : 18} />
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </div>
                  {item.badge && (
                    <span
                      className={
                        isSidebarCollapsed
                          ? "badge-dot"
                          : `badge-count ${item.badgeType ? `badge-${item.badgeType}` : ""}`
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.notifCategory) {
                          setNotifCategoryFilter(item.notifCategory);
                          setShowNotificationsDrawer(true);
                        } else {
                          handleNavClick(item);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.stopPropagation();
                        handleItemContextMenu(e, item);
                      }}
                      title={
                        isSidebarCollapsed
                          ? `${item.badge} notifications for ${item.label}`
                          : `View ${item.badge} notifications for ${item.label}`
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          if (item.notifCategory) {
                            setNotifCategoryFilter(item.notifCategory);
                            setShowNotificationsDrawer(true);
                          } else {
                            handleNavClick(item);
                          }
                        }
                      }}
                    >
                      {isSidebarCollapsed ? "" : item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="role-scope-badge">
            <div className="role-title">
              <ShieldCheck size={16} />
              {!isSidebarCollapsed && (
                <span>
                  {isAdminSession ? "Platform Admin" : "Operational Manager"}
                </span>
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className="scope-name">
                {isAdminSession
                  ? (selectedOrgId && selectedOrgId !== "ALL"
                    ? `🏢 ${organizations.find((o) => o.id === selectedOrgId)?.name || "All Organizations"}`
                    : "🌐 System-Wide Scope")
                  : `🏢 ${activeOrg?.name || "Assigned Organization"}`}
              </div>
            )}
          </div>
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title={t("header.logout", "Sign Out")}
          >
            <LogOut size={16} />
            {!isSidebarCollapsed && <span>{t("header.logout", "Sign Out")}</span>}
          </button>
        </div>
      </aside>

      {/* Floating Context Menu for Sidebar Items */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="sidebar-context-menu"
          style={{
            position: "fixed",
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 9999,
            minWidth: "205px",
            background: "var(--bg-card, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "10px",
            boxShadow: "0 12px 30px -4px rgba(0, 0, 0, 0.2), 0 6px 12px -4px rgba(0, 0, 0, 0.08)",
            padding: "6px",
            userSelect: "none",
          }}
        >
          <div
            style={{
              padding: "6px 10px 6px",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--text-muted, #64748b)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              borderBottom: "1px solid var(--border-color, #e2e8f0)",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{contextMenu.item?.label || "Navigation"}</span>
            {contextMenu.item?.badge && (
              <span
                style={{
                  fontSize: "0.68rem",
                  padding: "1px 6px",
                  borderRadius: "99px",
                  background: "rgba(37, 99, 235, 0.12)",
                  color: "var(--primary, #2563eb)",
                  fontWeight: 800,
                }}
              >
                {contextMenu.item.badge}
              </span>
            )}
          </div>

          <button
            type="button"
            className="context-menu-btn"
            onClick={() => handleMarkItemRead(contextMenu.item)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "8px 10px",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--text-main, #0f172a)",
              background: "transparent",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-main, #f1f5f9)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <CheckCheck size={16} color="var(--primary, #2563eb)" />
            <span>Mark as read</span>
          </button>

          <button
            type="button"
            className="context-menu-btn"
            onClick={() => handleSeeNotifications(contextMenu.item)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "8px 10px",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--text-main, #0f172a)",
              background: "transparent",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-main, #f1f5f9)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Bell size={16} color="#f59e0b" />
            <span>See notifications</span>
          </button>
        </div>
      )}

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
                { key: "TRIP", label: `📅 Trips` },
                { key: "FLEET", label: `🚌 Fleet` },
                { key: "PAYMENT", label: `💳 Payments` },
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
