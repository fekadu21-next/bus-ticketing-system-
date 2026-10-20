import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
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
  Clock,
  DollarSign,
  Calendar,
} from "lucide-react";

export const ManagerDashboardPage = () => {
  const { t } = useTranslation();
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
    settings,
    setActivePage,
    selectedOrgId,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  const [dateFilter, setDateFilter] = React.useState("ALL"); // ALL, TODAY, CUSTOM
  const [customDate, setCustomDate] = React.useState("");

  const commissionPercent = Number(settings?.platformFeePercent ?? 5.0);
  const commissionRate = commissionPercent / 100;
  const todayStr = new Date().toISOString().split("T")[0];

  const isTodayDate = (dateVal) => {
    if (!dateVal) return false;
    if (typeof dateVal === "string" && dateVal.includes(todayStr)) return true;
    const d = new Date(dateVal);
    return !isNaN(d.getTime()) && d.toISOString().split("T")[0] === todayStr;
  };

  const matchesDateFilter = (dateVal) => {
    if (dateFilter === "ALL") return true;
    if (dateFilter === "TODAY") return isTodayDate(dateVal);
    if (dateFilter === "CUSTOM" && customDate) {
      if (typeof dateVal === "string" && dateVal.includes(customDate)) return true;
      const d = new Date(dateVal);
      return !isNaN(d.getTime()) && d.toISOString().split("T")[0] === customDate;
    }
    return true;
  };

  // Filter org-scoped data automatically (Organization Scope Guard)
  const orgBuses = (buses || []).filter((b) => b.organizationId === selectedOrgId || b.organization_id === selectedOrgId);
  const orgRoutes = (routes || []).filter((r) => r.organizationId === selectedOrgId || r.organization_id === selectedOrgId);
  const orgTrips = (trips || []).filter((t) => t.organizationId === selectedOrgId || t.organization_id === selectedOrgId);
  const orgBookings = (bookings || []).filter((b) => b.organizationId === selectedOrgId || b.organization_id === selectedOrgId);
  const orgPayments = (payments || []).filter((p) => bMatchesOrg(p, selectedOrgId));
  const orgDrivers = (drivers || []).filter((d) => d.organizationId === selectedOrgId || d.organization_id === selectedOrgId);
  const orgVerifiers = (verifiers || []).filter((v) => v.organizationId === selectedOrgId || v.organization_id === selectedOrgId);

  function bMatchesOrg(item, targetId) {
    return item?.organizationId === targetId || item?.organization_id === targetId;
  }

  // Financial & Revenue Calculations
  const completedOrgPayments = orgPayments.filter((p) => p.status === "SUCCESS" || p.status === "COMPLETED");
  const totalGrossRevenue = coordinatorStats?.payments?.totalRevenue && coordinatorStats?.payments?.totalRevenue > 0
    ? coordinatorStats.payments.totalRevenue
    : completedOrgPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const platformCommissionFee = totalGrossRevenue * commissionRate;
  const netCompanyRevenue = totalGrossRevenue * (1 - commissionRate);

  // Today's Payments & Revenue
  const todayOrgPayments = completedOrgPayments.filter((p) => isTodayDate(p.createdAt || p.created_at || p.paidAt));
  const todayGrossRevenue = coordinatorStats?.today?.revenue && coordinatorStats?.today?.revenue > 0
    ? coordinatorStats.today.revenue
    : todayOrgPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const todayPlatformFee = todayGrossRevenue * commissionRate;
  const todayNetRevenue = todayGrossRevenue * (1 - commissionRate);

  const todayOrgBookings = orgBookings.filter((b) => isTodayDate(b.bookingDate || b.created_at));

  // High-fidelity operational calculations
  const totalBusesCount = coordinatorStats?.buses?.total ?? orgBuses.length;
  const activeBuses = coordinatorStats?.buses?.active ?? orgBuses.filter((b) => b.status === "ACTIVE").length;
  const totalRoutesCount = coordinatorStats?.routes?.total ?? orgRoutes.length;
  const publishedTrips = coordinatorStats?.trips?.scheduled ?? orgTrips.filter((t) => t.status === "PUBLISHED" || t.status === "SCHEDULED").length;

  const tripSeatsSum = orgTrips.reduce((acc, t) => acc + (t.bookedSeatsCount || 0), 0);
  const confirmedBookingsCount = orgBookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING").length;
  const totalBookedSeats = tripSeatsSum > 0 ? tripSeatsSum : confirmedBookingsCount;
  const totalCapacity = orgTrips.reduce((acc, t) => acc + (t.totalSeats || 0), 0);
  const availableSeats = Math.max(0, totalCapacity - totalBookedSeats);

  const paidBookingsCount = coordinatorStats?.payments?.totalCompletedTransactions ?? orgBookings.filter((b) => b.paymentStatus === "SUCCESS").length;
  const todayTrips = coordinatorStats?.today?.tripsCount ?? orgTrips.filter((t) => isTodayDate(t.departureDate)).length;

  const activeDriversCount = coordinatorStats?.staff?.drivers?.active ?? orgDrivers.filter((d) => d.status === "ACTIVE").length;
  const activeVerifiersCount = coordinatorStats?.staff?.verifiers?.active ?? orgVerifiers.filter((v) => v.status === "ACTIVE").length;

  const unassignedTrips = orgTrips.filter((t) => t.driverName === "Unassigned" || !t.driverId);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>{activeOrg?.name || "Company"} {t("managerDashboard.title")}</h1>
          <p>{t("managerDashboard.subtitle")}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Date Filter Toolbar */}
          <div style={{ display: "flex", alignItems: "center", background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "8px", padding: "2px 4px" }}>
            <button
              className={`btn btn-sm ${dateFilter === "ALL" ? "btn-primary" : "btn-secondary"}`}
              style={{ border: "none", fontSize: "0.75rem", padding: "4px 8px" }}
              onClick={() => { setDateFilter("ALL"); setCustomDate(""); }}
            >
              {t("managerDashboard.allTime")}
            </button>
            <button
              className={`btn btn-sm ${dateFilter === "TODAY" ? "btn-primary" : "btn-secondary"}`}
              style={{ border: "none", fontSize: "0.75rem", padding: "4px 8px" }}
              onClick={() => { setDateFilter("TODAY"); setCustomDate(todayStr); }}
            >
              📅 {t("managerDashboard.today")}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", paddingLeft: "4px" }}>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateFilter(e.target.value ? "CUSTOM" : "ALL");
                }}
                style={{ fontSize: "0.75rem", padding: "2px 6px", border: "1px solid var(--border-color, #cbd5e1)", borderRadius: "4px", background: "var(--input-bg, #ffffff)", color: "var(--input-text, #0f172a)" }}
              />
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => fetchCoordinatorData(selectedOrgId)}
            disabled={isLoadingData}
            title="Reload metrics from backend"
          >
            <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> {t("common.refresh", "Refresh")}
          </button>
          <button className="btn btn-secondary" onClick={() => setActivePage("buses")}>
            <Bus size={15} /> {t("managerDashboard.fleetBuses")}
          </button>
          <button className="btn btn-secondary" onClick={() => setActivePage("routes")}>
            <MapPin size={15} /> {t("managerDashboard.activeCorridors")}
          </button>
          <button className="btn btn-primary" onClick={() => setActivePage("trips")}>
            <Plus size={15} /> {t("managerTrips.scheduleBtn")}
          </button>
        </div>
      </div>

      {/* Operator Financial & Net Revenue KPI Section */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.45rem", color: "var(--text-main)" }}>
            <TrendingUp size={18} color="var(--primary)" /> {t("managerDashboard.companyFinancials")}
          </h2>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {t("managerDashboard.platformFee")}: <strong>{commissionPercent}%</strong> | {t("managerDashboard.companyNetShare")}: <strong style={{ color: "#10b981" }}>{(100 - commissionPercent).toFixed(1)}%</strong>
            {dateFilter !== "ALL" && <span style={{ marginLeft: "0.5rem", background: "rgba(59, 130, 246, 0.1)", color: "var(--primary)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>Filter: {dateFilter === "TODAY" ? "Today" : customDate}</span>}
          </span>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
          <StatCard
            title={t("managerDashboard.totalPayments")}
            value={`${Math.round(totalGrossRevenue).toLocaleString()} ETB`}
            icon={CreditCard}
            subtitle={`${completedOrgPayments.length} paid reservations`}
            onClick={() => setActivePage("payments")}
          />
          <StatCard
            title={t("managerDashboard.netRevenue")}
            value={`${Math.round(netCompanyRevenue).toLocaleString()} ETB`}
            icon={DollarSign}
            trend={`${(100 - commissionPercent).toFixed(1)}% Net`}
            subtitle={`After ${commissionPercent}% platform commission`}
            onClick={() => setActivePage("payments")}
          />
          <StatCard
            title={t("managerDashboard.commissionPaid")}
            value={`${Math.round(platformCommissionFee).toLocaleString()} ETB`}
            icon={TrendingUp}
            subtitle={`${commissionPercent}% service commission fee`}
            onClick={() => setActivePage("payments")}
          />
          <StatCard
            title={t("managerDashboard.todayPayments")}
            value={`${Math.round(todayGrossRevenue).toLocaleString()} ETB`}
            icon={CalendarDays}
            subtitle={`${todayOrgPayments.length} transactions processed today`}
            onClick={() => setActivePage("payments")}
          />
          <StatCard
            title={t("managerDashboard.todayNet")}
            value={`${Math.round(todayNetRevenue).toLocaleString()} ETB`}
            icon={DollarSign}
            trend={`Daily Net`}
            subtitle={`Your company take-home today`}
            onClick={() => setActivePage("payments")}
          />
        </div>
      </div>

      {/* Operational Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard
          title={t("managerDashboard.fleetBuses")}
          value={totalBusesCount}
          icon={Bus}
          subtitle={`${activeBuses} active in service, ${totalBusesCount - activeBuses} maintenance`}
          onClick={() => setActivePage("buses")}
        />
        <StatCard
          title={t("managerDashboard.activeCorridors")}
          value={totalRoutesCount}
          icon={MapPin}
          subtitle={`${orgRoutes.filter((r) => r.status === "ACTIVE").length} operable intercity routes`}
          onClick={() => setActivePage("routes")}
        />
        <StatCard
          title={t("managerDashboard.scheduledDepartures")}
          value={publishedTrips}
          icon={CalendarDays}
          subtitle={`${todayTrips} departure(s) today`}
          onClick={() => setActivePage("trips")}
        />
        <StatCard
          title={t("managerDashboard.confirmedBookings")}
          value={confirmedBookingsCount}
          icon={Ticket}
          subtitle={`${todayOrgBookings.length} booked today`}
          onClick={() => setActivePage("bookings")}
        />
        <StatCard
          title={t("managerDashboard.seatOccupancy")}
          value={totalBookedSeats}
          icon={Ticket}
          subtitle={`${availableSeats} open seats across ${totalCapacity} capacity`}
          onClick={() => setActivePage("seats")}
        />
        <StatCard
          title={t("managerDashboard.operationalStaff")}
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
                <AlertTriangle size={18} /> {t("managerDashboard.unassignedNotice")} ({unassignedTrips.length})
              </h3>
              <p style={{ color: "var(--warning-text)", margin: "0.2rem 0 0 0", fontSize: "0.82rem" }}>
                {t("managerDashboard.unassignedDesc")}
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage("trips")}>
              {t("managerDashboard.assignDriversBtn")} <ArrowRight size={14} />
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
              <h3>{t("managerDashboard.upcomingDepartures")}</h3>
              <p>Next scheduled trips for this organization</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage("trips")}>
              {t("managerDashboard.viewAllTrips")}
            </button>
          </div>
          {orgTrips.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              <Clock size={32} style={{ opacity: 0.5, marginBottom: "0.5rem" }} />
              <div>{t("managerTrips.noTrips")}</div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "0.75rem" }}
                onClick={() => setActivePage("trips")}
              >
                <Plus size={14} /> {t("managerTrips.scheduleFirst")}
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("managerTrips.tableTripCode")}</th>
                  <th>{t("managerTrips.tableRoute")}</th>
                  <th>{t("managerTrips.tableDriver")}</th>
                  <th>{t("managerTrips.tableDeparture")}</th>
                  <th>{t("managerTrips.tableSeats")}</th>
                  <th>{t("managerTrips.tableStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {orgTrips.slice(0, 6).map((tItem) => (
                  <tr key={tItem.id}>
                    <td><code>{tItem.tripCode}</code></td>
                    <td><strong>{tItem.routeName}</strong></td>
                    <td>
                      <span style={{ color: tItem.driverName === "Unassigned" ? "var(--warning-text)" : "inherit" }}>
                        {tItem.driverName === "Unassigned" ? t("managerTrips.unassigned") : tItem.driverName}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{tItem.departureDate}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 700 }}>{tItem.departureTime}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>
                        {tItem.bookedSeatsCount} / {tItem.totalSeats}
                      </span>
                    </td>
                    <td><Badge status={tItem.status} /></td>
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
              <h3>{t("managerDashboard.fleetReadiness")}</h3>
              <p>Buses assigned to organization fleet</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage("buses")}>
              {t("managerDashboard.manageFleet")}
            </button>
          </div>
          {orgBuses.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              <Bus size={32} style={{ opacity: 0.5, marginBottom: "0.5rem" }} />
              <div>{t("managerBuses.noBuses")}</div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "0.75rem" }}
                onClick={() => setActivePage("buses")}
              >
                <Plus size={14} /> {t("managerBuses.registerFirst")}
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("managerBuses.tablePlate")}</th>
                  <th>{t("managerBuses.tableModel")}</th>
                  <th>{t("managerBuses.tableCapacity")}</th>
                  <th>{t("managerBuses.tableStatus")}</th>
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

      {/* Personnel Management Sections */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
        {/* Drivers Section */}
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <UserCheck size={18} color="var(--primary)" /> {t("managerDashboard.activeDrivers")}
              </h3>
              <p>Registered drivers and their status</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage("drivers")}>
              {t("managerDashboard.manageDrivers")}
            </button>
          </div>
          {orgDrivers.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              <UserCheck size={32} style={{ opacity: 0.5, marginBottom: "0.5rem" }} />
              <div>{t("managerDrivers.noDrivers")}</div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "0.75rem" }}
                onClick={() => setActivePage("drivers")}
              >
                <Plus size={14} /> {t("managerDrivers.registerFirst")}
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("managerDrivers.tableName")}</th>
                  <th>{t("managerDrivers.tablePhone")}</th>
                  <th>{t("managerDrivers.tableStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {orgDrivers.slice(0, 5).map((d) => (
                  <tr key={d.id}>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.phone || "—"}</td>
                    <td><Badge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Ticket Verifiers Section */}
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <QrCode size={18} color="#8b5cf6" /> {t("managerDashboard.ticketVerifiers")}
              </h3>
              <p>Station-based verification staff</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage("verifiers")}>
              {t("managerDashboard.manageVerifiers")}
            </button>
          </div>
          {orgVerifiers.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              <QrCode size={32} style={{ opacity: 0.5, marginBottom: "0.5rem" }} />
              <div>{t("managerVerifiers.noVerifiers")}</div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "0.75rem" }}
                onClick={() => setActivePage("verifiers")}
              >
                <Plus size={14} /> {t("managerVerifiers.registerFirst")}
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("managerVerifiers.tableName")}</th>
                  <th>{t("managerVerifiers.tableStation")}</th>
                  <th>{t("managerVerifiers.tableStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {orgVerifiers.slice(0, 5).map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.name}</strong></td>
                    <td>{v.assignedStation || "—"}</td>
                    <td><Badge status={v.status} /></td>
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
