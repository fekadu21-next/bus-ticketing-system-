import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Ticket, Search, ExternalLink, RefreshCw, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";

export const AdminBookingsPage = () => {
  const { bookings, organizations, settings, setActivePage, isLoadingData, fetchAdminData } = useApp();
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("ALL"); // ALL, TODAY, CUSTOM
  const [customDate, setCustomDate] = useState("");

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

  // Scope bookings by organization
  const orgScopedBookings = bookings.filter((b) => {
    if (filterOrg === "ALL") return true;
    return (
      b.organizationId === filterOrg ||
      b.organization_id === filterOrg ||
      (organizations.find((o) => o.id === filterOrg)?.name &&
        b.organizationName?.toLowerCase() === organizations.find((o) => o.id === filterOrg)?.name?.toLowerCase())
    );
  });

  // Financial & Bookings Calculations
  const allBookingsGross = orgScopedBookings.reduce((acc, b) => acc + (Number(b.totalFare || b.amount) || 0), 0);
  const allBookingsCommission = allBookingsGross * commissionRate;

  const todayBookings = orgScopedBookings.filter((b) => isTodayDate(b.bookingDate || b.created_at));
  const todayBookingsGross = todayBookings.reduce((acc, b) => acc + (Number(b.totalFare || b.amount) || 0), 0);
  const todayBookingsCommission = todayBookingsGross * commissionRate;

  const filteredBookings = orgScopedBookings.filter((b) => {
    const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
    const matchesDate = matchesDateFilter(b.bookingDate || b.created_at);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (b.bookingReference || "").toLowerCase().includes(q) ||
      (b.passengerName || "").toLowerCase().includes(q) ||
      (b.tripCode || "").toLowerCase().includes(q) ||
      (b.routeName || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch && matchesDate;
  });

  const filteredGross = filteredBookings.reduce((acc, b) => acc + (Number(b.totalFare || b.amount) || 0), 0);
  const filteredCommission = filteredGross * commissionRate;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Bookings & Revenue Monitor</h1>
          <p>Supervise passenger reservations, booking revenue, and platform commissions ({commissionPercent}%).</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchAdminData()}
          title="Refresh Bookings"
        >
          <RefreshCw size={14} className={isLoadingData ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Booking Financial Cards */}
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard
          title="Total Bookings Value"
          value={`${Math.round(allBookingsGross).toLocaleString()} ETB`}
          icon={Ticket}
          subtitle={filterOrg === "ALL" ? `${bookings.length} reservations platform-wide` : `${orgScopedBookings.length} reservations for operator`}
        />
        <StatCard
          title="Platform Commission"
          value={`${Math.round(allBookingsCommission).toLocaleString()} ETB`}
          icon={DollarSign}
          trend={`${commissionPercent}% Fee`}
          subtitle={`Platform commission from bookings`}
        />
        <StatCard
          title="Today's Bookings Value"
          value={`${Math.round(todayBookingsGross).toLocaleString()} ETB`}
          icon={Calendar}
          subtitle={`${todayBookings.length} bookings created today`}
        />
        <StatCard
          title="Today's Commission"
          value={`${Math.round(todayBookingsCommission).toLocaleString()} ETB`}
          icon={TrendingUp}
          trend={`Daily ${commissionPercent}%`}
          subtitle={`Platform share from today's bookings`}
        />
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <div className="header-search" style={{ width: "220px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search ref #, passenger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Quick Date Filters */}
            <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "2px 4px" }}>
              <button
                type="button"
                className={`btn btn-sm ${dateFilter === "ALL" ? "btn-primary" : "btn-secondary"}`}
                style={{ border: "none", fontSize: "0.75rem", padding: "3px 8px" }}
                onClick={() => { setDateFilter("ALL"); setCustomDate(""); }}
              >
                All Dates
              </button>
              <button
                type="button"
                className={`btn btn-sm ${dateFilter === "TODAY" ? "btn-primary" : "btn-secondary"}`}
                style={{ border: "none", fontSize: "0.75rem", padding: "3px 8px" }}
                onClick={() => { setDateFilter("TODAY"); setCustomDate(todayStr); }}
              >
                Today
              </button>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateFilter(e.target.value ? "CUSTOM" : "ALL");
                }}
                style={{ fontSize: "0.75rem", padding: "2px 6px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
              />
            </div>

            <select
              className="org-selector-select"
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
            >
              <option value="ALL">All Operators</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All States</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing <strong>{filteredBookings.length}</strong> bookings | Value: <strong style={{ color: "var(--primary)" }}>{Math.round(filteredGross).toLocaleString()} ETB</strong> (Comm: {Math.round(filteredCommission).toLocaleString()} ETB)
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: "1000px" }}>
          <thead>
            <tr>
              <th>Booking Ref</th>
              <th>Passenger</th>
              <th>Operator Company</th>
              <th>Trip / Route</th>
              <th>Seat #</th>
              <th>Total Fare</th>
              <th>Payment State</th>
              <th>Booking Status</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingData && bookings.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "2.5rem" }}>
                  <LoadingSpinner label="Loading platform bookings..." />
                </td>
              </tr>
            ) : filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                  No reservations found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr key={b.id}>
                  <td><code>{b.bookingReference}</code></td>
                  <td>
                    <strong>{b.passengerName}</strong>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.passengerPhone}</div>
                  </td>
                  <td>{b.organizationName}</td>
                  <td>
                    <div>{b.routeName}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.tripCode}</div>
                  </td>
                  <td><span style={{ fontWeight: 700 }}>Seat {b.seatNumber}</span></td>
                  <td><strong>{b.amount ?? b.totalFare ?? 0} ETB</strong></td>
                  <td><Badge status={b.paymentStatus} /></td>
                  <td><Badge status={b.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="View Payment"
                        onClick={() => setActivePage("payments")}
                      >
                        Payment <ExternalLink size={12} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="View Ticket"
                        onClick={() => setActivePage("tickets")}
                      >
                        Ticket <ExternalLink size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
