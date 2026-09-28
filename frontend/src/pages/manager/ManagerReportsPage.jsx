import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import {
  BarChart3,
  TrendingUp,
  Ticket,
  Grid3X3,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw
} from "lucide-react";

const MetricBlock = ({ label, value, sub, trend }) => (
  <div
    style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-color)",
      borderRadius: "10px",
      padding: "1.25rem 1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.35rem",
    }}
  >
    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {label}
    </div>
    <div style={{ fontSize: "1.65rem", fontWeight: 700, color: "var(--text-main)", lineHeight: 1.2 }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{sub}</div>
    )}
    {trend !== undefined && (
      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: 600, marginTop: "0.1rem",
        color: trend > 0 ? "var(--success-text)" : trend < 0 ? "var(--danger-text)" : "var(--text-muted)" }}>
        {trend > 0 ? <ArrowUpRight size={13} /> : trend < 0 ? <ArrowDownRight size={13} /> : <Minus size={13} />}
        {trend > 0 ? `+${trend}%` : trend < 0 ? `${trend}%` : "No change"}
      </div>
    )}
  </div>
);

const OccupancyBar = ({ value }) => {
  const pct = Math.min(Number(value), 100);
  const fillColor =
    pct >= 75 ? "var(--success)" : pct >= 40 ? "var(--warning)" : "#cbd5e1";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      <div
        style={{
          flex: 1,
          height: "6px",
          background: "#f1f5f9",
          borderRadius: "99px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: fillColor,
            borderRadius: "99px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-main)", minWidth: "36px", textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
};

export const ManagerReportsPage = () => {
  const {
    activeOrg,
    trips,
    bookings,
    selectedOrgId,
    coordinatorStats,
    fetchCoordinatorData,
    isLoadingData,
    showToast
  } = useApp();
  const [activeTab, setActiveTab] = useState("routes");

  const orgTrips = trips.filter((t) => t.organizationId === selectedOrgId);
  const orgBookings = bookings.filter(
    (b) => b.organizationId === selectedOrgId && (b.status === "CONFIRMED" || b.status === "SUCCESS")
  );

  const totalRev = coordinatorStats?.payments?.totalRevenue ?? orgBookings.reduce(
    (acc, b) => acc + Number(b.totalFare || b.amount || 0),
    0
  );
  const totalBookedSeats = coordinatorStats?.bookings?.confirmed ?? orgTrips.reduce(
    (acc, t) => acc + (t.bookedSeatsCount || 0),
    0
  );
  const totalCap = orgTrips.reduce((acc, t) => acc + (t.totalSeats || 0), 0);
  const seatUtilizationRate =
    totalCap > 0 ? ((totalBookedSeats / totalCap) * 100).toFixed(1) : "0.0";

  const publishedTrips = coordinatorStats?.trips?.scheduled ?? orgTrips.filter((t) => t.status === "PUBLISHED" || t.status === "SCHEDULED").length;
  const draftTrips = orgTrips.filter((t) => t.status === "DRAFT").length;
  const cancelledTrips = coordinatorStats?.trips?.cancelled ?? orgTrips.filter((t) => t.status === "CANCELLED").length;

  const handleExport = (format) => {
    if (format === "CSV") {
      const rows = [
        ["Trip Code", "Route", "Departure Date", "Booked Seats", "Total Capacity", "Status", "Fare (ETB)"],
        ...orgTrips.map((t) => [
          t.tripCode,
          `"${t.routeName}"`,
          t.departureDate,
          t.bookedSeatsCount,
          t.totalSeats,
          t.status,
          t.fareAmount || 0
        ])
      ];
      const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${(activeOrg?.name || "org").replace(/\s+/g, "_")}_report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Exported ${activeOrg?.name} report as CSV!`);
    } else {
      showToast(`Generating ${activeOrg?.name} PDF report preview...`);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Reports & Analytics</h1>
          <p>Route performance, booking volumes, and revenue breakdown for {activeOrg?.name || "organization"}.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchCoordinatorData(selectedOrgId)}
            disabled={isLoadingData}
          >
            <RefreshCw size={14} className={isLoadingData ? "spin" : ""} /> Refresh
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport("CSV")}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => handleExport("PDF")}>
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <MetricBlock
          label="Gross Revenue"
          value={`${totalRev.toLocaleString()} ETB`}
          sub="Confirmed bookings only"
          trend={12}
        />
        <MetricBlock
          label="Seat Utilization"
          value={`${seatUtilizationRate}%`}
          sub={`${totalBookedSeats} / ${totalCap} seats filled`}
        />
        <MetricBlock
          label="Confirmed Bookings"
          value={orgBookings.length}
          sub="Paid passenger reservations"
        />
        <MetricBlock
          label="Total Trips"
          value={orgTrips.length}
          sub={`${publishedTrips} published · ${draftTrips} draft`}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1.25rem" }}>
        {[
          { key: "routes", label: "Route Breakdown" },
          { key: "status", label: "Trip Status" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "0.55rem 1rem",
              fontSize: "0.82rem",
              fontWeight: 600,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderBottom: activeTab === tab.key
                ? "2px solid var(--primary)"
                : "2px solid transparent",
              color: activeTab === tab.key ? "var(--primary)" : "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Route Breakdown Table */}
      {activeTab === "routes" && (
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3>Route Revenue Performance</h3>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Trip Code</th>
                <th>Fare (ETB)</th>
                <th>Booked</th>
                <th>Available</th>
                <th>Occupancy</th>
                <th>Revenue (ETB)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orgTrips.map((t) => {
                const occupancy =
                  t.totalSeats > 0
                    ? ((t.bookedSeatsCount / t.totalSeats) * 100).toFixed(1)
                    : 0;
                const rev = t.bookedSeatsCount * t.fareAmount;
                return (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.routeName}</strong>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        {t.departureDate}
                      </div>
                    </td>
                    <td><code>{t.tripCode}</code></td>
                    <td>{t.fareAmount?.toLocaleString()}</td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{t.bookedSeatsCount}</span>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{t.availableSeatsCount}</td>
                    <td style={{ minWidth: "140px" }}>
                      <OccupancyBar value={occupancy} />
                    </td>
                    <td>
                      <strong>{rev.toLocaleString()}</strong>
                    </td>
                    <td>
                      <Badge status={t.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Trip Status Distribution */}
      {activeTab === "status" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}
        >
          {/* Status Summary */}
          <div className="card-table-wrapper" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1.25rem" }}>
              Trip Status Distribution
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { label: "Published", value: publishedTrips, total: orgTrips.length },
                { label: "Draft", value: draftTrips, total: orgTrips.length },
                { label: "Cancelled", value: cancelledTrips, total: orgTrips.length },
              ].map((item) => {
                const pct = orgTrips.length > 0 ? ((item.value / orgTrips.length) * 100).toFixed(0) : 0;
                return (
                  <div key={item.label}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        marginBottom: "0.35rem",
                      }}
                    >
                      <span>{item.label}</span>
                      <span style={{ color: "var(--text-muted)" }}>
                        {item.value} trips ({pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: "8px",
                        background: "#f1f5f9",
                        borderRadius: "99px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "var(--text-main)",
                          borderRadius: "99px",
                          opacity: item.label === "Cancelled" ? 0.3 : item.label === "Draft" ? 0.6 : 1,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Booking Summary */}
          <div className="card-table-wrapper" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1.25rem" }}>
              Booking Summary
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              {[
                { label: "Total Bookings", value: orgBookings.length },
                { label: "Seats Booked", value: totalBookedSeats },
                { label: "Seats Available", value: totalCap - totalBookedSeats },
                { label: "Total Capacity", value: totalCap },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "0.85rem",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700 }}>
                    {item.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
