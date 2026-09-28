import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Ticket, Search, ExternalLink, RefreshCw } from "lucide-react";

export const AdminBookingsPage = () => {
  const { bookings, organizations, setActivePage, isLoadingData, fetchAdminData } = useApp();
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBookings = bookings.filter((b) => {
    const matchesOrg = filterOrg === "ALL" || b.organizationId === filterOrg;
    const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (b.bookingReference || "").toLowerCase().includes(q) ||
      (b.passengerName || "").toLowerCase().includes(q) ||
      (b.tripCode || "").toLowerCase().includes(q) ||
      (b.routeName || "").toLowerCase().includes(q);
    return matchesOrg && matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Bookings Monitor</h1>
          <p>Supervise passenger reservations, assigned seat allocations, and payment link associations.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchAdminData()}
          title="Refresh Bookings"
        >
          <RefreshCw size={14} className={isLoadingData ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div className="header-search" style={{ width: "260px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search ref #, passenger name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing <strong>{filteredBookings.length}</strong> of <strong>{bookings.length}</strong> reservations
          </div>
        </div>

        <table className="data-table">
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
  );
};
