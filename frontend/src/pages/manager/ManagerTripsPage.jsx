import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { CalendarDays, Plus, Search, UserCheck, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Clock } from "lucide-react";

export const ManagerTripsPage = () => {
  const { t } = useTranslation();
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  // Wizard form state
  const orgBuses = buses.filter((b) => b.organizationId === selectedOrgId && b.status === "ACTIVE");
  const orgDrivers = drivers.filter((d) => d.organizationId === selectedOrgId);

  const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.id || "");
  const [selectedBusId, setSelectedBusId] = useState(orgBuses[0]?.id || "");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
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

  const totalPages = Math.ceil(filteredTrips.length / pageSize) || 1;
  const paginatedTrips = filteredTrips.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const [tripError, setTripError] = useState("");
  const [isSubmittingTrip, setIsSubmittingTrip] = useState(false);

  const handleCreateTripSubmit = async () => {
    setTripError("");
    setIsSubmittingTrip(true);
    try {
      if (!departureDate || !departureTime) {
        setTripError("Departure date and time are required.");
        setIsSubmittingTrip(false);
        return;
      }
      await createTrip({
        routeId: selectedRouteId,
        busId: selectedBusId,
        departureDate,
        departureTime,
        arrivalTime,
        fareAmount: Number(fareAmount),
        driverId: selectedDriverId
      });
      setTripError("");
      setShowWizardModal(false);
      setWizardStep(1);
      setDepartureDate("");
      setDepartureTime("");
      setArrivalTime("");
    } catch (err) {
      setTripError(err.response?.data?.message || err.message || "Failed to schedule trip.");
    } finally {
      setIsSubmittingTrip(false);
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
          <h1>{t("managerTrips.title")}</h1>
          <p>{t("managerTrips.subtitle")}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchCoordinatorData(selectedOrgId)}
            disabled={isLoadingData}
          >
            <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> {t("common.refresh", "Refresh")}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setTripError("");
              setShowWizardModal(true);
              setWizardStep(1);
            }}
          >
            <Plus size={16} /> {t("managerTrips.scheduleBtn")}
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
                className="form-control"
                placeholder={t("managerTrips.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">{t("managerTrips.allStatuses")}</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {t("managerTrips.totalTrips")}: <strong>{orgTrips.length}</strong>
          </div>
        </div>

        {filteredTrips.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <Clock size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>{t("managerTrips.noTrips")}</div>
            {orgTrips.length === 0 && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={() => {
                  setShowWizardModal(true);
                  setWizardStep(1);
                }}
              >
                <Plus size={14} /> {t("managerTrips.scheduleFirst")}
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "900px" }}>
            <thead>
              <tr>
                <th>{t("managerTrips.tableTripCode")}</th>
                <th>{t("managerTrips.tableRoute")}</th>
                <th>{t("managerTrips.tableBus")}</th>
                <th>{t("managerTrips.tableDriver")}</th>
                <th>{t("managerTrips.tableDeparture")}</th>
                <th>{t("managerTrips.tableFare")}</th>
                <th>{t("managerTrips.tableSeats")}</th>
                <th>{t("managerTrips.tableStatus")}</th>
                <th>{t("managerTrips.tableActions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrips.map((tItem) => (
                <tr key={tItem.id}>
                  <td><code>{tItem.tripCode}</code></td>
                  <td><strong>{tItem.routeName}</strong></td>
                  <td><code>{tItem.busPlateNumber}</code></td>
                  <td>
                    <span style={{ fontWeight: 600, color: tItem.driverName === "Unassigned" ? "var(--warning-text)" : "var(--text-main)" }}>
                      {tItem.driverName === "Unassigned" ? t("managerTrips.unassigned") : tItem.driverName}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{tItem.departureDate}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 700 }}>{tItem.departureTime}</div>
                  </td>
                  <td><strong>{tItem.fareAmount} ETB</strong></td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{tItem.bookedSeatsCount} / {tItem.totalSeats}</span>
                  </td>
                  <td><Badge status={tItem.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      {tItem.status === "DRAFT" ? (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => publishTrip(tItem.id)}
                        >
                          {t("managerTrips.publish")}
                        </button>
                      ) : (tItem.status === "PUBLISHED" || tItem.status === "SCHEDULED") && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => unpublishTrip(tItem.id)}
                          title="Move trip back to draft"
                        >
                          {t("managerTrips.unpublish")}
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setTargetTripId(tItem.id);
                          setShowDriverModal(true);
                        }}
                      >
                        {t("managerTrips.assignDriver")}
                      </button>
                      {tItem.status !== "CANCELLED" && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => cancelTrip(tItem.id)}
                        >
                          {t("managerTrips.cancel")}
                        </button>
                      )}
                    </div>
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
          totalItems={filteredTrips.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          itemLabel="trips"
        />
      </div>

      {/* 10-Step Wizard Modal */}
      <Modal
        isOpen={showWizardModal}
        onClose={() => setShowWizardModal(false)}
        title={`${t("managerTrips.wizardTitle")} (${t("managerTrips.step")} ${wizardStep} ${t("managerTrips.of")} 10)`}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            {wizardStep > 1 ? (
              <button className="btn btn-secondary" onClick={() => setWizardStep(wizardStep - 1)}>
                {t("managerTrips.back")}
              </button>
            ) : <div />}
            {wizardStep < 10 ? (
              <button className="btn btn-primary" onClick={() => setWizardStep(wizardStep + 1)}>
                {t("managerTrips.next")} <ArrowRight size={14} />
              </button>
            ) : (
              <button
                className="btn btn-success"
                onClick={handleCreateTripSubmit}
                disabled={isSubmittingTrip}
              >
                {isSubmittingTrip ? t("managerTrips.creating") : t("managerTrips.confirmTrip")}
              </button>
            )}
          </div>
        }
      >
        <div>
          {tripError && (
            <div style={{
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "0.375rem",
              color: "#ef4444",
              fontSize: "0.85rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{tripError}</span>
            </div>
          )}

          {/* Step Progress Bar */}
          <div style={{ display: "flex", gap: "2px", marginBottom: "1.25rem" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
              <div
                key={step}
                style={{
                  flex: 1,
                  height: "5px",
                  borderRadius: "2px",
                  background: step <= wizardStep ? "var(--primary)" : "var(--border-color, #334155)"
                }}
              />
            ))}
          </div>

          {wizardStep === 1 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>{t("managerTrips.step1Title")}</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                {t("managerTrips.step1Desc")}
              </p>
              <div className="form-divider" />
              <div className="form-group">
                <label className="form-label">{t("managerTrips.tableRoute")}</label>
                <select className="form-control" value={selectedRouteId} onChange={(e) => setSelectedRouteId(e.target.value)}>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.distanceKm} km)</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>{t("managerTrips.step2Title")}</h3>
              <div className="form-divider" />
              <div className="form-group">
                <label className="form-label">{t("managerTrips.tableBus")}</label>
                <select className="form-control" value={selectedBusId} onChange={(e) => setSelectedBusId(e.target.value)}>
                  {orgBuses.map((b) => (
                    <option key={b.id} value={b.id}>{b.busNumber} ({b.plateNumber}) - {b.capacity} Seats</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>{t("managerTrips.step3Title")}</h3>
              <div className="form-divider" />
              <div style={{ background: "var(--bg-card, #ffffff)", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "8px", color: "var(--text-main)" }}>
                <strong>{t("managerRoutes.originLabel")}:</strong> {selectedRouteObj?.originStationName}
              </div>
            </div>
          )}

          {wizardStep === 4 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>{t("managerTrips.step4Title")}</h3>
              <div className="form-divider" />
              <div style={{ background: "var(--bg-card, #ffffff)", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "8px", color: "var(--text-main)" }}>
                <strong>{t("managerRoutes.destLabel")}:</strong> {selectedRouteObj?.destinationStationName}
              </div>
            </div>
          )}

          {wizardStep === 5 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>{t("managerTrips.step5Title")}</h3>
              <div className="form-divider" />
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("managerTrips.depDate")}</label>
                  <input className="form-control" type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("managerTrips.depTime")}</label>
                  <input className="form-control" type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("managerTrips.arrTime")}</label>
                <input className="form-control" type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
              </div>
            </div>
          )}

          {wizardStep === 6 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>{t("managerTrips.step6Title")}</h3>
              <div className="form-divider" />
              <div className="form-group">
                <label className="form-label">{t("managerTrips.fareAmount")}</label>
                <input
                  type="number"
                  min="50"
                  className="form-control"
                  value={fareAmount}
                  onChange={(e) => setFareAmount(e.target.value)}
                />
              </div>
            </div>
          )}

          {wizardStep === 7 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>{t("managerTrips.step7Title")}</h3>
              <div className="form-divider" />
              <div style={{ background: "var(--bg-card, #ffffff)", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "8px", color: "var(--text-main)" }}>
                <div>Total Seat Grid: <strong>{selectedBusObj?.capacity || 45} Seats</strong></div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                  Seats 1 through {selectedBusObj?.capacity || 45} will be initialized as AVAILABLE.
                </div>
              </div>
            </div>
          )}

          {wizardStep === 8 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>{t("managerTrips.step8Title")}</h3>
              <div className="form-divider" />
              <div className="form-group">
                <label className="form-label">{t("managerTrips.driverStaff")}</label>
                <select className="form-control" value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)}>
                  {orgDrivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.licenseNumber})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {wizardStep === 9 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>{t("managerTrips.step9Title")}</h3>
              <div className="form-divider" />
              <div style={{ background: "var(--bg-card, #ffffff)", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "8px", fontSize: "0.85rem", color: "var(--text-main)" }}>
                <div style={{ marginBottom: "0.4rem" }}><strong>Route:</strong> {selectedRouteObj?.name}</div>
                <div style={{ marginBottom: "0.4rem" }}><strong>Bus:</strong> {selectedBusObj?.busNumber} ({selectedBusObj?.plateNumber})</div>
                <div style={{ marginBottom: "0.4rem" }}><strong>Schedule:</strong> {departureDate} at {departureTime}</div>
                <div style={{ marginBottom: "0.4rem" }}><strong>Fare:</strong> {fareAmount} ETB</div>
                <div><strong>Driver:</strong> {selectedDriverObj?.name}</div>
              </div>
            </div>
          )}

          {wizardStep === 10 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>{t("managerTrips.step10Title")}</h3>
              <div className="form-divider" />
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
        title={t("managerTrips.assignModalTitle")}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDriverModal(false)}>{t("common.cancel", "Cancel")}</button>
            <button className="btn btn-primary" onClick={handleAssignDriver}>{t("managerTrips.saveAssignment")}</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">{t("managerTrips.selectDriverPrompt")}</label>
          <select className="form-control" value={driverSelectId} onChange={(e) => setDriverSelectId(e.target.value)}>
            <option value="">{t("managerTrips.chooseDriver")}</option>
            {orgDrivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.licenseNumber})</option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  );
};
