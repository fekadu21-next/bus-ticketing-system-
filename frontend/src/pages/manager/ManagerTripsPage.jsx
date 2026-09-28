import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { CalendarDays, Plus, Search, UserCheck, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Clock } from "lucide-react";

export const ManagerTripsPage = () => {
  const {
    trips,
    routes,
    buses,
    drivers,
    selectedOrgId,
    createTrip,
    publishTrip,
    unpublishTrip,
    cancelTrip,
    assignDriverToTrip,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Wizard form state
  const orgBuses = buses.filter((b) => b.organizationId === selectedOrgId && b.status === "ACTIVE");
  const orgDrivers = drivers.filter((d) => d.organizationId === selectedOrgId);

  const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.id || "");
  const [selectedBusId, setSelectedBusId] = useState(orgBuses[0]?.id || "");
  const [departureDate, setDepartureDate] = useState("2026-09-27");
  const [departureTime, setDepartureTime] = useState("06:00 AM");
  const [arrivalTime, setArrivalTime] = useState("02:30 PM");
  const [fareAmount, setFareAmount] = useState(850);
  const [selectedDriverId, setSelectedDriverId] = useState(orgDrivers[0]?.id || "");

  // Driver assign modal
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [targetTripId, setTargetTripId] = useState(null);
  const [driverSelectId, setDriverSelectId] = useState("");

  const orgTrips = trips.filter((t) => t.organizationId === selectedOrgId);
  const filteredTrips = orgTrips.filter((t) => {
    const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
    const matchesSearch =
      (t.tripCode && t.tripCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.routeName && t.routeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.busPlateNumber && t.busPlateNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.driverName && t.driverName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleCreateTripSubmit = () => {
    const success = createTrip({
      routeId: selectedRouteId,
      busId: selectedBusId,
      departureDate,
      departureTime,
      arrivalTime,
      fareAmount: Number(fareAmount),
      driverId: selectedDriverId
    });

    if (success !== false) {
      setShowWizardModal(false);
      setWizardStep(1);
    }
  };

  const handleAssignDriver = () => {
    if (targetTripId && driverSelectId) {
      assignDriverToTrip(targetTripId, driverSelectId);
      setShowDriverModal(false);
    }
  };

  const selectedRouteObj = routes.find((r) => r.id === selectedRouteId);
  const selectedBusObj = buses.find((b) => b.id === selectedBusId);
  const selectedDriverObj = drivers.find((d) => d.id === selectedDriverId);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Trip Operations</h1>
          <p>Schedule, publish, and manage company bus departures.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchCoordinatorData(selectedOrgId)}
            disabled={isLoadingData}
          >
            <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowWizardModal(true);
              setWizardStep(1);
            }}
          >
            <Plus size={16} /> Schedule Trip
          </button>
        </div>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div className="header-search" style={{ width: "260px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search trip code, route, bus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Trip States</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Total Organization Trips: <strong>{orgTrips.length}</strong>
          </div>
        </div>

        {filteredTrips.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <Clock size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>No departure trips matching your criteria.</div>
            {orgTrips.length === 0 && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={() => {
                  setShowWizardModal(true);
                  setWizardStep(1);
                }}
              >
                <Plus size={14} /> Schedule First Trip
              </button>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Trip Code</th>
                <th>Route Name</th>
                <th>Bus Plate</th>
                <th>Assigned Driver</th>
                <th>Departure Time</th>
                <th>Fare</th>
                <th>Booked / Seats</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map((t) => (
                <tr key={t.id}>
                  <td><code>{t.tripCode}</code></td>
                  <td><strong>{t.routeName}</strong></td>
                  <td><code>{t.busPlateNumber}</code></td>
                  <td>
                    <span style={{ fontWeight: 600, color: t.driverName === "Unassigned" ? "var(--warning-text)" : "var(--text-main)" }}>
                      {t.driverName}
                    </span>
                  </td>
                  <td>
                    <div>{t.departureDate}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{t.departureTime}</div>
                  </td>
                  <td><strong>{t.fareAmount} ETB</strong></td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{t.bookedSeatsCount} / {t.totalSeats}</span>
                  </td>
                  <td><Badge status={t.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      {t.status === "DRAFT" ? (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => publishTrip(t.id)}
                        >
                          Publish
                        </button>
                      ) : (t.status === "PUBLISHED" || t.status === "SCHEDULED") && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => unpublishTrip(t.id)}
                          title="Move trip back to draft"
                        >
                          Unpublish
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setTargetTripId(t.id);
                          setShowDriverModal(true);
                        }}
                      >
                        Driver
                      </button>
                      {t.status !== "CANCELLED" && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => cancelTrip(t.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 10-Step Wizard Modal */}
      <Modal
        isOpen={showWizardModal}
        onClose={() => setShowWizardModal(false)}
        title={`Trip Scheduling Wizard (Step ${wizardStep} of 10)`}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            {wizardStep > 1 ? (
              <button className="btn btn-secondary" onClick={() => setWizardStep(wizardStep - 1)}>
                Back
              </button>
            ) : <div />}
            {wizardStep < 10 ? (
              <button className="btn btn-primary" onClick={() => setWizardStep(wizardStep + 1)}>
                Next Step <ArrowRight size={14} />
              </button>
            ) : (
              <button className="btn btn-success" onClick={handleCreateTripSubmit}>
                Confirm & Create Trip
              </button>
            )}
          </div>
        }
      >
        <div>
          {/* Step Progress Bar */}
          <div style={{ display: "flex", gap: "2px", marginBottom: "1.25rem" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
              <div
                key={step}
                style={{
                  flex: 1,
                  height: "5px",
                  borderRadius: "2px",
                  background: step <= wizardStep ? "var(--primary)" : "#e2e8f0"
                }}
              />
            ))}
          </div>

          {wizardStep === 1 && (
            <div>
              <h3>Step 1: Select Reusable Route</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Verify organization is permitted to operate the specified corridor.
              </p>
              <div className="form-group">
                <label>Route</label>
                <select value={selectedRouteId} onChange={(e) => setSelectedRouteId(e.target.value)}>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.distanceKm} km)</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div>
              <h3>Step 2: Select Fleet Bus</h3>
              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label>Active Fleet Bus</label>
                <select value={selectedBusId} onChange={(e) => setSelectedBusId(e.target.value)}>
                  {orgBuses.map((b) => (
                    <option key={b.id} value={b.id}>{b.busNumber} ({b.plateNumber}) - {b.capacity} Seats</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div>
              <h3>Step 3: Departure Terminal</h3>
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "6px" }}>
                <strong>Origin Terminal:</strong> {selectedRouteObj?.originStationName}
              </div>
            </div>
          )}

          {wizardStep === 4 && (
            <div>
              <h3>Step 4: Arrival Terminal</h3>
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "6px" }}>
                <strong>Destination Terminal:</strong> {selectedRouteObj?.destinationStationName}
              </div>
            </div>
          )}

          {wizardStep === 5 && (
            <div>
              <h3>Step 5: Departure Schedule & Times</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Departure Date</label>
                  <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Departure Time</label>
                  <input type="text" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Estimated Arrival Time</label>
                <input type="text" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
              </div>
            </div>
          )}

          {wizardStep === 6 && (
            <div>
              <h3>Step 6: Configure Ticket Fare</h3>
              <div className="form-group">
                <label>Fare Amount (ETB)</label>
                <input
                  type="number"
                  min="50"
                  value={fareAmount}
                  onChange={(e) => setFareAmount(e.target.value)}
                />
              </div>
            </div>
          )}

          {wizardStep === 7 && (
            <div>
              <h3>Step 7: Configure Seat Inventory</h3>
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "6px" }}>
                <div>Total Seat Grid: <strong>{selectedBusObj?.capacity || 45} Seats</strong></div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                  Seats 1 through {selectedBusObj?.capacity || 45} will be initialized as AVAILABLE.
                </div>
              </div>
            </div>
          )}

          {wizardStep === 8 && (
            <div>
              <h3>Step 8: Assign Eligible Driver</h3>
              <div className="form-group">
                <label>Driver Staff</label>
                <select value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)}>
                  {orgDrivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.licenseNumber})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {wizardStep === 9 && (
            <div>
              <h3>Step 9: Review Complete Summary</h3>
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "6px", fontSize: "0.85rem" }}>
                <div><strong>Route:</strong> {selectedRouteObj?.name}</div>
                <div><strong>Bus:</strong> {selectedBusObj?.busNumber} ({selectedBusObj?.plateNumber})</div>
                <div><strong>Schedule:</strong> {departureDate} at {departureTime}</div>
                <div><strong>Fare:</strong> {fareAmount} ETB</div>
                <div><strong>Driver:</strong> {selectedDriverObj?.name}</div>
              </div>
            </div>
          )}

          {wizardStep === 10 && (
            <div>
              <h3>Step 10: Publish Confirmation</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Clicking Confirm will generate trip record in DRAFT state. You can publish it immediately to make it visible to passengers.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Driver Assignment Modal */}
      <Modal
        isOpen={showDriverModal}
        onClose={() => setShowDriverModal(false)}
        title="Assign / Reassign Driver"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDriverModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAssignDriver}>Save Assignment</button>
          </>
        }
      >
        <div className="form-group">
          <label>Select Eligible Driver (Same Organization)</label>
          <select value={driverSelectId} onChange={(e) => setDriverSelectId(e.target.value)}>
            <option value="">-- Choose Driver --</option>
            {orgDrivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.licenseNumber})</option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  );
};
