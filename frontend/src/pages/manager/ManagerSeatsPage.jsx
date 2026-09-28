import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Grid3X3, ShieldCheck, Lock } from "lucide-react";

export const ManagerSeatsPage = () => {
  const { trips, selectedOrgId, showToast } = useApp();

  const orgTrips = trips.filter((t) => t.organizationId === selectedOrgId);
  const [selectedTripId, setSelectedTripId] = useState(orgTrips[0]?.id || "");

  const activeTrip = orgTrips.find((t) => t.id === selectedTripId) || orgTrips[0];
  const capacity = activeTrip?.totalSeats || 45;

  // Generate seat map states (1..capacity)
  const [seatStates, setSeatStates] = useState(() => {
    const map = {};
    for (let i = 1; i <= 60; i++) {
      if (i === 12 || i === 14) map[i] = "BOOKED";
      else if (i === 3 || i === 4) map[i] = "HELD";
      else if (i === 40) map[i] = "BLOCKED";
      else map[i] = "AVAILABLE";
    }
    return map;
  });

  const handleSeatClick = (seatNum) => {
    const current = seatStates[seatNum] || "AVAILABLE";
    if (current === "BOOKED") {
      showToast(`Seat ${seatNum} is assigned to a confirmed booking.`, "info");
      return;
    }
    const nextState = current === "BLOCKED" ? "AVAILABLE" : "BLOCKED";
    setSeatStates((prev) => ({ ...prev, [seatNum]: nextState }));
    showToast(`Seat ${seatNum} status updated to ${nextState}.`);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Seat Inventory</h1>
          <p>Visual seat layout matrix and real-time inventory management.</p>
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
