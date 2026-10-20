import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { CalendarDays, Search, RefreshCw, Eye, CheckCircle2, XCircle, Building2, Bus, User, MapPin } from "lucide-react";

export const AdminTripsPage = () => {
  const { trips = [], organizations = [], updateTripStatus, isLoadingData, fetchAdminData, showToast } = useApp();
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterOrg, filterStatus, searchQuery]);

  const filteredTrips = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return trips.filter((t) => {
      const matchesOrg = filterOrg === "ALL" || t.organizationId === filterOrg;
      const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
      const matchesSearch =
        !q ||
        (t.tripCode || "").toLowerCase().includes(q) ||
        (t.routeName || "").toLowerCase().includes(q) ||
        (t.organizationName || "").toLowerCase().includes(q) ||
        (t.busPlateNumber || "").toLowerCase().includes(q) ||
        (t.driverName || "").toLowerCase().includes(q);
      return matchesOrg && matchesStatus && matchesSearch;
    });
  }, [trips, filterOrg, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filteredTrips.length / pageSize) || 1;
  const paginatedTrips = useMemo(() => {
    return filteredTrips.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredTrips, currentPage, pageSize]);

  const handleManualRefresh = async () => {
    if (!fetchAdminData) return;
    try {
      setIsRefreshing(true);
      await fetchAdminData();
      if (showToast) showToast("Departure trips synchronized from backend.");
    } catch {
      if (showToast) showToast("Failed to refresh trips.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = (tripId, newStatus) => {
    if (updateTripStatus) {
      updateTripStatus(tripId, newStatus);
    }
    if (selectedTrip && selectedTrip.id === tripId) {
      setSelectedTrip((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Trips & Departures Monitor</h1>
          <p>Supervise scheduled departures created and operated by companies nationwide, seat occupancy, and dispatch statuses.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleManualRefresh}
          disabled={isRefreshing || isLoadingData}
          title="Refresh Trips"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          <RefreshCw size={14} className={isRefreshing || isLoadingData ? "spin animate-spin" : ""} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <div className="header-search" style={{ width: "240px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search trip code or route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing <strong>{filteredTrips.length}</strong> of <strong>{trips.length}</strong> scheduled departures
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: "1150px" }}>
            <thead>
              <tr>
                <th>Trip Code</th>
                <th>Operator</th>
                <th>Route</th>
                <th>Bus Plate</th>
                <th>Assigned Driver</th>
                <th>Schedule</th>
                <th>Fare</th>
                <th>Seat Occupancy</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData && trips.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "2.5rem" }}>
                    <LoadingSpinner label="Loading scheduled departures..." />
                  </td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No departures found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedTrips.map((t) => {
                  const currentStatus = t.status || "SCHEDULED";
                  return (
                    <tr key={t.id}>
                      <td><code>{t.tripCode}</code></td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                          <Building2 size={13} color="var(--primary)" />
                          {t.organizationName}
                        </span>
                      </td>
                      <td>{t.routeName}</td>
                      <td><code>{t.busPlateNumber}</code></td>
                      <td>{t.driverName || "Scheduled Driver"}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{t.departureDate}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 700 }}>{t.departureTime}</div>
                      </td>
                      <td><strong>{t.fareAmount} ETB</strong></td>
                      <td>
                        <span style={{ fontWeight: 700, color: t.bookedSeatsCount >= t.totalSeats ? "var(--danger)" : "var(--text-main)" }}>
                          {t.bookedSeatsCount} / {t.totalSeats}
                        </span>
                      </td>
                      <td>
                        <Badge status={currentStatus} />
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedTrip(t)}
                            title="Inspect departure schedule details"
                          >
                            <Eye size={13} /> View
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
          totalItems={filteredTrips.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="scheduled departures"
        />
      </div>

      {/* Trip Details Modal */}
      <Modal
        isOpen={Boolean(selectedTrip)}
        onClose={() => setSelectedTrip(null)}
        title={`Trip Details: ${selectedTrip?.tripCode || ""}`}
        footer={
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button className="btn btn-secondary" onClick={() => setSelectedTrip(null)}>
              Close
            </button>
            </div>
        }
      >
        {selectedTrip && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>{selectedTrip.tripCode}</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{selectedTrip.routeName}</span>
              </div>
              <Badge status={selectedTrip.status || "SCHEDULED"} />
            </div>

            <div className="form-row" style={{ marginBottom: "1rem" }}>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Operator Company</span>
                <div style={{ fontWeight: 700, marginTop: "2px" }}>{selectedTrip.organizationName}</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Assigned Fleet Vehicle</span>
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "2px" }}>
                  <Bus size={14} color="var(--primary)" /> {selectedTrip.busPlateNumber}
                </div>
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: "1rem" }}>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Departure Time</span>
                <div style={{ fontWeight: 700, marginTop: "2px" }}>{selectedTrip.departureDate} at {selectedTrip.departureTime}</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Passenger Occupancy & Fare</span>
                <div style={{ fontWeight: 700, marginTop: "2px" }}>
                  {selectedTrip.bookedSeatsCount} / {selectedTrip.totalSeats} Booked ({selectedTrip.fareAmount} ETB/seat)
                </div>
              </div>
            </div>

            <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Assigned Commercial Driver</span>
              <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "2px" }}>
                <User size={14} color="var(--primary)" /> {selectedTrip.driverName || "Scheduled Fleet Driver"}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default AdminTripsPage;
