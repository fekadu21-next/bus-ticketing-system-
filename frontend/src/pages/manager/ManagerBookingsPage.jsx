import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Ticket, Search } from "lucide-react";

export const ManagerBookingsPage = () => {
  const { bookings, selectedOrgId } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const orgBookings = bookings.filter((b) => b.organizationId === selectedOrgId);
  const filteredBookings = orgBookings.filter((b) => {
    const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
    const matchesSearch =
      b.bookingReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.passengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tripCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Company Bookings Monitor</h1>
          <p>Operational view of passenger reservations, seat allocations, and payment statuses for your organization.</p>
        </div>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div className="header-search" style={{ width: "260px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search booking ref, passenger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Booking Ref</th>
              <th>Passenger Identity</th>
              <th>Trip / Route</th>
              <th>Seat #</th>
              <th>Total Amount</th>
              <th>Payment State</th>
              <th>Booking Status</th>
              <th>Created Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((b) => (
              <tr key={b.id}>
                <td><code>{b.bookingReference}</code></td>
                <td>
                  <strong>{b.passengerName}</strong>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.passengerPhone}</div>
                </td>
                <td>
                  <div>{b.routeName}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.tripCode}</div>
                </td>
                <td><span style={{ fontWeight: 700 }}>Seat {b.seatNumber}</span></td>
                <td><strong>{b.amount} ETB</strong></td>
                <td><Badge status={b.paymentStatus} /></td>
                <td><Badge status={b.status} /></td>
                <td>{b.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
