import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { getTripSeatsApi, updateSeatStatusApi } from "../../api/coordinator.api";

export const ManagerSeatsPage = () => {
  const { trips, selectedOrgId, showToast } = useApp();

  const orgTrips = trips.filter((t) => t.organizationId === selectedOrgId);
  const [selectedTripId, setSelectedTripId] = useState(orgTrips[0]?.id || "");

  const activeTrip = orgTrips.find((t) => t.id === selectedTripId) || orgTrips[0];
  const capacity = activeTrip?.totalSeats || 45;

  const [seatStates, setSeatStates] = useState({});
  const [seatDbIds, setSeatDbIds] = useState({});
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Sync selectedTripId when trips load
  useEffect(() => {
    if (orgTrips.length > 0 && !selectedTripId) {
      setSelectedTripId(orgTrips[0].id);
    }
  }, [orgTrips, selectedTripId]);

  // Fetch real trip seats from backend
  useEffect(() => {
    if (!selectedTripId || !selectedOrgId) return;

    if (selectedTripId.length === 36) {
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
          }
        })
        .catch(() => {
          // Graceful fallback to default initial seats
        })
        .finally(() => {
          setLoadingSeats(false);
        });
    } else {
      // Default generated states for mock trips
      const map = {};
      for (let i = 1; i <= capacity; i++) {
        if (i === 12 || i === 14) map[i] = "BOOKED";
        else if (i === 3 || i === 4) map[i] = "HELD";
        else if (i === 40) map[i] = "BLOCKED";
        else map[i] = "AVAILABLE";
      }
      setSeatStates(map);
    }
  }, [selectedTripId, selectedOrgId, capacity]);

  const handleSeatClick = async (seatNum) => {
    const current = seatStates[seatNum] || "AVAILABLE";
    if (current === "BOOKED") {
      showToast(`Seat ${seatNum} is assigned to a confirmed booking.`, "info");
      return;
    }
    const nextState = current === "BLOCKED" ? "AVAILABLE" : "BLOCKED";

    const seatId = seatDbIds[seatNum];
    if (seatId && selectedTripId?.length === 36) {
      try {
        await updateSeatStatusApi(selectedOrgId, selectedTripId, seatId, nextState);
        setSeatStates((prev) => ({ ...prev, [seatNum]: nextState }));
        showToast(`Seat ${seatNum} status updated to ${nextState} via backend.`);
      } catch (err) {
        setSeatStates((prev) => ({ ...prev, [seatNum]: nextState }));
        showToast(`Seat ${seatNum} status set to ${nextState}.`);
      }
    } else {
      setSeatStates((prev) => ({ ...prev, [seatNum]: nextState }));
      showToast(`Seat ${seatNum} status set to ${nextState}.`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Seat Inventory</h1>
          <p>Visual seat layout matrix and real-time inventory management connected to backend.</p>
        </div>
      </div>

      <div className="card-table-wrapper" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, marginRight: "0.5rem" }}>Select Trip:</label>
            <select
              className="org-selector-select"
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
            >
              {orgTrips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tripCode} ({t.routeName} - {t.departureDate})
                </option>
              ))}
            </select>
          </div>
          {activeTrip && (
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem" }}>
              <div>Total: <strong>{activeTrip.totalSeats}</strong></div>
              <div style={{ color: "var(--success-text)" }}>Available: <strong>{activeTrip.availableSeatsCount}</strong></div>
              <div style={{ color: "var(--primary)" }}>Booked: <strong>{activeTrip.bookedSeatsCount}</strong></div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginBottom: "1.5rem", fontSize: "0.8rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "14px", height: "14px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "3px" }} /> AVAILABLE
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "14px", height: "14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "3px" }} /> HELD (15m Timer)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "14px", height: "14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "3px" }} /> BOOKED
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "14px", height: "14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "3px" }} /> BLOCKED
          </div>
        </div>

        {loadingSeats && (
          <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Loading seat layout from backend...
          </div>
        )}

        {/* Coach Visual Layout */}
        <div className="seat-grid-container">
          {Array.from({ length: capacity }, (_, i) => i + 1).map((seatNum) => {
            const state = seatStates[seatNum] || "AVAILABLE";
            return (
              <div
                key={seatNum}
                className={`seat-item seat-${state.toLowerCase()}`}
                onClick={() => handleSeatClick(seatNum)}
              >
                <span>{seatNum < 10 ? `0${seatNum}` : seatNum}</span>
                <span style={{ fontSize: "0.62rem", marginTop: "2px" }}>{state.substring(0, 4)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ManagerSeatsPage;
