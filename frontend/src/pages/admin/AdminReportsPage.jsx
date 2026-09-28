import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import {
  BarChart3,
  TrendingUp,
  Building2,
  Ticket,
  ShieldCheck,
  Download,
  ArrowUpRight,
} from "lucide-react";

const MetricBlock = ({ label, value, sub, highlight }) => (
  <div
    style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-color)",
      borderRadius: "10px",
      padding: "1.25rem 1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.35rem",
      borderLeft: highlight ? "3px solid var(--primary)" : undefined,
    }}
  >
    <div
      style={{
        fontSize: "0.72rem",
        fontWeight: 600,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "1.65rem",
        fontWeight: 700,
        color: "var(--text-main)",
        lineHeight: 1.2,
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{sub}</div>
    )}
  </div>
);

const ScanBar = ({ label, value, pct, shade }) => (
  <div>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "0.82rem",
        fontWeight: 600,
        marginBottom: "0.35rem",
      }}
    >
      <span>{label}</span>
      <span style={{ color: "var(--text-muted)" }}>{pct}%</span>
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
          opacity: shade,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  </div>
);

export const AdminReportsPage = () => {
  const { organizations, trips, bookings, payments, verifications, showToast } =
    useApp();
  const [activeTab, setActiveTab] = useState("operators");

  const successPayments = payments.filter((p) => p.status === "SUCCESS");
  const totalRev = successPayments.reduce((acc, p) => acc + p.amount, 0);
  const platformFees = (totalRev * 0.035).toFixed(2);
  const activeOrgs = organizations.filter((o) => o.status === "APPROVED");
  const validScans = verifications.filter((v) => v.status === "VALID").length;
  const totalScans = verifications.length;
  const scanAccuracy =
    totalScans > 0 ? ((validScans / totalScans) * 100).toFixed(1) : "0.0";

  const exportReport = (format) => {
    showToast(`Generating ${format} report...`);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Reports</h1>
          <p>Revenue, operator performance, and ticket verification analytics.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => exportReport("CSV")}
          >
            <Download size={14} /> CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => exportReport("PDF")}
          >
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Top KPI Row */}
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
          sub="All confirmed payments"
          highlight
        />
        <MetricBlock
          label="Platform Commission"
          value={`${Number(platformFees).toLocaleString()} ETB`}
          sub="3.5% fee on gross revenue"
        />
        <MetricBlock
          label="Active Operators"
          value={activeOrgs.length}
          sub={`of ${organizations.length} registered`}
        />
        <MetricBlock
          label="QR Scan Accuracy"
          value={`${scanAccuracy}%`}
          sub={`${validScans} valid of ${totalScans} total scans`}
        />
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          borderBottom: "1px solid var(--border-color)",
          marginBottom: "1.25rem",
        }}
      >
        {[
          { key: "operators", label: "Operator Revenue" },
          { key: "verification", label: "QR Verification" },
          { key: "trips", label: "Trip Overview" },
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
              borderBottom:
                activeTab === tab.key
                  ? "2px solid var(--primary)"
                  : "2px solid transparent",
              color:
                activeTab === tab.key
                  ? "var(--primary)"
                  : "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Operator Revenue Tab */}
      {activeTab === "operators" && (
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3>Operator Revenue Breakdown</h3>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              {organizations.length} operators
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Operator</th>
                <th>Type</th>
                <th>Status</th>
                <th>Confirmed Bookings</th>
                <th>Gross Revenue (ETB)</th>
                <th>Platform Fee (ETB)</th>
                <th>Net Operator (ETB)</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => {
                const orgBookings = bookings.filter(
                  (b) =>
                    b.organizationId === org.id && b.status === "CONFIRMED"
                );
                const rev = orgBookings.reduce((acc, b) => acc + b.amount, 0);
                const fee = (rev * 0.035).toFixed(0);
                const net = (rev - Number(fee)).toLocaleString();
                return (
                  <tr key={org.id}>
                    <td>
                      <strong>{org.name}</strong>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {org.registrationNumber}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{ fontSize: "0.78rem", fontWeight: 600 }}
                      >
                        {org.type}
                      </span>
                    </td>
                    <td>
                      <Badge status={org.status} />
                    </td>
                    <td>
                      <strong>{orgBookings.length}</strong>
                    </td>
                    <td>
                      <strong>{rev.toLocaleString()}</strong>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {Number(fee).toLocaleString()}
                    </td>
                    <td>
                      <strong>{net}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Verification Tab */}
      {activeTab === "verification" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem",
          }}
        >
          {/* Scan distribution */}
          <div className="card-table-wrapper" style={{ padding: "1.5rem" }}>
            <h3
              style={{
                fontSize: "0.9rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
              }}
            >
              Scan Result Distribution
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <ScanBar label="Valid Boarding Scans" pct={85} shade={1} />
              <ScanBar label="Already Used (Duplicate)" pct={10} shade={0.55} />
              <ScanBar label="Invalid / Wrong Trip" pct={5} shade={0.25} />
            </div>
            <div
              style={{
                marginTop: "1.5rem",
                display: "flex",
                gap: "1.5rem",
                borderTop: "1px solid var(--border-color)",
                paddingTop: "1rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Total Scans
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  {totalScans}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Valid
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  {validScans}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Accuracy Rate
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  {scanAccuracy}%
                </div>
              </div>
            </div>
          </div>

          {/* Scan log table */}
          <div className="card-table-wrapper">
            <div className="card-header-toolbar">
              <div className="card-title">
                <h3>Recent Scan Events</h3>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Station</th>
                  <th>Result</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {verifications.slice(0, 8).map((v) => (
                  <tr key={v.id}>
                    <td>
                      <code>{v.ticketNumber}</code>
                    </td>
                    <td>{v.stationName}</td>
                    <td>
                      <Badge status={v.status} />
                    </td>
                    <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {v.scannedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trip Overview Tab */}
      {activeTab === "trips" && (
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3>Platform Trip Overview</h3>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              {trips.length} total trips
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Trip Code</th>
                <th>Operator</th>
                <th>Route</th>
                <th>Departure</th>
                <th>Booked / Total</th>
                <th>Fare (ETB)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id}>
                  <td>
                    <code>{t.tripCode}</code>
                  </td>
                  <td>
                    <strong>{t.organizationName}</strong>
                  </td>
                  <td>{t.routeName}</td>
                  <td>
                    <div>{t.departureDate}</div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {t.departureTime}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>
                      {t.bookedSeatsCount}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {" "}
                      / {t.totalSeats}
                    </span>
                  </td>
                  <td>{t.fareAmount?.toLocaleString()}</td>
                  <td>
                    <Badge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
