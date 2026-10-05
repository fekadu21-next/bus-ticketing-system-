import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Ticket, Search, RefreshCw, Eye, User, Calendar, CreditCard } from "lucide-react";

export const ManagerBookingsPage = () => {
  const {
    bookings,
    selectedOrgId,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const orgBookings = bookings.filter((b) => b.organizationId === selectedOrgId);
  const filteredBookings = orgBookings.filter((b) => {
    const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (b.bookingReference && b.bookingReference.toLowerCase().includes(q)) ||
      (b.passengerName && b.passengerName.toLowerCase().includes(q)) ||
      (b.passengerPhone && b.passengerPhone.toLowerCase().includes(q)) ||
      (b.routeName && b.routeName.toLowerCase().includes(q)) ||
      (b.tripCode && b.tripCode.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Company Bookings & Tickets</h1>
          <p>Operational view of passenger reservations, seat allocations, and payment verification for your fleet.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchCoordinatorData(selectedOrgId)}
          disabled={isLoadingData}
        >
          <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div className="header-search" style={{ width: "260px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search booking ref, passenger, phone..."
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
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Total Bookings: <strong>{orgBookings.length}</strong>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <Ticket size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>No bookings found matching your search.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Passenger Identity</th>
                <th>Trip / Route</th>
                <th>Seat #</th>
                <th>Total Fare</th>
                <th>Payment State</th>
                <th>Booking Status</th>
                <th>Date</th>
                <th>Details</th>
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
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.tripCode || "Scheduled Departure"}</div>
                  </td>
                  <td><span style={{ fontWeight: 700 }}>Seat {b.seatNumber}</span></td>
                  <td><strong>{b.totalFare || b.amount || 0} ETB</strong></td>
                  <td><Badge status={b.paymentStatus || "PENDING"} /></td>
                  <td><Badge status={b.status} /></td>
                  <td>{b.bookingDate || b.createdAt || "—"}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedBooking(b)}
                    >
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <Modal
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          title={`Booking Details: ${selectedBooking.bookingReference}`}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
              <button className="btn btn-secondary" onClick={() => setSelectedBooking(null)}>
                Close
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-color)" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Reference Code</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 700 }}><code>{selectedBooking.bookingReference}</code></div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Badge status={selectedBooking.status} />
                <Badge status={selectedBooking.paymentStatus || "PENDING"} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Passenger Name</span>
                <strong>{selectedBooking.passengerName}</strong>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  {selectedBooking.passengerPhone}
                </div>
                {selectedBooking.passengerEmail && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {selectedBooking.passengerEmail}
                  </div>
                )}
              </div>

              <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Seat Allocation</span>
                <strong style={{ fontSize: "1.2rem", color: "var(--primary)" }}>Seat #{selectedBooking.seatNumber}</strong>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  Fare: <strong>{selectedBooking.totalFare || selectedBooking.amount || 0} ETB</strong>
                </div>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Assigned Corridor & Trip</span>
              <strong>{selectedBooking.routeName}</strong>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                Departure: {selectedBooking.bookingDate || selectedBooking.createdAt || "Standard Service"}
              </div>
            </div>

            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.75rem", borderRadius: "6px" }}>
              Ticket verification is processed via physical station staff with the mobile Ticket Verifier terminal. Confirmed bookings are immediately redeemable for boarding.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManagerBookingsPage;
