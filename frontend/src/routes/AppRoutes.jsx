import React from "react";
import { useApp } from "../context/AppContext";
import { DashboardLayout } from "../components/layout/DashboardLayout";

// Admin Pages
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminOrganizationsPage } from "../pages/admin/AdminOrganizationsPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminStationsPage } from "../pages/admin/AdminStationsPage";
import { AdminBusesPage } from "../pages/admin/AdminBusesPage";
import { AdminRoutesPage } from "../pages/admin/AdminRoutesPage";
import { AdminTripsPage } from "../pages/admin/AdminTripsPage";
import { AdminBookingsPage } from "../pages/admin/AdminBookingsPage";
import { AdminPaymentsPage } from "../pages/admin/AdminPaymentsPage";
import { AdminTicketsPage } from "../pages/admin/AdminTicketsPage";
import { AdminReportsPage } from "../pages/admin/AdminReportsPage";
import { AdminAuditLogsPage } from "../pages/admin/AdminAuditLogsPage";
import { AdminSettingsPage } from "../pages/admin/AdminSettingsPage";

// Manager Pages
import { ManagerDashboardPage } from "../pages/manager/ManagerDashboardPage";
import { ManagerOrganizationPage } from "../pages/manager/ManagerOrganizationPage";
import { ManagerBusesPage } from "../pages/manager/ManagerBusesPage";
import { ManagerRoutesPage } from "../pages/manager/ManagerRoutesPage";
import { ManagerTripsPage } from "../pages/manager/ManagerTripsPage";
import { ManagerSeatsPage } from "../pages/manager/ManagerSeatsPage";
import { ManagerBookingsPage } from "../pages/manager/ManagerBookingsPage";
import { ManagerPaymentsPage } from "../pages/manager/ManagerPaymentsPage";
import { ManagerDriversPage } from "../pages/manager/ManagerDriversPage";
import { ManagerVerifiersPage } from "../pages/manager/ManagerVerifiersPage";
import { ManagerReportsPage } from "../pages/manager/ManagerReportsPage";
import { ManagerSettingsPage } from "../pages/manager/ManagerSettingsPage";

export const AppRoutes = () => {
  const { currentRole, activePage } = useApp();

  const renderAdminContent = () => {
    switch (activePage) {
      case "dashboard":
        return <AdminDashboardPage />;
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
      case "tickets":
        return <AdminTicketsPage />;
      case "reports":
        return <AdminReportsPage />;
      case "audit":
        return <AdminAuditLogsPage />;
      case "settings":
        return <AdminSettingsPage />;
      default:
        return <AdminDashboardPage />;
    }
  };

  const renderManagerContent = () => {
    switch (activePage) {
      case "dashboard":
        return <ManagerDashboardPage />;
      case "organization":
        return <ManagerOrganizationPage />;
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
      case "reports":
        return <ManagerReportsPage />;
      case "settings":
        return <ManagerSettingsPage />;
      default:
        return <ManagerDashboardPage />;
    }
  };

  return (
    <DashboardLayout>
      {currentRole === "ADMIN" ? renderAdminContent() : renderManagerContent()}
    </DashboardLayout>
  );
};
