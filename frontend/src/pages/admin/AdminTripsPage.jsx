import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { CalendarDays, Search, RefreshCw, Eye, CheckCircle2, XCircle, Building2, Bus, User, MapPin, Armchair, Clock, Lock } from "lucide-react";

export const AdminTripsPage = () => {
  const {
    trips = [],
    organizations = [],
    bookings = [],
    updateTripStatus,
    reserveSeatForPassenger,
    releaseSeatReservation,
    changeSeatStatus,
    isLoadingData,
    fetchAdminData,
    showToast,
  } = useApp();
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [seatModalTrip, setSeatModalTrip] = useState(null);
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
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
                            onClick={() => setSeatModalTrip(t)}
                            title="Inspect and manage coach seat reservations"
                          >
                            <Armchair size={13} /> Seats
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

      {/* Admin Coach Seats Layout & Reservation Inspection Modal */}
      <Modal
        isOpen={Boolean(seatModalTrip)}
        onClose={() => setSeatModalTrip(null)}
        title={`Seat Inventory & Coach Map: ${seatModalTrip?.tripCode || ""}`}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Carrier: <strong>{seatModalTrip?.organizationName}</strong> • {seatModalTrip?.bookedSeatsCount || 0}/{seatModalTrip?.totalSeats || 45} Booked
            </span>
            <button className="btn btn-secondary" onClick={() => setSeatModalTrip(null)}>
              Close
            </button>
          </div>
        }
      >
        {seatModalTrip && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-main, #f8fafc)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem" }}>{seatModalTrip.routeName}</h4>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Bus: {seatModalTrip.busPlateNumber} • Departs: {seatModalTrip.departureDate} at {seatModalTrip.departureTime}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  const cap = seatModalTrip.totalSeats || 45;
                  const firstAvail = Array.from({ length: cap }, (_, i) => i + 1).find((n) => {
                    const bk = bookings.find(b => (b.tripId === seatModalTrip.id || b.tripCode === seatModalTrip.tripCode) && Number(b.seatNumber) === n && b.status === "CONFIRMED");
                    return !bk;
                  });
                  if (firstAvail) {
                    await reserveSeatForPassenger(seatModalTrip.id, firstAvail, {
                      name: `Admin Passenger (${firstAvail})`,
                      phone: "+251911998877",
                      fare: seatModalTrip.fareAmount || 500,
                    });
                  }
                }}
              >
                <Armchair size={13} /> Quick Test Reserve
              </button>
            </div>

            {/* Coach Interior Map */}
            <div style={{ maxWidth: "420px", margin: "0 auto", border: "2px solid var(--border-color, #cbd5e1)", borderRadius: "16px", padding: "1.25rem", background: "var(--bg-card, #ffffff)" }}>
              <div style={{ textAlign: "center", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "1px dashed var(--border-color)" }}>
                🚌 FRONT OF BUS • DRIVER CABIN
              </div>

              <div className="seat-grid-container" style={{ margin: 0, maxWidth: "100%" }}>
                {Array.from({ length: seatModalTrip.totalSeats || 45 }, (_, i) => i + 1).map((seatNum) => {
                  const existingBooking = bookings.find(
                    (b) => (b.tripId === seatModalTrip.id || b.tripCode === seatModalTrip.tripCode) && Number(b.seatNumber) === seatNum && b.status === "CONFIRMED"
                  );
                  const state = existingBooking ? "BOOKED" : (seatNum === 3 || seatNum === 4 ? "HELD" : seatNum === 40 ? "BLOCKED" : "AVAILABLE");

                  return (
                    <div
                      key={seatNum}
                      className={`seat-item seat-${state.toLowerCase()}`}
                      style={{ cursor: "pointer" }}
                      onClick={async () => {
                        if (state === "BOOKED") {
                          if (window.confirm(`Seat #${seatNum} is booked by "${existingBooking?.passengerName}". Cancel and release to Available?`)) {
                            await releaseSeatReservation(seatModalTrip.id, seatNum);
                          }
                        } else if (state === "AVAILABLE") {
                          const name = window.prompt(`Enter passenger name to reserve Seat #${seatNum}:`, "Passenger " + seatNum);
                          if (name) {
                            await reserveSeatForPassenger(seatModalTrip.id, seatNum, {
                              name: name.trim(),
                              phone: "+251911000000",
                              fare: seatModalTrip.fareAmount || 500,
                            });
                          }
                        } else if (state === "HELD") {
                          if (window.confirm(`Seat #${seatNum} is HELD. Release back to Available?`)) {
                            await releaseSeatReservation(seatModalTrip.id, seatNum);
                          }
                        } else if (state === "BLOCKED") {
                          if (window.confirm(`Seat #${seatNum} is BLOCKED. Unblock to Available?`)) {
                            await changeSeatStatus(seatModalTrip.id, seatNum, "AVAILABLE");
                          }
                        }
                      }}
                      title={`Seat #${seatNum} (${state}) - Click to manage`}
                    >
                      <span>{seatNum < 10 ? `0${seatNum}` : seatNum}</span>
                      <span style={{ fontSize: "0.6rem" }}>{state.substring(0, 4)}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--border-color)" }}>
                REAR ROW • EMERGENCY EXIT
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default AdminTripsPage;
