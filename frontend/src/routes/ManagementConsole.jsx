import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { isUserAdmin, isUserOperator } from "@/utils/userUtils";

// Auth Pages (embedded in console)
import ProfilePage from "../features/auth/pages/ProfilePage";
import ChangePasswordPage from "../features/auth/pages/ChangePasswordPage";

// Admin Pages (Lazy loaded for code-splitting)
const AdminDashboardPage = React.lazy(() => import("../pages/admin/AdminDashboardPage").then(m => ({ default: m.default || m.AdminDashboardPage })));
const AdminOrganizationsPage = React.lazy(() => import("../pages/admin/AdminOrganizationsPage").then(m => ({ default: m.default || m.AdminOrganizationsPage })));
const AdminUsersPage = React.lazy(() => import("../pages/admin/AdminUsersPage").then(m => ({ default: m.default || m.AdminUsersPage })));
const AdminStationsPage = React.lazy(() => import("../pages/admin/AdminStationsPage").then(m => ({ default: m.default || m.AdminStationsPage })));
const AdminBusesPage = React.lazy(() => import("../pages/admin/AdminBusesPage").then(m => ({ default: m.default || m.AdminBusesPage })));
const AdminRoutesPage = React.lazy(() => import("../pages/admin/AdminRoutesPage").then(m => ({ default: m.default || m.AdminRoutesPage })));
const AdminTripsPage = React.lazy(() => import("../pages/admin/AdminTripsPage").then(m => ({ default: m.default || m.AdminTripsPage })));
const AdminBookingsPage = React.lazy(() => import("../pages/admin/AdminBookingsPage").then(m => ({ default: m.default || m.AdminBookingsPage })));
const AdminPaymentsPage = React.lazy(() => import("../pages/admin/AdminPaymentsPage").then(m => ({ default: m.default || m.AdminPaymentsPage })));
const AdminReportsPage = React.lazy(() => import("../pages/admin/AdminReportsPage").then(m => ({ default: m.default || m.AdminReportsPage })));
const AdminAuditLogsPage = React.lazy(() => import("../pages/admin/AdminAuditLogsPage").then(m => ({ default: m.default || m.AdminAuditLogsPage })));
const AdminSettingsPage = React.lazy(() => import("../pages/admin/AdminSettingsPage").then(m => ({ default: m.default || m.AdminSettingsPage })));
const AdminFeedbackPage = React.lazy(() => import("../pages/admin/AdminFeedbackPage").then(m => ({ default: m.default || m.AdminFeedbackPage })));

// Manager Pages (Lazy loaded for code-splitting)
const ManagerDashboardPage = React.lazy(() => import("../pages/manager/ManagerDashboardPage").then(m => ({ default: m.default || m.ManagerDashboardPage })));
const ManagerBusesPage = React.lazy(() => import("../pages/manager/ManagerBusesPage").then(m => ({ default: m.default || m.ManagerBusesPage })));
const ManagerRoutesPage = React.lazy(() => import("../pages/manager/ManagerRoutesPage").then(m => ({ default: m.default || m.ManagerRoutesPage })));
const ManagerTripsPage = React.lazy(() => import("../pages/manager/ManagerTripsPage").then(m => ({ default: m.default || m.ManagerTripsPage })));
const ManagerSeatsPage = React.lazy(() => import("../pages/manager/ManagerSeatsPage").then(m => ({ default: m.default || m.ManagerSeatsPage })));
const ManagerBookingsPage = React.lazy(() => import("../pages/manager/ManagerBookingsPage").then(m => ({ default: m.default || m.ManagerBookingsPage })));
const ManagerPaymentsPage = React.lazy(() => import("../pages/manager/ManagerPaymentsPage").then(m => ({ default: m.default || m.ManagerPaymentsPage })));
const ManagerDriversPage = React.lazy(() => import("../pages/manager/ManagerDriversPage").then(m => ({ default: m.default || m.ManagerDriversPage })));
const ManagerVerifiersPage = React.lazy(() => import("../pages/manager/ManagerVerifiersPage").then(m => ({ default: m.default || m.ManagerVerifiersPage })));
const ManagerFeedbackPage = React.lazy(() => import("../pages/manager/ManagerFeedbackPage").then(m => ({ default: m.default || m.ManagerFeedbackPage })));
const ManagerReportsPage = React.lazy(() => import("../pages/manager/ManagerReportsPage").then(m => ({ default: m.default || m.ManagerReportsPage })));
const ManagerSettingsPage = React.lazy(() => import("../pages/manager/ManagerSettingsPage").then(m => ({ default: m.default || m.ManagerSettingsPage })));

export const ManagementConsole = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const {
    currentRole,
    setCurrentRole,
    activePage,
    setActivePage,
    selectedOrgId,
    setSelectedOrgId,
  } = useApp();

  const isAdmin = isUserAdmin(user);
  const isCoordinator = isUserOperator(user);

  const isOperatorRoute = location.pathname.startsWith("/operator");
  const isAdminRoute = location.pathname.startsWith("/admin");

  React.useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (isAdmin && !isOperatorRoute) {
      if (currentRole !== "ADMIN") {
        setCurrentRole("ADMIN");
      }
    } else if (isCoordinator || isOperatorRoute) {
      if (currentRole !== "MANAGER") {
        setCurrentRole("MANAGER");
      }
      const orgCtx = user.organizationContext?.[0] || user.organization;
      const orgId = orgCtx?.organizationId || user.organizationId;
      if (orgId && selectedOrgId !== orgId) {
        setSelectedOrgId(orgId);
      }
    }
  }, [
    isAuthenticated,
    user,
    isAdmin,
    isCoordinator,
    isOperatorRoute,
    currentRole,
    setCurrentRole,
    selectedOrgId,
    setSelectedOrgId,
  ]);

  const pageFromUrl = React.useMemo(() => {
    const segments = location.pathname
      .replace(/\/$/, "")
      .split("/")
      .filter(Boolean);
    if (segments.length >= 2) {
      return segments[1];
    }
    return "dashboard";
  }, [location.pathname]);

  const consolePage = pageFromUrl || activePage || "dashboard";

  React.useEffect(() => {
    if (consolePage && consolePage !== activePage) {
      setActivePage(consolePage);
    }
  }, [consolePage, activePage, setActivePage]);

  if (isLoading) {
    return <LoadingSpinner fullPage label="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (location.pathname === "/dashboard" || location.pathname === "/dashboard/") {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    if (isCoordinator) {
      return <Navigate to="/operator" replace />;
    }
    return <Navigate to="/my-bookings" replace />;
  }

  if (!isAdmin && isAdminRoute) {
    return <Navigate to="/operator" replace />;
  }

  if (!isAdmin && !isCoordinator) {
    return <Navigate to="/my-bookings" replace />;
  }

  const renderAdminContent = () => {
    switch (consolePage) {
      case "dashboard":
        return <AdminDashboardPage />;
      case "profile":
        return <ProfilePage embedded={true} />;
      case "change-password":
        return <ChangePasswordPage embedded={true} />;
      case "organizations":
        return <AdminOrganizationsPage />;
      case "users":
        return <AdminUsersPage />;
      case "stations":
        return <AdminStationsPage />;
      case "buses":
        return <AdminBusesPage />;
      case "routes":
        return <AdminRoutesPage />;
      case "trips":
        return <AdminTripsPage />;
      case "bookings":
        return <AdminBookingsPage />;
      case "payments":
        return <AdminPaymentsPage />;
      case "reports":
        return <AdminReportsPage />;
      case "audit":
        return <AdminAuditLogsPage />;
      case "feedback":
        return <AdminFeedbackPage />;
      case "settings":
        return <AdminSettingsPage />;
      default:
        return <AdminDashboardPage />;
    }
  };

  const renderManagerContent = () => {
    switch (consolePage) {
      case "dashboard":
        return <ManagerDashboardPage />;
      case "profile":
        return <ProfilePage embedded={true} />;
      case "change-password":
        return <ChangePasswordPage embedded={true} />;
      case "buses":
        return <ManagerBusesPage />;
      case "routes":
        return <ManagerRoutesPage />;
      case "trips":
        return <ManagerTripsPage />;
      case "seats":
        return <ManagerSeatsPage />;
      case "bookings":
        return <ManagerBookingsPage />;
      case "payments":
        return <ManagerPaymentsPage />;
      case "drivers":
        return <ManagerDriversPage />;
      case "verifiers":
        return <ManagerVerifiersPage />;
      case "feedback":
        return <ManagerFeedbackPage />;
      case "reports":
        return <ManagerReportsPage />;
      case "settings":
        return <ManagerSettingsPage />;
      default:
        return <ManagerDashboardPage />;
    }
  };

  const showAdminUI = isAdmin && !isOperatorRoute;

  return (
    <DashboardLayout>
      <React.Suspense fallback={<LoadingSpinner fullPage label="Loading console view..." />}>
        {showAdminUI ? renderAdminContent() : renderManagerContent()}
      </React.Suspense>
    </DashboardLayout>
  );
};

export default ManagementConsole;
