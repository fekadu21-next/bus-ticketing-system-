import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Ticket, Search, ExternalLink, RefreshCw, DollarSign, Calendar, TrendingUp, Eye, Building2, User } from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";

export const AdminBookingsPage = () => {
  const navigate = useNavigate();
  const {
    bookings = [],
    organizations = [],
    settings,
    setActivePage,
    updateBookingStatus,
    isLoadingData,
    fetchAdminData,
    showToast,
  } = useApp();

  const [filterOrg, setFilterOrg] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("ALL"); // ALL, TODAY, CUSTOM
  const [customDate, setCustomDate] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterOrg, filterStatus, filterPaymentStatus, searchQuery, dateFilter, customDate]);

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
  const orgScopedBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filterOrg === "ALL") return true;
      return (
        b.organizationId === filterOrg ||
        b.organization_id === filterOrg ||
        (organizations.find((o) => o.id === filterOrg)?.name &&
          b.organizationName?.toLowerCase() === organizations.find((o) => o.id === filterOrg)?.name?.toLowerCase())
      );
    });
  }, [bookings, organizations, filterOrg]);

  // Financial & Bookings Calculations
  const allBookingsGross = useMemo(() => {
    return orgScopedBookings
      .filter((b) => b.status !== "CANCELLED")
      .reduce((acc, b) => acc + (Number(b.totalFare || b.amount) || 0), 0);
  }, [orgScopedBookings]);

  const allBookingsCommission = allBookingsGross * commissionRate;

  const todayBookings = useMemo(() => {
    return orgScopedBookings.filter((b) => isTodayDate(b.bookingDate || b.created_at));
  }, [orgScopedBookings, todayStr]);

  const todayBookingsGross = useMemo(() => {
    return todayBookings
      .filter((b) => b.status !== "CANCELLED")
      .reduce((acc, b) => acc + (Number(b.totalFare || b.amount) || 0), 0);
  }, [todayBookings]);

  const todayBookingsCommission = todayBookingsGross * commissionRate;

  const filteredBookings = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orgScopedBookings.filter((b) => {
      const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
      const matchesPay = filterPaymentStatus === "ALL" || b.paymentStatus === filterPaymentStatus;
      const matchesDate = matchesDateFilter(b.bookingDate || b.created_at);
      const matchesSearch =
        !q ||
        (b.bookingReference || "").toLowerCase().includes(q) ||
        (b.passengerName || "").toLowerCase().includes(q) ||
        (b.tripCode || "").toLowerCase().includes(q) ||
        (b.routeName || "").toLowerCase().includes(q) ||
        (b.passengerPhone || "").includes(q);
      return matchesStatus && matchesPay && matchesSearch && matchesDate;
    });
  }, [orgScopedBookings, filterStatus, filterPaymentStatus, searchQuery, dateFilter, customDate]);

  const filteredGross = useMemo(() => {
    return filteredBookings
      .filter((b) => b.status !== "CANCELLED")
      .reduce((acc, b) => acc + (Number(b.totalFare || b.amount) || 0), 0);
  }, [filteredBookings]);

  const filteredCommission = filteredGross * commissionRate;

  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1;
  const paginatedBookings = useMemo(() => {
    return filteredBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  const handleManualRefresh = async () => {
    if (!fetchAdminData) return;
    try {
      setIsRefreshing(true);
      await fetchAdminData();
      if (showToast) showToast("Platform bookings synchronized from backend.");
    } catch {
      if (showToast) showToast("Failed to refresh bookings.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBookingStatusChange = (bookingId, newStatus) => {
    if (updateBookingStatus) {
      updateBookingStatus(bookingId, newStatus, null);
    }
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handlePaymentStatusChange = (bookingId, newPaymentStatus) => {
    if (updateBookingStatus) {
      updateBookingStatus(bookingId, null, newPaymentStatus);
    }
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking((prev) => (prev ? { ...prev, paymentStatus: newPaymentStatus } : null));
    }
  };

  const handleNavigate = (page) => {
    setActivePage(page);
    navigate(`/admin/${page}`);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Bookings & Revenue Monitor</h1>
          <p>Supervise passenger reservations, booking status, payment states, and platform commissions ({commissionPercent}%).</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleManualRefresh}
          disabled={isRefreshing || isLoadingData}
          title="Refresh Bookings"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          <RefreshCw size={14} className={isRefreshing || isLoadingData ? "spin animate-spin" : ""} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
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
          onClick={() => handleNavigate("reports")}
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
          onClick={() => handleNavigate("reports")}
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
              <option value="ALL">🏢 All Operators</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>

            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Booking States</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            <select
              className="org-selector-select"
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
            >
              <option value="ALL">All Payment States</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing <strong>{filteredBookings.length}</strong> bookings | Filtered Fare: <strong style={{ color: "var(--primary)" }}>{Math.round(filteredGross).toLocaleString()} ETB</strong>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: "1050px" }}>
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
                <th>Actions</th>
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
                paginatedBookings.map((b) => {
                  const currentStatus = b.status || "CONFIRMED";
                  const currentPaymentStatus = b.paymentStatus || "SUCCESS";
                  return (
                    <tr key={b.id}>
                      <td><code>{b.bookingReference}</code></td>
                      <td>
                        <strong>{b.passengerName}</strong>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.passengerPhone}</div>
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                          <Building2 size={13} color="var(--primary)" />
                          {b.organizationName}
                        </span>
                      </td>
                      <td>
                        <div>{b.routeName}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.tripCode}</div>
                      </td>
                      <td><span style={{ fontWeight: 700 }}>Seat {b.seatNumber}</span></td>
                      <td><strong>{b.amount ?? b.totalFare ?? 0} ETB</strong></td>
                      <td>
                        {/* Active Payment State Selector */}
                        <select
                          className="status-selector"
                          value={currentPaymentStatus}
                          onChange={(e) => handlePaymentStatusChange(b.id, e.target.value)}
                          title="Change payment state"
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "3px 6px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-color, #cbd5e1)",
                            cursor: "pointer",
                            background:
                              currentPaymentStatus === "SUCCESS"
                                ? "rgba(16, 185, 129, 0.12)"
                                : currentPaymentStatus === "PENDING"
                                ? "rgba(245, 158, 11, 0.12)"
                                : "rgba(239, 68, 68, 0.12)",
                            color:
                              currentPaymentStatus === "SUCCESS"
                                ? "#059669"
                                : currentPaymentStatus === "PENDING"
                                ? "#d97706"
                                : "#dc2626",
                          }}
                        >
                          <option value="SUCCESS">SUCCESS</option>
                          <option value="PENDING">PENDING</option>
                          <option value="FAILED">FAILED</option>
                          <option value="REFUNDED">REFUNDED</option>
                        </select>
                      </td>
                      <td>
                        {/* Active Booking Status Selector */}
                        <select
                          className="status-selector"
                          value={currentStatus}
                          onChange={(e) => handleBookingStatusChange(b.id, e.target.value)}
                          title="Change booking status"
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "3px 6px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-color, #cbd5e1)",
                            cursor: "pointer",
                            background:
                              currentStatus === "CONFIRMED"
                                ? "rgba(16, 185, 129, 0.12)"
                                : currentStatus === "PENDING"
                                ? "rgba(245, 158, 11, 0.12)"
                                : "rgba(239, 68, 68, 0.12)",
                            color:
                              currentStatus === "CONFIRMED"
                                ? "#059669"
                                : currentStatus === "PENDING"
                                ? "#d97706"
                                : "#dc2626",
                          }}
                        >
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PENDING">PENDING</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            title="Inspect booking"
                            onClick={() => setSelectedBooking(b)}
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            title="Navigate to Payments"
                            onClick={() => handleNavigate("payments")}
                          >
                            Payment <ExternalLink size={11} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            title="Navigate to Tickets"
                            onClick={() => handleNavigate("tickets")}
                          >
                            Ticket <ExternalLink size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBookings.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="bookings"
        />
      </div>

      {/* Booking Details Modal */}
      <Modal
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title={`Reservation: ${selectedBooking?.bookingReference || ""}`}
        footer={
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button className="btn btn-secondary" onClick={() => setSelectedBooking(null)}>
              Close
            </button>
            {selectedBooking?.status !== "CONFIRMED" && (
              <button
                className="btn btn-success"
                onClick={() => {
                  handleBookingStatusChange(selectedBooking.id, "CONFIRMED");
                  handlePaymentStatusChange(selectedBooking.id, "SUCCESS");
                }}
              >
                Confirm & Mark Paid
              </button>
            )}
            {selectedBooking?.status !== "CANCELLED" && (
              <button
                className="btn btn-danger"
                onClick={() => {
                  handleBookingStatusChange(selectedBooking.id, "CANCELLED");
                  handlePaymentStatusChange(selectedBooking.id, "REFUNDED");
                }}
              >
                Cancel & Refund
              </button>
            )}
          </div>
        }
      >
        {selectedBooking && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>{selectedBooking.bookingReference}</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{selectedBooking.routeName}</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <select
                  value={selectedBooking.status || "CONFIRMED"}
                  onChange={(e) => handleBookingStatusChange(selectedBooking.id, e.target.value)}
                  style={{ fontSize: "0.78rem", fontWeight: 700, padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
                <select
                  value={selectedBooking.paymentStatus || "SUCCESS"}
                  onChange={(e) => handlePaymentStatusChange(selectedBooking.id, e.target.value)}
                  style={{ fontSize: "0.78rem", fontWeight: 700, padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                >
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: "1rem" }}>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Passenger Name</span>
                <div style={{ fontWeight: 700, marginTop: "2px" }}>{selectedBooking.passengerName}</div>
                <div style={{ fontSize: "0.75rem" }}>{selectedBooking.passengerPhone}</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Operating Company</span>
                <div style={{ fontWeight: 700, marginTop: "2px" }}>{selectedBooking.organizationName}</div>
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: "1rem" }}>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Assigned Seat</span>
                <div style={{ fontWeight: 700, marginTop: "2px" }}>Seat Number {selectedBooking.seatNumber}</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Total Ticket Fare</span>
                <div style={{ fontWeight: 700, marginTop: "2px", color: "var(--primary)" }}>{selectedBooking.amount ?? selectedBooking.totalFare ?? 0} ETB</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default AdminBookingsPage;
