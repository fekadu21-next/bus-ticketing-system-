import React from "react";
import { useApp } from "../../context/AppContext";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import {
  Bus,
  CalendarDays,
  Ticket,
  Grid3X3,
  CreditCard,
  UserCheck,
  QrCode,
  Plus,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  MapPin,
  TrendingUp,
  Clock
} from "lucide-react";

export const ManagerDashboardPage = () => {
  const {
    activeOrg,
    buses,
    routes,
    trips,
    bookings,
    payments,
    drivers,
    verifiers,
    coordinatorStats,
    setActivePage,
    selectedOrgId,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  // Filter org-scoped data automatically (Organization Scope Guard)
  const orgBuses = buses.filter((b) => b.organizationId === selectedOrgId);
  const orgRoutes = routes.filter((r) => r.organizationId === selectedOrgId);
  const orgTrips = trips.filter((t) => t.organizationId === selectedOrgId);
  const orgBookings = bookings.filter((b) => b.organizationId === selectedOrgId);
  const orgPayments = payments.filter((p) => p.organizationId === selectedOrgId);
  const orgDrivers = drivers.filter((d) => d.organizationId === selectedOrgId);
  const orgVerifiers = verifiers.filter((v) => v.organizationId === selectedOrgId);

  // High-fidelity operational calculations
  const totalBusesCount = coordinatorStats?.buses?.total ?? orgBuses.length;
  const activeBuses = coordinatorStats?.buses?.active ?? orgBuses.filter((b) => b.status === "ACTIVE").length;
  const totalRoutesCount = coordinatorStats?.routes?.total ?? orgRoutes.length;
  const publishedTrips = coordinatorStats?.trips?.scheduled ?? orgTrips.filter((t) => t.status === "PUBLISHED" || t.status === "SCHEDULED").length;

  const totalBookedSeats = coordinatorStats?.bookings?.confirmed ?? orgTrips.reduce((acc, t) => acc + (t.bookedSeatsCount || 0), 0);
  const totalCapacity = orgTrips.reduce((acc, t) => acc + (t.totalSeats || 0), 0);
  const availableSeats = Math.max(0, totalCapacity - totalBookedSeats);

  const totalRevenue = coordinatorStats?.payments?.totalRevenue ?? orgPayments.filter((p) => p.status === "SUCCESS").reduce((acc, p) => acc + (p.amount || 0), 0);
  const paidBookingsCount = coordinatorStats?.payments?.totalCompletedTransactions ?? orgBookings.filter((b) => b.paymentStatus === "SUCCESS").length;

  const todayTrips = coordinatorStats?.today?.tripsCount ?? orgTrips.filter((t) => t.departureDate === new Date().toISOString().split("T")[0]).length;
  const todayRevenue = coordinatorStats?.today?.revenue ?? 0;

  const activeDriversCount = coordinatorStats?.staff?.drivers?.active ?? orgDrivers.filter((d) => d.status === "ACTIVE").length;
  const activeVerifiersCount = coordinatorStats?.staff?.verifiers?.active ?? orgVerifiers.filter((v) => v.status === "ACTIVE").length;

  const unassignedTrips = orgTrips.filter((t) => t.driverName === "Unassigned" || !t.driverId);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>{activeOrg?.name || "Organization"} Operational Dashboard</h1>
          <p>Fleet allocation, route corridors, departures, and ticketing throughput.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchCoordinatorData(selectedOrgId)}
            disabled={isLoadingData}
            title="Reload metrics from backend"
          >
            <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> Refresh
          </button>
          <button className="btn btn-secondary" onClick={() => setActivePage("buses")}>
            <Bus size={15} /> Fleet
          </button>
          <button className="btn btn-primary" onClick={() => setActivePage("trips")}>
            <Plus size={15} /> Schedule Trip
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Fleet Buses"
          value={totalBusesCount}
          icon={Bus}
          subtitle={`${activeBuses} active in service, ${totalBusesCount - activeBuses} maintenance`}
          onClick={() => setActivePage("buses")}
        />
        <StatCard
          title="Active Corridors"
          value={totalRoutesCount}
          icon={MapPin}
          subtitle={`${orgRoutes.filter((r) => r.status === "ACTIVE").length} operable intercity routes`}
          onClick={() => setActivePage("routes")}
        />
        <StatCard
          title="Active Scheduled Trips"
          value={publishedTrips}
          icon={CalendarDays}
          subtitle={`${todayTrips} departure(s) scheduled today`}
          onClick={() => setActivePage("trips")}
        />
        <StatCard
          title="Seat Occupancy"
          value={totalBookedSeats}
          icon={Ticket}
          subtitle={`${availableSeats} open seats across ${totalCapacity} capacity`}
          onClick={() => setActivePage("seats")}
        />
        <StatCard
          title="Total Ticket Revenue"
          value={`${totalRevenue.toLocaleString()} ETB`}
          icon={CreditCard}
          subtitle={`${paidBookingsCount} paid passenger reservations`}
          onClick={() => setActivePage("payments")}
        />
        <StatCard
          title="Operational Staff"
          value={orgDrivers.length + orgVerifiers.length}
          icon={UserCheck}
          subtitle={`${activeDriversCount} drivers, ${activeVerifiersCount} ticket verifiers`}
          onClick={() => setActivePage("drivers")}
        />
      </div>

      {/* Unassigned Driver Warning Alert */}
      {unassignedTrips.length > 0 && (
        <div className="card-table-wrapper" style={{ borderLeft: "4px solid var(--warning)", marginBottom: "1.5rem" }}>
          <div className="card-header-toolbar" style={{ background: "var(--warning-bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="card-title">
              <h3 style={{ color: "var(--warning-text)", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                <AlertTriangle size={18} /> Operational Notice: Unassigned Drivers ({unassignedTrips.length})
              </h3>
              <p style={{ color: "var(--warning-text)", margin: "0.2rem 0 0 0", fontSize: "0.82rem" }}>
                Scheduled trips require an assigned qualified driver before vehicle departure.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage("trips")}>
              Assign Drivers <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Operational Sections Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }}>
        {/* Today's Scheduled Departure Trips */}
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3>Upcoming Departures</h3>
              <p>Next scheduled trips for this organization</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage("trips")}>
              View All Trips
            </button>
          </div>
          {orgTrips.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              <Clock size={32} style={{ opacity: 0.5, marginBottom: "0.5rem" }} />
              <div>No trips scheduled yet for this organization.</div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "0.75rem" }}
                onClick={() => setActivePage("trips")}
              >
                <Plus size={14} /> Schedule First Trip
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trip Code</th>
                  <th>Route</th>
                  <th>Driver</th>
                  <th>Departure</th>
                  <th>Seats</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orgTrips.slice(0, 6).map((t) => (
                  <tr key={t.id}>
                    <td><code>{t.tripCode}</code></td>
                    <td><strong>{t.routeName}</strong></td>
                    <td>
                      <span style={{ color: t.driverName === "Unassigned" ? "var(--warning-text)" : "inherit" }}>
                        {t.driverName}
                      </span>
                    </td>
                    <td>
                      <div>{t.departureDate}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{t.departureTime}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>
                        {t.bookedSeatsCount} / {t.totalSeats}
                      </span>
                    </td>
                    <td><Badge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Fleet Readiness Status Summary */}
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3>Fleet Readiness</h3>
              <p>Buses assigned to organization fleet</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage("buses")}>
              Manage Fleet
            </button>
          </div>
          {orgBuses.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              <Bus size={32} style={{ opacity: 0.5, marginBottom: "0.5rem" }} />
              <div>No vehicles registered in fleet yet.</div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "0.75rem" }}
                onClick={() => setActivePage("buses")}
              >
                <Plus size={14} /> Register First Bus
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plate #</th>
                  <th>Model</th>
                  <th>Capacity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orgBuses.slice(0, 6).map((b) => (
                  <tr key={b.id}>
                    <td><code>{b.plateNumber}</code></td>
                    <td><strong>{b.model}</strong></td>
                    <td>{b.capacity} Seats</td>
                    <td><Badge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboardPage;
