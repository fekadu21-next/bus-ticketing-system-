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
  ShieldCheck
} from "lucide-react";

export const ManagerDashboardPage = () => {
  const {
    activeOrg,
    buses,
    trips,
    bookings,
    payments,
    drivers,
    verifiers,
    setActivePage,
    selectedOrgId
  } = useApp();

  // Filter org-scoped data automatically (Organization Scope Guard)
  const orgBuses = buses.filter((b) => b.organizationId === selectedOrgId);
  const orgTrips = trips.filter((t) => t.organizationId === selectedOrgId);
  const orgBookings = bookings.filter((b) => b.organizationId === selectedOrgId);
  const orgPayments = payments.filter((p) => p.organizationId === selectedOrgId);
  const orgDrivers = drivers.filter((d) => d.organizationId === selectedOrgId);

  const activeBuses = orgBuses.filter((b) => b.status === "ACTIVE").length;
  const publishedTrips = orgTrips.filter((t) => t.status === "PUBLISHED").length;
  const totalBookedSeats = orgTrips.reduce((acc, t) => acc + (t.bookedSeatsCount || 0), 0);
  const totalCapacity = orgTrips.reduce((acc, t) => acc + (t.totalSeats || 0), 0);
  const availableSeats = totalCapacity - totalBookedSeats;

  const paidBookingsCount = orgBookings.filter((b) => b.paymentStatus === "SUCCESS").length;
  const unassignedTrips = orgTrips.filter((t) => t.driverName === "Unassigned" || !t.driverId);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>{activeOrg?.name || "Organization"} Operational Dashboard</h1>
          <p>Fleet, route schedule, and booking overview.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={() => setActivePage("trips")}>
            <CalendarDays size={15} /> Scheduled Trips
          </button>
          <button className="btn btn-primary" onClick={() => setActivePage("trips")}>
            <Plus size={15} /> Create Trip
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Fleet Buses"
          value={orgBuses.length}
          icon={Bus}
          subtitle={`${activeBuses} active, ${orgBuses.length - activeBuses} maintenance`}
          onClick={() => setActivePage("buses")}
        />
        <StatCard
          title="Active Published Trips"
          value={publishedTrips}
          icon={CalendarDays}
          subtitle="Open for passenger bookings"
          onClick={() => setActivePage("trips")}
        />
        <StatCard
          title="Booked Seats Today"
          value={totalBookedSeats}
          icon={Ticket}
          subtitle={`Out of ${totalCapacity} total seat inventory`}
          onClick={() => setActivePage("seats")}
        />
        <StatCard
          title="Available Seats"
          value={availableSeats > 0 ? availableSeats : 0}
          icon={Grid3X3}
          subtitle="Unreserved seats ready for purchase"
          onClick={() => setActivePage("seats")}
        />
        <StatCard
          title="Paid Bookings"
          value={paidBookingsCount}
          icon={CreditCard}
          subtitle="Verified payment success"
          onClick={() => setActivePage("bookings")}
        />
        <StatCard
          title="Assigned Drivers"
          value={orgDrivers.length}
          icon={UserCheck}
          subtitle="Eligible staff assigned"
          onClick={() => setActivePage("drivers")}
        />
      </div>

      {/* Unassigned Driver Warning Alert */}
      {unassignedTrips.length > 0 && (
        <div className="card-table-wrapper" style={{ borderLeft: "4px solid var(--warning)", marginBottom: "1.5rem" }}>
          <div className="card-header-toolbar" style={{ background: "var(--warning-bg)" }}>
            <div className="card-title">
              <h3 style={{ color: "var(--warning-text)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertTriangle size={18} /> Operational Exception: Unassigned Drivers ({unassignedTrips.length})
              </h3>
              <p style={{ color: "var(--warning-text)" }}>
                The following scheduled trips require an assigned eligible driver before vehicle departure.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage("trips")}>
              Assign Drivers <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Operational Sections Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Today's Scheduled Departure Trips */}
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3>Today's Organization Trips</h3>
              <p>Fleet schedule & departure progress</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage("trips")}>
              View All
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Trip Code</th>
                <th>Route</th>
                <th>Driver</th>
                <th>Seats</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orgTrips.map((t) => (
                <tr key={t.id}>
                  <td><code>{t.tripCode}</code></td>
                  <td>{t.routeName}</td>
                  <td>{t.driverName}</td>
                  <td><span style={{ fontWeight: 700 }}>{t.bookedSeatsCount}/{t.totalSeats}</span></td>
                  <td><Badge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fleet Vehicle Status Summary */}
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3>Fleet Readiness & Vehicle Status</h3>
              <p>Registered buses available for trip scheduling</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage("buses")}>
              Manage Fleet
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Bus #</th>
                <th>Plate Number</th>
                <th>Model</th>
                <th>Capacity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orgBuses.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.busNumber}</strong></td>
                  <td><code>{b.plateNumber}</code></td>
                  <td>{b.model}</td>
                  <td>{b.capacity} Seats</td>
                  <td><Badge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
