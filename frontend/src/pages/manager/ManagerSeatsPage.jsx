import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import {
  Armchair,
  CheckCircle2,
  Lock,
  Clock,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  XCircle,
  Plus,
  Compass,
  ArrowRight,
  User,
  Phone,
  Mail,
  Ticket
} from "lucide-react";
import { getTripSeatsApi, updateSeatStatusApi } from "../../api/coordinator.api";

export const ManagerSeatsPage = () => {
  const { t } = useTranslation();
  const {
    trips = [],
    bookings = [],
    tickets = [],
    selectedOrgId,
    showToast,
    reserveSeatForPassenger,
    releaseSeatReservation,
    changeSeatStatus,
  } = useApp();

  // Trips matching organization or fallback to all available trips
  const effectiveTrips = useMemo(() => {
    if (!selectedOrgId || selectedOrgId === "ALL") return trips;
    const filtered = trips.filter((t) => t.organizationId === selectedOrgId);
    return filtered.length > 0 ? filtered : trips;
  }, [trips, selectedOrgId]);

  const [selectedTripId, setSelectedTripId] = useState(effectiveTrips[0]?.id || "");

  // Sync selectedTripId when trips load
  useEffect(() => {
    if (effectiveTrips.length > 0 && (!selectedTripId || !effectiveTrips.some(t => t.id === selectedTripId))) {
      setSelectedTripId(effectiveTrips[0].id);
    }
  }, [effectiveTrips, selectedTripId]);

  const activeTrip = effectiveTrips.find((t) => t.id === selectedTripId) || effectiveTrips[0];
  const capacity = activeTrip?.totalSeats || 45;

  const [seatStates, setSeatStates] = useState({});
  const [seatDbIds, setSeatDbIds] = useState({});
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Filter & Search Toolbar State
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [seatSearch, setSeatSearch] = useState("");

  // Modal State for Seat Management
  const [selectedSeatForModal, setSelectedSeatForModal] = useState(null);
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("+251911000000");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [isSubmittingSeat, setIsSubmittingSeat] = useState(false);
  const [modalError, setModalError] = useState("");

  // Fetch real trip seats from backend or initialize fallback
  useEffect(() => {
    if (!selectedTripId) return;

    if (selectedTripId.length === 36 && selectedOrgId) {
      setLoadingSeats(true);
      getTripSeatsApi(selectedOrgId, selectedTripId)
        .then((res) => {
          const rawSeats = res.data?.seats || res.data || [];
          if (Array.isArray(rawSeats) && rawSeats.length > 0) {
            const stateMap = {};
            const idMap = {};
            rawSeats.forEach((s) => {
              stateMap[s.seat_number] = s.status;
              idMap[s.seat_number] = s.id;
            });
            setSeatStates(stateMap);
            setSeatDbIds(idMap);
          } else {
            // Default: derive from trip bookings
            const map = {};
            for (let i = 1; i <= capacity; i++) {
              const booked = bookings.find(
                (b) => b.tripId === selectedTripId && Number(b.seatNumber) === i && b.status === "CONFIRMED"
              );
              map[i] = booked ? "BOOKED" : (i === 3 || i === 4 ? "HELD" : i === 40 ? "BLOCKED" : "AVAILABLE");
            }
            setSeatStates(map);
            setSeatDbIds({});
          }
        })
        .catch(() => {
          // Graceful fallback
          const map = {};
          for (let i = 1; i <= capacity; i++) {
            const booked = bookings.find(
              (b) => b.tripId === selectedTripId && Number(b.seatNumber) === i && b.status === "CONFIRMED"
            );
            map[i] = booked ? "BOOKED" : (i === 3 || i === 4 ? "HELD" : i === 40 ? "BLOCKED" : "AVAILABLE");
          }
          setSeatStates(map);
          setSeatDbIds({});
        })
        .finally(() => {
          setLoadingSeats(false);
        });
    } else {
      // Default generated states for mock trips
      const map = {};
      for (let i = 1; i <= capacity; i++) {
        const booked = bookings.find(
          (b) => (b.tripId === selectedTripId || b.tripCode === activeTrip?.tripCode) && Number(b.seatNumber) === i && b.status === "CONFIRMED"
        );
        if (booked) {
          map[i] = "BOOKED";
        } else if (i === 12 || i === 14) {
          map[i] = "BOOKED";
        } else if (i === 3 || i === 4) {
          map[i] = "HELD";
        } else if (i === 40) {
          map[i] = "BLOCKED";
        } else {
          map[i] = "AVAILABLE";
        }
      }
      setSeatStates(map);
      setSeatDbIds({});
    }
  }, [selectedTripId, selectedOrgId, capacity, bookings, activeTrip?.tripCode]);

  // Handle Clicking a Seat Tile -> Open Details & Action Modal
  const handleOpenSeatModal = (seatNum) => {
    setSelectedSeatForModal(seatNum);
    setModalError("");
    const current = seatStates[seatNum] || "AVAILABLE";

    // Prefill passenger details if seat is already booked
    const existingBooking = bookings.find(
      (b) => (b.tripId === selectedTripId || b.tripCode === activeTrip?.tripCode) && Number(b.seatNumber) === Number(seatNum) && b.status === "CONFIRMED"
    );
    if (existingBooking) {
      setPassengerName(existingBooking.passengerName || "");
      setPassengerPhone(existingBooking.passengerPhone || "+251911000000");
      setPassengerEmail(existingBooking.passengerEmail || "");
    } else {
      setPassengerName("");
      setPassengerPhone("+251911000000");
      setPassengerEmail("");
    }
  };

  // Action: Reserve Seat for Passenger
  const handleConfirmReservation = async (e) => {
    if (e) e.preventDefault();
    if (!passengerName.trim()) {
      setModalError("Passenger name is required for reservation.");
      return;
    }
    setIsSubmittingSeat(true);
    setModalError("");
    try {
      const res = await reserveSeatForPassenger(selectedTripId, selectedSeatForModal, {
        name: passengerName.trim(),
        phone: passengerPhone.trim(),
        email: passengerEmail.trim(),
        fare: activeTrip?.fareAmount || 500,
      });
      setSeatStates((prev) => ({ ...prev, [selectedSeatForModal]: "BOOKED" }));
      setSelectedSeatForModal(null);
    } catch (err) {
      setModalError(err.message || "Failed to reserve seat.");
    } finally {
      setIsSubmittingSeat(false);
    }
  };

  // Action: Quick Hold Seat
  const handleSetSeatStatus = async (targetStatus) => {
    setIsSubmittingSeat(true);
    setModalError("");
    try {
      await changeSeatStatus(selectedTripId, selectedSeatForModal, targetStatus);
      setSeatStates((prev) => ({ ...prev, [selectedSeatForModal]: targetStatus }));
      setSelectedSeatForModal(null);
    } catch (err) {
      setModalError(err.message || "Failed to update seat status.");
    } finally {
      setIsSubmittingSeat(false);
    }
  };

  // Action: Release Seat Reservation / Hold back to AVAILABLE
  const handleReleaseSeat = async () => {
    setIsSubmittingSeat(true);
    setModalError("");
    try {
      await releaseSeatReservation(selectedTripId, selectedSeatForModal);
      setSeatStates((prev) => ({ ...prev, [selectedSeatForModal]: "AVAILABLE" }));
      setSelectedSeatForModal(null);
    } catch (err) {
      setModalError(err.message || "Failed to release seat.");
    } finally {
      setIsSubmittingSeat(false);
    }
  };

  // Quick 1-Click Action: Reserve first available test seat
  const handleQuickTestReserve = async () => {
    const firstAvailable = Array.from({ length: capacity }, (_, i) => i + 1).find(
      (n) => (seatStates[n] || "AVAILABLE") === "AVAILABLE"
    );
    if (!firstAvailable) {
      showToast("No available seats found on this trip to reserve.", "info");
      return;
    }
    const sampleNames = ["Abebe Bikila", "Almaz Ayana", "Kenenisa Bekele", "Derartu Tulu", "Haile Gebrselassie", "Tirunesh Dibaba"];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)] + ` (${firstAvailable})`;
    try {
      await reserveSeatForPassenger(selectedTripId, firstAvailable, {
        name: randomName,
        phone: "+25191" + Math.floor(1000000 + Math.random() * 9000000),
        fare: activeTrip?.fareAmount || 500,
      });
      setSeatStates((prev) => ({ ...prev, [firstAvailable]: "BOOKED" }));
    } catch {
      // toast handled in AppContext
    }
  };

  // Quick Action: Release all held seats
  const handleClearAllHeld = () => {
    const heldSeats = Object.entries(seatStates).filter(([_, st]) => st === "HELD").map(([num]) => Number(num));
    if (heldSeats.length === 0) {
      showToast("No held seats on this trip to release.", "info");
      return;
    }
    heldSeats.forEach((num) => {
      releaseSeatReservation(selectedTripId, num);
    });
    setSeatStates((prev) => {
      const next = { ...prev };
      heldSeats.forEach((num) => { next[num] = "AVAILABLE"; });
      return next;
    });
    showToast(`Released ${heldSeats.length} held seat(s) back to AVAILABLE.`);
  };

  // Compute live seat statistics
  const liveAvailableCount = Object.values(seatStates).filter((s) => s === "AVAILABLE").length;
  const liveBookedCount = Object.values(seatStates).filter((s) => s === "BOOKED").length;
  const liveHeldCount = Object.values(seatStates).filter((s) => s === "HELD").length;
  const liveBlockedCount = Object.values(seatStates).filter((s) => s === "BLOCKED").length;
  const occupancyPercent = capacity > 0 ? Math.round((liveBookedCount / capacity) * 100) : 0;

  // Filtered Seats according to toolbar search & filter
  const visibleSeats = useMemo(() => {
    return Array.from({ length: capacity }, (_, i) => i + 1).filter((num) => {
      const state = seatStates[num] || "AVAILABLE";
      const matchesStatus = statusFilter === "ALL" || state === statusFilter;
      const matchesSearch = !seatSearch || String(num).includes(seatSearch.trim());
      return matchesStatus && matchesSearch;
    });
  }, [capacity, seatStates, statusFilter, seatSearch]);

  const activeSeatBooking = useMemo(() => {
    if (!selectedSeatForModal) return null;
    return bookings.find(
      (b) => (b.tripId === selectedTripId || b.tripCode === activeTrip?.tripCode) && Number(b.seatNumber) === Number(selectedSeatForModal) && b.status === "CONFIRMED"
    );
  }, [selectedSeatForModal, bookings, selectedTripId, activeTrip?.tripCode]);

  const activeSeatTicket = useMemo(() => {
    if (!selectedSeatForModal) return null;
    return tickets.find(
      (tk) => (tk.tripId === selectedTripId || tk.tripCode === activeTrip?.tripCode) && Number(tk.seatNumber) === Number(selectedSeatForModal) && tk.status !== "CANCELLED"
    );
  }, [selectedSeatForModal, tickets, selectedTripId, activeTrip?.tripCode]);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>{t("managerSeats.title", "Seat Inventory & Reservation Console")}</h1>
          <p>{t("managerSeats.subtitle", "Interactive coach layout, seat reservation desk, temporary holds, and cabin occupancy control.")}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary"
            style={{ borderColor: "var(--primary)", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            onClick={handleQuickTestReserve}
            title="Instantly test reserving an available seat"
          >
            <Armchair size={15} /> Quick Test Reserve
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleClearAllHeld}
            title="Release all temporary seat holds"
          >
            <RefreshCw size={14} /> Clear All Holds ({liveHeldCount})
          </button>
        </div>
      </div>

      <div className="card-table-wrapper" style={{ padding: "1.25rem" }}>
        {/* Trip Selector & Live Metrics Banner */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, marginRight: "0.5rem" }}>
                {t("managerSeats.tripSelectorLabel", "Select Scheduled Trip")}:
              </label>
              <select
                className="org-selector-select"
                style={{ minWidth: "300px" }}
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
              >
                {effectiveTrips.map((tItem) => (
                  <option key={tItem.id} value={tItem.id}>
                    {tItem.tripCode} | {tItem.routeName} ({tItem.departureDate} at {tItem.departureTime})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeTrip && (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.82rem", background: "var(--bg-main, #f8fafc)", padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)", flexWrap: "wrap" }}>
              <div>{t("managerSeats.total", "Capacity")}: <strong>{capacity}</strong></div>
              <div style={{ color: "var(--success-text, #10b981)" }}>{t("managerSeats.available", "Available")}: <strong>{liveAvailableCount}</strong></div>
              <div style={{ color: "var(--primary, #2563eb)" }}>{t("managerSeats.booked", "Booked")}: <strong>{liveBookedCount}</strong></div>
              {liveHeldCount > 0 && <div style={{ color: "#d97706" }}>{t("managerSeats.held", "Held")}: <strong>{liveHeldCount}</strong></div>}
              {liveBlockedCount > 0 && <div style={{ color: "#64748b" }}>{t("managerSeats.blocked", "Blocked")}: <strong>{liveBlockedCount}</strong></div>}
              <div style={{ fontWeight: 700, color: occupancyPercent > 80 ? "#ef4444" : "var(--text-main)" }}>
                Occupancy: <strong>{occupancyPercent}%</strong>
              </div>
            </div>
          )}
        </div>

        {/* Occupancy Progress Bar */}
        <div style={{ width: "100%", height: "6px", background: "var(--border-color, #e2e8f0)", borderRadius: "3px", overflow: "hidden", marginBottom: "1.25rem" }}>
          <div
            style={{
              height: "100%",
              width: `${occupancyPercent}%`,
              background: occupancyPercent > 85 ? "#ef4444" : occupancyPercent > 50 ? "#3b82f6" : "#10b981",
              transition: "width 0.3s ease"
            }}
          />
        </div>

        {/* Search, Filter Toolbar & Legend */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <div className="header-search" style={{ width: "200px" }}>
              <Search className="search-icon" size={14} />
              <input
                type="text"
                className="form-control"
                placeholder="Search seat #..."
                value={seatSearch}
                onChange={(e) => setSeatSearch(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses ({capacity})</option>
              <option value="AVAILABLE">Available ({liveAvailableCount})</option>
              <option value="BOOKED">Booked ({liveBookedCount})</option>
              <option value="HELD">Held ({liveHeldCount})</option>
              <option value="BLOCKED">Blocked ({liveBlockedCount})</option>
            </select>
          </div>

          {/* Interactive Legend */}
          <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.8rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span className="seat-legend-dot seat-legend-available" /> {t("managerSeats.available", "Available")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span className="seat-legend-dot seat-legend-held" /> {t("managerSeats.held", "Held (Phone/Counter)")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span className="seat-legend-dot seat-legend-booked" /> {t("managerSeats.booked", "Booked (Passenger)")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span className="seat-legend-dot seat-legend-blocked" /> {t("managerSeats.blocked", "Blocked (Crew/Safety)")}
            </div>
          </div>
        </div>

        {loadingSeats && (
          <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <RefreshCw size={16} className="spin" style={{ display: "inline-block", marginRight: "0.4rem" }} />
            {t("managerSeats.loadingSeats", "Synchronizing coach seat matrix...")}
          </div>
        )}

        {/* Coach Exterior Container */}
        <div style={{ maxWidth: "480px", margin: "0 auto", border: "2px solid var(--border-color, #cbd5e1)", borderRadius: "20px", padding: "1.5rem 1.25rem", background: "var(--bg-card, #ffffff)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
          {/* Front of Bus Cabin */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px dashed var(--border-color, #cbd5e1)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)" }}>
              <Compass size={20} color="var(--primary)" />
              <span>DRIVER CABIN</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.04)", padding: "0.25rem 0.6rem", borderRadius: "4px" }}>
              <span>ENTRANCE DOOR</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Coach 4-Column Seat Grid */}
          <div className="seat-grid-container" style={{ margin: "0", maxWidth: "100%" }}>
            {visibleSeats.map((seatNum) => {
              const state = seatStates[seatNum] || "AVAILABLE";
              const isBooked = state === "BOOKED";
              const isHeld = state === "HELD";
              const isBlocked = state === "BLOCKED";

              return (
                <div
                  key={seatNum}
                  className={`seat-item seat-${state.toLowerCase()}`}
                  onClick={() => handleOpenSeatModal(seatNum)}
                  title={`Seat #${seatNum} - Click to Reserve, Hold, or Inspect`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                    {isBooked && <CheckCircle2 size={10} />}
                    {isHeld && <Clock size={10} />}
                    {isBlocked && <Lock size={10} />}
                    <span>{seatNum < 10 ? `0${seatNum}` : seatNum}</span>
                  </div>
                  <span style={{ fontSize: "0.62rem", marginTop: "2px", fontWeight: 600 }}>
                    {state.substring(0, 4)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rear of Bus Notice */}
          <div style={{ textAlign: "center", marginTop: "1.5rem", paddingTop: "0.75rem", borderTop: "2px dashed var(--border-color, #cbd5e1)", fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "1px" }}>
            REAR COACH ROW • EMERGENCY EXIT
          </div>
        </div>
      </div>

      {/* Seat Management & Reservation Action Modal */}
      <Modal
        isOpen={selectedSeatForModal !== null}
        onClose={() => { setSelectedSeatForModal(null); setModalError(""); }}
        title={`Seat #${selectedSeatForModal < 10 ? `0${selectedSeatForModal}` : selectedSeatForModal} Management Console`}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Trip: <strong>{activeTrip?.tripCode}</strong> ({activeTrip?.fareAmount || 500} ETB)
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => { setSelectedSeatForModal(null); setModalError(""); }}
              disabled={isSubmittingSeat}
            >
              {t("common.close", "Close")}
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {modalError && (
            <div style={{
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "0.5rem",
              color: "#ef4444",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{modalError}</span>
            </div>
          )}

          {/* Current Seat Overview Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-main, #f8fafc)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "var(--primary)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem" }}>
                {selectedSeatForModal < 10 ? `0${selectedSeatForModal}` : selectedSeatForModal}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Seat #{selectedSeatForModal}</h4>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {activeTrip?.routeName} • Bus {activeTrip?.busPlateNumber}
                </p>
              </div>
            </div>
            <div>
              <Badge status={seatStates[selectedSeatForModal] || "AVAILABLE"} />
            </div>
          </div>

          {/* If Seat is BOOKED: Display Passenger & Ticket Details */}
          {(seatStates[selectedSeatForModal] === "BOOKED" || activeSeatBooking) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ background: "rgba(37, 99, 235, 0.05)", border: "1px solid rgba(37, 99, 235, 0.2)", borderRadius: "8px", padding: "0.85rem", fontSize: "0.85rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, color: "var(--primary)", marginBottom: "0.5rem" }}>
                  <UserCheck size={16} /> Confirmed Passenger Details
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", fontSize: "0.82rem" }}>
                  <div><strong>Passenger:</strong> {activeSeatBooking?.passengerName || passengerName || "Confirmed Passenger"}</div>
                  <div><strong>Phone:</strong> {activeSeatBooking?.passengerPhone || passengerPhone || "—"}</div>
                  <div><strong>Booking Ref:</strong> <code>{activeSeatBooking?.bookingReference || `BK-${activeTrip?.id?.slice(0, 6) || "RES"}`}</code></div>
                  <div><strong>Ticket Code:</strong> <code>{activeSeatTicket?.ticketNumber || `ET-TKT-${selectedSeatForModal}001`}</code></div>
                  <div><strong>Fare Amount:</strong> {activeTrip?.fareAmount || 500} ETB</div>
                  <div><strong>Departure:</strong> {activeTrip?.departureDate} at {activeTrip?.departureTime}</div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-danger"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                onClick={handleReleaseSeat}
                disabled={isSubmittingSeat}
              >
                <XCircle size={16} /> Cancel Reservation & Release Seat
              </button>
            </div>
          )}

          {/* If Seat is AVAILABLE: Show Reservation Form & Quick Options */}
          {seatStates[selectedSeatForModal] === "AVAILABLE" && (
            <form onSubmit={handleConfirmReservation} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.4rem" }}>
                Reserve Seat for Walk-in or Phone Passenger:
              </div>

              <div className="form-group">
                <label className="form-label">Passenger Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Solomon Tekle"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+251911000000"
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="passenger@gmail.com"
                    value={passengerEmail}
                    onChange={(e) => setPassengerEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                disabled={isSubmittingSeat || !passengerName.trim()}
              >
                <CheckCircle2 size={16} /> {isSubmittingSeat ? "Confirming..." : `Confirm & Issue Booking (${activeTrip?.fareAmount || 500} ETB)`}
              </button>

              <div className="form-divider" style={{ margin: "0.5rem 0" }} />

              {/* Quick Hold & Block Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ borderColor: "#d97706", color: "#d97706" }}
                  onClick={() => handleSetSeatStatus("HELD")}
                  disabled={isSubmittingSeat}
                >
                  <Clock size={14} /> Hold Seat (15 min)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ borderColor: "#64748b", color: "#64748b" }}
                  onClick={() => handleSetSeatStatus("BLOCKED")}
                  disabled={isSubmittingSeat}
                >
                  <Lock size={14} /> Block (Crew/Maintenance)
                </button>
              </div>
            </form>
          )}

          {/* If Seat is HELD: Options to Convert to Booking or Release */}
          {seatStates[selectedSeatForModal] === "HELD" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", padding: "0.85rem", fontSize: "0.85rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, color: "#d97706", marginBottom: "0.4rem" }}>
                  <Clock size={16} /> Temporary Counter Hold
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  This seat is temporarily held for a customer awaiting payment or phone reservation. You can convert it to a confirmed booking or release it back to the available inventory.
                </p>
              </div>

              <form onSubmit={handleConfirmReservation} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="form-group">
                  <label className="form-label">Passenger Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Dawit Haile"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+251911000000"
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingSeat || !passengerName.trim()}
                >
                  Convert Hold to Confirmed Booking
                </button>
              </form>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: "100%", borderColor: "var(--border-color)" }}
                onClick={handleReleaseSeat}
                disabled={isSubmittingSeat}
              >
                Release Hold (Make Available)
              </button>
            </div>
          )}

          {/* If Seat is BLOCKED: Option to Unblock */}
          {seatStates[selectedSeatForModal] === "BLOCKED" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ background: "rgba(100, 116, 139, 0.08)", border: "1px solid rgba(100, 116, 139, 0.25)", borderRadius: "8px", padding: "0.85rem", fontSize: "0.85rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem" }}>
                  <Lock size={16} /> Blocked for Operational / Maintenance Safety
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  This seat is held back from public sales (reserved for vehicle crew, relief driver, or cabin spacing). Click below to unblock.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-success"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                onClick={() => handleSetSeatStatus("AVAILABLE")}
                disabled={isSubmittingSeat}
              >
                <CheckCircle2 size={16} /> Unblock Seat (Return to Available)
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ManagerSeatsPage;
