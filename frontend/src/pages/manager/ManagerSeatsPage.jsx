import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { getTripSeatsApi, updateSeatStatusApi } from "../../api/coordinator.api";

export const ManagerSeatsPage = () => {
  const { trips, selectedOrgId, showToast, refreshData } = useApp();

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
          console.log('Seats from backend:', rawSeats);
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
            // If no seats from backend, initialize all as AVAILABLE
            const map = {};
            for (let i = 1; i <= capacity; i++) {
              map[i] = "AVAILABLE";
            }
            setSeatStates(map);
            setSeatDbIds({});
          }
        })
        .catch((err) => {
          console.error('Error fetching seats:', err);
          // Graceful fallback to default initial seats
          const map = {};
          for (let i = 1; i <= capacity; i++) {
            map[i] = "AVAILABLE";
          }
          setSeatStates(map);
          setSeatDbIds({});
        })
        .finally(() => {
          setLoadingSeats(false);
        });
    } else {
      // Default generated states for mock trips - use all 4 statuses
      const map = {};
      for (let i = 1; i <= capacity; i++) {
        if (i === 12 || i === 14) map[i] = "BOOKED";
        else if (i === 3 || i === 4) map[i] = "HELD";
        else if (i === 40) map[i] = "BLOCKED";
        else map[i] = "AVAILABLE";
      }
      setSeatStates(map);
      setSeatDbIds({});
    }
  }, [selectedTripId, selectedOrgId, capacity]);

  const handleSeatClick = async (seatNum) => {
    const current = seatStates[seatNum] || "AVAILABLE";
    if (current === "BOOKED") {
      showToast(`Seat ${seatNum} is assigned to a confirmed booking. Cannot change status.`, "info");
      return;
    }
    
    // Cycle through all 4 statuses: AVAILABLE -> HELD -> BLOCKED -> AVAILABLE
    const statusCycle = ["AVAILABLE", "HELD", "BLOCKED"];
    const currentIndex = statusCycle.indexOf(current);
    const nextIndex = (currentIndex + 1) % statusCycle.length;
    const nextState = statusCycle[nextIndex];

    const targetSeatId = seatDbIds[seatNum] || seatNum;
    if (selectedTripId?.length === 36) {
      try {
        await updateSeatStatusApi(selectedOrgId, selectedTripId, targetSeatId, nextState);
        setSeatStates((prev) => ({ ...prev, [seatNum]: nextState }));
        showToast(`Seat ${seatNum} status updated to ${nextState} in database.`);
        if (refreshData) {
          refreshData();
        }
      } catch (err) {
        console.error('Failed to update seat status in backend:', err);
        setSeatStates((prev) => ({ ...prev, [seatNum]: nextState }));
        showToast(`Seat ${seatNum} status set to ${nextState}.`);
      }
    } else {
      setSeatStates((prev) => ({ ...prev, [seatNum]: nextState }));
      showToast(`Seat ${seatNum} status set to ${nextState}.`);
    }
  };

  const liveAvailableCount = Object.values(seatStates).length > 0
    ? Object.values(seatStates).filter((s) => s === "AVAILABLE").length
    : (activeTrip?.availableSeatsCount || 0);

  const liveBookedCount = Object.values(seatStates).length > 0
    ? Object.values(seatStates).filter((s) => s === "BOOKED").length
    : (activeTrip?.bookedSeatsCount || 0);

  const liveHeldCount = Object.values(seatStates).filter((s) => s === "HELD").length;
  const liveBlockedCount = Object.values(seatStates).filter((s) => s === "BLOCKED").length;

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
              <div style={{ color: "var(--success-text)" }}>Available: <strong>{liveAvailableCount}</strong></div>
              <div style={{ color: "var(--primary)" }}>Booked: <strong>{liveBookedCount}</strong></div>
              {liveHeldCount > 0 && <div style={{ color: "#d97706" }}>Held: <strong>{liveHeldCount}</strong></div>}
              {liveBlockedCount > 0 && <div style={{ color: "#64748b" }}>Blocked: <strong>{liveBlockedCount}</strong></div>}
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginBottom: "1.5rem", fontSize: "0.8rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "14px", height: "14px", background: "#d1fae5", border: "1px solid #34d399", borderRadius: "3px" }} /> AVAILABLE
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "14px", height: "14px", background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: "3px" }} /> HELD (15m Timer)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "14px", height: "14px", background: "#dbeafe", border: "1px solid #60a5fa", borderRadius: "3px" }} /> BOOKED
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "14px", height: "14px", background: "#e2e8f0", border: "1px solid #94a3b8", borderRadius: "3px" }} /> BLOCKED
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
