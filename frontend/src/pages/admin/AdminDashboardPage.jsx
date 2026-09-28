import React from "react";
import { useApp } from "../../context/AppContext";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  Ticket,
  CreditCard,
  QrCode,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Plus,
  Users,
  RefreshCw,
} from "lucide-react";

export const AdminDashboardPage = () => {
  const {
    organizations,
    users,
    trips,
    bookings,
    payments,
    verifications,
    adminStats,
    setActivePage,
    approveOrganization,
    rejectOrganization,
    isLoadingData,
    fetchAdminData,
  } = useApp();

  const totalOrgs = adminStats?.organizations?.total ?? organizations.length;
  const pendingOrgs = organizations.filter((o) => o.status === "PENDING");
  const pendingOrgsCount = adminStats?.organizations?.pending ?? pendingOrgs.length;
  const activeOrgs = adminStats?.organizations?.approved ?? organizations.filter((o) => o.status === "APPROVED").length;
  const todayTrips = adminStats?.trips?.total ?? trips.length;
  const todayBookings = adminStats?.bookings?.total ?? bookings.length;
  const successfulPayments = payments.filter((p) => p.status === "SUCCESS" || p.status === "COMPLETED");
  const totalRevenue = adminStats?.financials?.totalRevenue ?? successfulPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalPlatformFees = adminStats?.financials?.platformCommission ?? (totalRevenue * 0.035).toFixed(2);
  const validScans = verifications.filter((v) => v.status === "VALID").length;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Admin Dashboard</h1>
          <p>Overview of intercity bus operators, trips, bookings, and payments.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchAdminData()}
            title="Refresh Platform State"
          >
            <RefreshCw size={14} className={isLoadingData ? "spin" : ""} /> Refresh
          </button>
          <button className="btn btn-secondary" onClick={() => setActivePage("reports")}>
            Reports
          </button>
          <button className="btn btn-primary" onClick={() => setActivePage("organizations")}>
            Organizations
          </button>
        </div>
      </div>

      {isLoadingData && !adminStats && (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <LoadingSpinner label="Synchronizing platform monitoring data..." />
        </div>
      )}

      {/* KPI Stat Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Organizations"
          value={totalOrgs}
          icon={Building2}
          subtitle={`${activeOrgs} active, ${pendingOrgsCount} pending, ${adminStats?.organizations?.suspended ?? organizations.filter((o) => o.status === "SUSPENDED").length} suspended`}
          onClick={() => setActivePage("organizations")}
        />
        <StatCard
          title="Platform Users"
          value={adminStats?.users?.total ?? users.length}
          icon={Users}
          subtitle={`${adminStats?.users?.active ?? users.filter((u) => u.status === "ACTIVE").length} active accounts`}
          onClick={() => setActivePage("users")}
        />
        <StatCard
          title="Pending Approvals"
          value={pendingOrgsCount}
          icon={AlertTriangle}
          trend={pendingOrgsCount > 0 ? "⚠ Requires Review" : "✓ Clean"}
          subtitle="Operators awaiting verification"
          onClick={() => setActivePage("organizations")}
        />
        <StatCard
          title="Today's Trips"
          value={todayTrips}
          icon={CalendarDays}
          subtitle="Scheduled operational departures"
          onClick={() => setActivePage("trips")}
        />
        <StatCard
          title="Today's Bookings"
          value={todayBookings}
          icon={Ticket}
          subtitle="Confirmed passenger bookings"
          onClick={() => setActivePage("bookings")}
        />
        <StatCard
          title="Today's Payments"
          value={`${totalRevenue.toLocaleString()} ETB`}
          icon={CreditCard}
          trend="3.5% fee split"
          subtitle={`Platform Fee: ${Number(totalPlatformFees).toLocaleString()} ETB`}
          onClick={() => setActivePage("payments")}
        />
        <StatCard
          title="Tickets Verified"
          value={validScans}
          icon={QrCode}
          subtitle="QR boarding verification events"
          onClick={() => setActivePage("tickets")}
        />
      </div>

      {/* Pending Approvals Alert Banner */}
      {pendingOrgs.length > 0 && (
        <div className="card-table-wrapper" style={{ borderLeft: "4px solid var(--warning)", marginBottom: "1.5rem" }}>
          <div className="card-header-toolbar" style={{ background: "var(--warning-bg)" }}>
            <div className="card-title">
              <h3 style={{ color: "var(--warning-text)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShieldAlert size={18} /> Pending Approvals ({pendingOrgs.length})
              </h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage("organizations")}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Type</th>
                <th>Reg. Ref</th>
                <th>Contact</th>
                <th>Applied Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrgs.map((org) => (
                <tr key={org.id}>
                  <td>
                    <strong>{org.name}</strong>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{org.address}</div>
                  </td>
                  <td>{org.type}</td>
                  <td><code>{org.registrationNumber}</code></td>
                  <td>{org.contactName} ({org.phone})</td>
                  <td>{org.createdAt}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => approveOrganization(org.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => rejectOrganization(org.id, "Documents non-compliant")}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid of Platform Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Today's Operational Trips */}
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3>Today's Platform Trips</h3>
              <p>Active departures scheduled across operators</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage("trips")}>
              View Trips
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Operator</th>
                <th>Route</th>
                <th>Departure</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trips.slice(0, 4).map((trp) => (
                <tr key={trp.id}>
                  <td><strong>{trp.organizationName}</strong></td>
                  <td>{trp.routeName}</td>
                  <td>{trp.departureTime}</td>
                  <td><Badge status={trp.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Verification Activity */}
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3>Recent QR Boarding Verifications</h3>
              <p>Live ticket scan events at terminals</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage("tickets")}>
              View Logs
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Terminal</th>
                <th>Result</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {verifications.slice(0, 4).map((vrf) => (
                <tr key={vrf.id}>
                  <td><code>{vrf.ticketNumber}</code></td>
                  <td>{vrf.stationName}</td>
                  <td><Badge status={vrf.status} /></td>
                  <td>{vrf.scannedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
