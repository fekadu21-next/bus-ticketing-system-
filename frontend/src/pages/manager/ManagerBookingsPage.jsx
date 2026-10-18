import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { Ticket, Search, RefreshCw, Eye, User, Calendar, CreditCard, DollarSign, TrendingUp } from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";

export const ManagerBookingsPage = () => {
  const {
    bookings,
    selectedOrgId,
    settings,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [dateFilter, setDateFilter] = useState("ALL"); // ALL, TODAY, CUSTOM
  const [customDate, setCustomDate] = useState("");

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, dateFilter, customDate]);

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

  const orgBookings = bookings.filter((b) => b.organizationId === selectedOrgId || b.organization_id === selectedOrgId);

  // Financial calculations
  const totalGrossValue = orgBookings.reduce((acc, b) => acc + (Number(b.totalFare || b.amount) || 0), 0);
  const totalNetRevenue = totalGrossValue * (1 - commissionRate);
  const totalCommissionDeducted = totalGrossValue * commissionRate;

  const todayBookings = orgBookings.filter((b) => isTodayDate(b.bookingDate || b.created_at));
  const todayGrossValue = todayBookings.reduce((acc, b) => acc + (Number(b.totalFare || b.amount) || 0), 0);
  const todayNetRevenue = todayGrossValue * (1 - commissionRate);

  const filteredBookings = orgBookings.filter((b) => {
    const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
    const matchesDate = matchesDateFilter(b.bookingDate || b.created_at);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (b.bookingReference && b.bookingReference.toLowerCase().includes(q)) ||
      (b.passengerName && b.passengerName.toLowerCase().includes(q)) ||
      (b.passengerPhone && b.passengerPhone.toLowerCase().includes(q)) ||
      (b.routeName && b.routeName.toLowerCase().includes(q)) ||
      (b.tripCode && b.tripCode.toLowerCase().includes(q));
    return matchesStatus && matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1;
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const filteredGross = filteredBookings.reduce((acc, b) => acc + (Number(b.totalFare || b.amount) || 0), 0);
  const filteredNet = filteredGross * (1 - commissionRate);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Company Bookings & Revenue</h1>
          <p>Passenger reservations, seat allocations, net operator revenue, and platform fee ({commissionPercent}%).</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchCoordinatorData(selectedOrgId)}
          disabled={isLoadingData}
        >
          <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Financial & Net Revenue Cards */}
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard
          title="Total Bookings Value"
          value={`${Math.round(totalGrossValue).toLocaleString()} ETB`}
          icon={Ticket}
          subtitle={`${orgBookings.length} total passenger bookings`}
        />
        <StatCard
          title="Net Operator Revenue"
          value={`${Math.round(totalNetRevenue).toLocaleString()} ETB`}
          icon={DollarSign}
          trend={`${(100 - commissionPercent).toFixed(1)}% Share`}
          subtitle={`Net revenue after ${commissionPercent}% fee`}
        />
        <StatCard
          title="Today's Bookings Value"
          value={`${Math.round(todayGrossValue).toLocaleString()} ETB`}
          icon={Calendar}
          subtitle={`${todayBookings.length} bookings created today`}
        />
        <StatCard
          title="Today's Net Revenue"
          value={`${Math.round(todayNetRevenue).toLocaleString()} ETB`}
          icon={TrendingUp}
          trend={`Daily Net`}
          subtitle={`Net revenue earned today`}
        />
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <div className="header-search" style={{ width: "220px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search booking ref, passenger..."
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All States</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Showing <strong>{filteredBookings.length}</strong> bookings | Filtered Net: <strong style={{ color: "var(--primary)" }}>{Math.round(filteredNet).toLocaleString()} ETB</strong> (Gross: {Math.round(filteredGross).toLocaleString()} ETB)
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <Ticket size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>No bookings found matching your search.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "1000px" }}>
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
              {paginatedBookings.map((b) => (
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
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBookings.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          itemLabel="bookings"
        />
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
