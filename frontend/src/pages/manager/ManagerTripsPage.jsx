import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import {
  CalendarDays,
  Plus,
  Search,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Clock,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Users
} from "lucide-react";

export const ManagerTripsPage = () => {
  const { t } = useTranslation();
  const {
    trips,
    routes,
    buses,
    drivers,
    verifiers,
    selectedOrgId,
    createTrip,
    updateTrip,
    deleteTrip,
    publishTrip,
    unpublishTrip,
    cancelTrip,
    assignDriverToTrip,
    assignVerifierToTrip,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Wizard form state
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [tripError, setTripError] = useState("");
  const [isSubmittingTrip, setIsSubmittingTrip] = useState(false);

  // Filtered resources scoped strictly to the selected organization
  const orgRoutes = routes.filter((r) => r.organizationId === selectedOrgId);
  const orgBuses = buses.filter((b) => b.organizationId === selectedOrgId && b.status === "ACTIVE");
  const orgDrivers = drivers.filter((d) => d.organizationId === selectedOrgId && d.status === "ACTIVE");
  const orgVerifiers = verifiers.filter((v) => v.organizationId === selectedOrgId && v.status === "ACTIVE");

  // Wizard fields
  const [selectedRouteId, setSelectedRouteId] = useState(orgRoutes[0]?.id || "");
  const [selectedBusId, setSelectedBusId] = useState(orgBuses[0]?.id || "");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [fareAmount, setFareAmount] = useState(850);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedVerifierId, setSelectedVerifierId] = useState("");

  // Quick Staff Assignment Modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [targetTrip, setTargetTrip] = useState(null);
  const [staffDriverId, setStaffDriverId] = useState("");
  const [staffVerifierId, setStaffVerifierId] = useState("");
  const [isSavingStaff, setIsSavingStaff] = useState(false);

  // View Modal State
  const [viewingTrip, setViewingTrip] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Edit Modal State
  const [editingTrip, setEditingTrip] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRouteId, setEditRouteId] = useState("");
  const [editBusId, setEditBusId] = useState("");
  const [editDepartureDate, setEditDepartureDate] = useState("");
  const [editDepartureTime, setEditDepartureTime] = useState("");
  const [editArrivalTime, setEditArrivalTime] = useState("");
  const [editFare, setEditFare] = useState(850);
  const [editDriverId, setEditDriverId] = useState("");
  const [editVerifierId, setEditVerifierId] = useState("");
  const [editStatus, setEditStatus] = useState("SCHEDULED");
  const [editError, setEditError] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Modal State
  const [deletingTrip, setDeletingTrip] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const orgTrips = trips.filter((t) => t.organizationId === selectedOrgId);
  const filteredTrips = orgTrips.filter((t) => {
    const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
    const matchesSearch =
      (t.tripCode && t.tripCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.routeName && t.routeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.busPlateNumber && t.busPlateNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.driverName && t.driverName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.verifierName && t.verifierName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredTrips.length / pageSize) || 1;
  const paginatedTrips = filteredTrips.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const openWizard = () => {
    setTripError("");
    setWizardStep(1);
    setSelectedRouteId(orgRoutes[0]?.id || "");
    setSelectedBusId(orgBuses[0]?.id || "");
    setDepartureDate("");
    setDepartureTime("");
    setArrivalTime("");
    setFareAmount(850);
    setSelectedDriverId(orgDrivers[0]?.id || "");
    setSelectedVerifierId(orgVerifiers[0]?.id || "");
    setShowWizardModal(true);
  };

  const handleCreateTripSubmit = async () => {
    setTripError("");
    if (!departureDate || !departureTime) {
      setTripError("Departure date and departure time are required.");
      return;
    }
    if (!selectedRouteId) {
      setTripError("Please select a route corridor.");
      return;
    }
    if (!selectedBusId) {
      setTripError("Please select an active bus.");
      return;
    }
    if (Number(fareAmount) <= 0 || isNaN(fareAmount)) {
      setTripError("Please enter a valid fare amount.");
      return;
    }

    setIsSubmittingTrip(true);
    try {
      await createTrip({
        routeId: selectedRouteId,
        busId: selectedBusId,
        departureDate,
        departureTime,
        arrivalTime: arrivalTime || undefined,
        fareAmount: Number(fareAmount),
        driverId: selectedDriverId || null,
        verifierId: selectedVerifierId || null,
      });
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

  const handleOpenView = (trip) => {
    setViewingTrip(trip);
    setShowViewModal(true);
  };

  const handleOpenEdit = (trip) => {
    setEditingTrip(trip);
    setEditRouteId(trip.routeId || orgRoutes[0]?.id || "");
    setEditBusId(trip.busId || orgBuses[0]?.id || "");
    setEditDepartureDate(trip.departureDate || "");
    setEditDepartureTime(trip.departureTime || "");
    setEditArrivalTime(trip.arrivalTime || "");
    setEditFare(trip.fareAmount || 850);
    setEditDriverId(trip.driverId || "");
    setEditVerifierId(trip.verifierId || "");
    setEditStatus(trip.status === "PUBLISHED" ? "SCHEDULED" : trip.status);
    setEditError("");
    setShowEditModal(true);
  };

  const handleUpdateTrip = async (e) => {
    if (e) e.preventDefault();
    setEditError("");
    if (!editDepartureDate || !editDepartureTime) {
      setEditError("Departure date and departure time are required.");
      return;
    }
    if (Number(editFare) <= 0 || isNaN(editFare)) {
      setEditError("Please enter a valid fare amount.");
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const departureTimeISO = new Date(`${editDepartureDate}T${editDepartureTime}:00`).toISOString();
      const arrivalTimeISO = editArrivalTime
        ? new Date(`${editDepartureDate}T${editArrivalTime}:00`).toISOString()
        : null;

      await updateTrip(editingTrip.id, {
        busId: editBusId || undefined,
        routeId: editRouteId || undefined,
        driverId: editDriverId || null,
        verifierId: editVerifierId || null,
        departureTime: departureTimeISO,
        arrivalTime: arrivalTimeISO,
        fareAmount: Number(editFare),
        fare: Number(editFare),
        status: editStatus,
      });
      setShowEditModal(false);
      setEditingTrip(null);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || "Failed to update trip.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenDelete = (trip) => {
    setDeletingTrip(trip);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTrip) return;
    setDeleteError("");
    setIsSubmittingDelete(true);
    try {
      await deleteTrip(deletingTrip.id);
      setShowDeleteModal(false);
      setDeletingTrip(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || "Failed to delete trip.");
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const handleOpenStaffModal = (trip) => {
    setTargetTrip(trip);
    setStaffDriverId(trip.driverId || "");
    setStaffVerifierId(trip.verifierId || "");
    setShowStaffModal(true);
  };

  const handleSaveStaffAssignment = async () => {
    if (!targetTrip) return;
    setIsSavingStaff(true);
    try {
      if (staffDriverId !== targetTrip.driverId) {
        await assignDriverToTrip(targetTrip.id, staffDriverId || null);
      }
      if (staffVerifierId !== targetTrip.verifierId) {
        await assignVerifierToTrip(targetTrip.id, staffVerifierId || null);
      }
      setShowStaffModal(false);
      setTargetTrip(null);
    } finally {
      setIsSavingStaff(false);
    }
  };

  const selectedRouteObj = routes.find((r) => r.id === selectedRouteId);
  const selectedBusObj = buses.find((b) => b.id === selectedBusId);
  const selectedDriverObj = drivers.find((d) => d.id === selectedDriverId);
  const selectedVerifierObj = verifiers.find((v) => v.id === selectedVerifierId);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>{t("managerTrips.title", "Trips & Schedules")}</h1>
          <p>{t("managerTrips.subtitle", "Create, dispatch, monitor and manage operational trips for your fleet.")}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchCoordinatorData(selectedOrgId)}
            disabled={isLoadingData}
          >
            <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> {t("common.refresh", "Refresh")}
          </button>
          <button className="btn btn-primary" onClick={openWizard}>
            <Plus size={16} /> {t("managerTrips.scheduleBtn", "Schedule New Trip")}
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
                placeholder={t("managerTrips.searchPlaceholder", "Search code, route, plate, staff...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">{t("managerTrips.allStatuses", "All Statuses")}</option>
              <option value="PUBLISHED">PUBLISHED / SCHEDULED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="BOARDING">BOARDING</option>
              <option value="IN_TRANSIT">IN TRANSIT</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {t("managerTrips.totalTrips", "Total Trips")}: <strong>{orgTrips.length}</strong>
          </div>
        </div>

        {filteredTrips.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <Clock size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>{t("managerTrips.noTrips", "No scheduled trips found matching your filter.")}</div>
            {orgTrips.length === 0 && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={openWizard}
              >
                <Plus size={14} /> {t("managerTrips.scheduleFirst", "Schedule First Trip")}
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "1050px" }}>
              <thead>
                <tr>
                  <th>{t("managerTrips.tableTripCode", "Trip Code")}</th>
                  <th>{t("managerTrips.tableRoute", "Route")}</th>
                  <th>{t("managerTrips.tableBus", "Bus Plate")}</th>
                  <th>Staff (Driver & Verifier)</th>
                  <th>{t("managerTrips.tableDeparture", "Departure")}</th>
                  <th>{t("managerTrips.tableFare", "Fare")}</th>
                  <th>{t("managerTrips.tableSeats", "Seats Booked")}</th>
                  <th>{t("managerTrips.tableStatus", "Status")}</th>
                  <th style={{ textAlign: "right" }}>{t("managerTrips.tableActions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrips.map((tItem) => (
                  <tr key={tItem.id}>
                    <td><code>{tItem.tripCode}</code></td>
                    <td><strong>{tItem.routeName}</strong></td>
                    <td><code>{tItem.busPlateNumber}</code></td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.8rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: tItem.driverName === "Unassigned" ? "var(--warning-text)" : "var(--text-main)" }}>
                          <UserCheck size={12} color="var(--primary)" />
                          <strong>Driver:</strong> {tItem.driverName || "Unassigned"}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: tItem.verifierName === "Unassigned" ? "var(--text-muted)" : "var(--text-main)" }}>
                          <QrCode size={12} color="#059669" />
                          <strong>Verifier:</strong> {tItem.verifierName || "Unassigned"}
                        </span>
                      </div>
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
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.3rem", alignItems: "center" }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenView(tItem)}
                          title="View trip details"
                        >
                          <Eye size={13} /> {t("common.view", "View")}
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(tItem)}
                          title="Edit trip details"
                        >
                          <Pencil size={13} /> {t("common.edit", "Edit")}
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenStaffModal(tItem)}
                          title="Assign Driver and Ticket Verifier"
                        >
                          <Users size={13} />
                        </button>

                        {tItem.status === "DRAFT" ? (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => publishTrip(tItem.id)}
                            title="Publish trip to passengers"
                          >
                            {t("managerTrips.publish", "Publish")}
                          </button>
                        ) : (tItem.status === "PUBLISHED" || tItem.status === "SCHEDULED") && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => unpublishTrip(tItem.id)}
                            title="Move trip back to draft"
                          >
                            {t("managerTrips.unpublish", "Unpublish")}
                          </button>
                        )}

                        {tItem.status !== "CANCELLED" && tItem.status !== "COMPLETED" && (
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => cancelTrip(tItem.id)}
                            title="Cancel trip"
                            style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#d97706", borderColor: "rgba(245, 158, 11, 0.3)" }}
                          >
                            {t("managerTrips.cancel", "Cancel")}
                          </button>
                        )}

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleOpenDelete(tItem)}
                          title="Delete trip record"
                        >
                          <Trash2 size={13} />
                        </button>
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

      {/* View Trip Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingTrip(null); }}
        title={t("managerTrips.viewTitle", "Trip Schedule Details")}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowViewModal(false); setViewingTrip(null); }}
            >
              {t("common.close", "Close")}
            </button>
            {viewingTrip && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  const trip = viewingTrip;
                  setShowViewModal(false);
                  setViewingTrip(null);
                  handleOpenEdit(trip);
                }}
              >
                <Pencil size={14} /> {t("common.edit", "Edit Trip")}
              </button>
            )}
          </div>
        }
      >
        {viewingTrip && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Trip Reference Code</span>
                <code style={{ fontSize: "1.1rem", fontWeight: 700 }}>{viewingTrip.tripCode}</code>
              </div>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Operational Status</span>
                <div style={{ marginTop: "0.25rem" }}>
                  <Badge status={viewingTrip.status} />
                </div>
              </div>
            </div>

            <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Route Corridor</span>
              <strong style={{ fontSize: "1rem", color: "var(--text-main)" }}>{viewingTrip.routeName}</strong>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Departure Schedule</span>
                <strong>{viewingTrip.departureDate} at {viewingTrip.departureTime}</strong>
              </div>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Passenger Fare</span>
                <strong style={{ color: "var(--primary)" }}>{viewingTrip.fareAmount} ETB</strong>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Vehicle Fleet Assignment</span>
                <code>{viewingTrip.busPlateNumber}</code> ({viewingTrip.totalSeats} Total Seats)
              </div>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Seat Booking State</span>
                <strong>{viewingTrip.bookedSeatsCount} booked</strong> / {viewingTrip.totalSeats} seats
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Assigned Driver</span>
                <span style={{ fontWeight: 600 }}>{viewingTrip.driverName || "Unassigned"}</span>
              </div>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Assigned Ticket Verifier</span>
                <span style={{ fontWeight: 600 }}>{viewingTrip.verifierName || "Unassigned"}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Trip Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingTrip(null); }}
        title={t("managerTrips.editTitle", "Edit Trip Schedule")}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowEditModal(false); setEditingTrip(null); }}
              disabled={isSubmittingEdit}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpdateTrip}
              disabled={isSubmittingEdit}
            >
              {isSubmittingEdit ? t("common.saving", "Saving...") : t("common.saveChanges", "Save Changes")}
            </button>
          </div>
        }
      >
        <form onSubmit={handleUpdateTrip} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {editError && (
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
              <span>{editError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t("managerTrips.tableRoute", "Route Corridor")} *</label>
            <select
              className="form-control"
              value={editRouteId}
              onChange={(e) => setEditRouteId(e.target.value)}
              required
            >
              {orgRoutes.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.distanceKm} km)</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t("managerTrips.tableBus", "Fleet Vehicle")} *</label>
            <select
              className="form-control"
              value={editBusId}
              onChange={(e) => setEditBusId(e.target.value)}
              required
            >
              {orgBuses.map((b) => (
                <option key={b.id} value={b.id}>{b.busNumber} ({b.plateNumber}) - {b.capacity} Seats</option>
              ))}
            </select>
          </div>

          <div className="form-divider" />

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t("managerTrips.depDate", "Departure Date")} *</label>
              <input
                type="date"
                className="form-control"
                value={editDepartureDate}
                onChange={(e) => setEditDepartureDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("managerTrips.depTime", "Departure Time")} *</label>
              <input
                type="time"
                className="form-control"
                value={editDepartureTime}
                onChange={(e) => setEditDepartureTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t("managerTrips.arrTime", "Estimated Arrival Time")}</label>
              <input
                type="time"
                className="form-control"
                value={editArrivalTime}
                onChange={(e) => setEditArrivalTime(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("managerTrips.fareAmount", "Fare (ETB)")} *</label>
              <input
                type="number"
                min="10"
                className="form-control"
                value={editFare}
                onChange={(e) => setEditFare(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-divider" />

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assign Driver</label>
              <select
                className="form-control"
                value={editDriverId}
                onChange={(e) => setEditDriverId(e.target.value)}
              >
                <option value="">-- No Driver Assigned --</option>
                {orgDrivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.licenseNumber || d.phone})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assign Ticket Verifier</label>
              <select
                className="form-control"
                value={editVerifierId}
                onChange={(e) => setEditVerifierId(e.target.value)}
              >
                <option value="">-- No Verifier Assigned --</option>
                {orgVerifiers.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.assignedStation || "Active Staff"})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t("managerTrips.tableStatus", "Trip Operational Status")}</label>
            <select
              className="form-control"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="SCHEDULED">SCHEDULED / PUBLISHED</option>
              <option value="BOARDING">BOARDING</option>
              <option value="IN_TRANSIT">IN TRANSIT</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete Trip Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletingTrip(null); }}
        title={t("managerTrips.deleteTitle", "Confirm Trip Deletion")}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowDeleteModal(false); setDeletingTrip(null); }}
              disabled={isSubmittingDelete}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleConfirmDelete}
              disabled={isSubmittingDelete}
            >
              {isSubmittingDelete ? t("common.deleting", "Deleting...") : t("common.delete", "Delete Trip")}
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {deleteError && (
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
              <span>{deleteError}</span>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <AlertTriangle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: "var(--text-main)" }}>
                Are you sure you want to delete trip <code>{deletingTrip?.tripCode}</code> ({deletingTrip?.routeName})?
              </p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Trips with confirmed passenger bookings cannot be deleted to preserve financial audit integrity. Such trips should be cancelled instead.
              </p>
            </div>
          </div>

          {deletingTrip && (
            <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)", fontSize: "0.85rem" }}>
              <div><strong>Departure:</strong> {deletingTrip.departureDate} at {deletingTrip.departureTime}</div>
              <div><strong>Assigned Bus:</strong> {deletingTrip.busPlateNumber}</div>
              <div><strong>Bookings:</strong> {deletingTrip.bookedSeatsCount} active bookings</div>
              <div><strong>Status:</strong> {deletingTrip.status}</div>
            </div>
          )}
        </div>
      </Modal>

      {/* Quick Staff Assignment Modal (Driver & Verifier) */}
      <Modal
        isOpen={showStaffModal}
        onClose={() => { setShowStaffModal(false); setTargetTrip(null); }}
        title="Assign Driver & Ticket Verifier"
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowStaffModal(false); setTargetTrip(null); }}
              disabled={isSavingStaff}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveStaffAssignment}
              disabled={isSavingStaff}
            >
              {isSavingStaff ? t("common.saving", "Saving...") : "Save Staff Assignment"}
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {targetTrip && (
            <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)", fontSize: "0.85rem" }}>
              <div><strong>Trip:</strong> <code>{targetTrip.tripCode}</code> ({targetTrip.routeName})</div>
              <div><strong>Departure:</strong> {targetTrip.departureDate} at {targetTrip.departureTime}</div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <UserCheck size={14} color="var(--primary)" /> Assign Driver
            </label>
            <select
              className="form-control"
              value={staffDriverId}
              onChange={(e) => setStaffDriverId(e.target.value)}
            >
              <option value="">-- No Driver Assigned --</option>
              {orgDrivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.licenseNumber || d.phone})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <QrCode size={14} color="#059669" /> Assign Ticket Verifier
            </label>
            <select
              className="form-control"
              value={staffVerifierId}
              onChange={(e) => setStaffVerifierId(e.target.value)}
            >
              <option value="">-- No Ticket Verifier Assigned --</option>
              {orgVerifiers.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.assignedStation || "Active Staff"})</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* 10-Step Wizard Modal */}
      <Modal
        isOpen={showWizardModal}
        onClose={() => setShowWizardModal(false)}
        title={`${t("managerTrips.wizardTitle", "Schedule Trip Wizard")} (${t("managerTrips.step", "Step")} ${wizardStep} ${t("managerTrips.of", "of")} 10)`}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            {wizardStep > 1 ? (
              <button className="btn btn-secondary" onClick={() => setWizardStep(wizardStep - 1)}>
                {t("managerTrips.back", "Back")}
              </button>
            ) : <div />}
            {wizardStep < 10 ? (
              <button className="btn btn-primary" onClick={() => setWizardStep(wizardStep + 1)}>
                {t("managerTrips.next", "Next")} <ArrowRight size={14} />
              </button>
            ) : (
              <button
                className="btn btn-success"
                onClick={handleCreateTripSubmit}
                disabled={isSubmittingTrip}
              >
                {isSubmittingTrip ? t("managerTrips.creating", "Creating Trip...") : t("managerTrips.confirmTrip", "Confirm & Schedule")}
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
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>Step 1: Select Route Corridor</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Select an approved operating highway corridor for this scheduled trip.
              </p>
              <div className="form-divider" />
              <div className="form-group">
                <label className="form-label">{t("managerTrips.tableRoute", "Route Corridor")}</label>
                <select className="form-control" value={selectedRouteId} onChange={(e) => setSelectedRouteId(e.target.value)}>
                  {orgRoutes.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.distanceKm} km)</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>Step 2: Assign Fleet Vehicle</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Choose an active vehicle from your organization fleet.
              </p>
              <div className="form-divider" />
              <div className="form-group">
                <label className="form-label">{t("managerTrips.tableBus", "Fleet Vehicle")}</label>
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
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>Step 3: Origin Terminal Information</h3>
              <div className="form-divider" />
              <div style={{ background: "var(--bg-card, #ffffff)", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "8px", color: "var(--text-main)" }}>
                <strong>Origin Terminal Station:</strong> {selectedRouteObj?.originStationName || selectedRouteObj?.origin}
              </div>
            </div>
          )}

          {wizardStep === 4 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>Step 4: Destination Terminal Information</h3>
              <div className="form-divider" />
              <div style={{ background: "var(--bg-card, #ffffff)", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "8px", color: "var(--text-main)" }}>
                <strong>Destination Terminal Station:</strong> {selectedRouteObj?.destinationStationName || selectedRouteObj?.destination}
              </div>
            </div>
          )}

          {wizardStep === 5 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>Step 5: Departure & Arrival Schedule</h3>
              <div className="form-divider" />
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("managerTrips.depDate", "Departure Date")} *</label>
                  <input className="form-control" type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("managerTrips.depTime", "Departure Time")} *</label>
                  <input className="form-control" type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("managerTrips.arrTime", "Estimated Arrival Time")}</label>
                <input className="form-control" type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
              </div>
            </div>
          )}

          {wizardStep === 6 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>Step 6: Passenger Fare Rate</h3>
              <div className="form-divider" />
              <div className="form-group">
                <label className="form-label">{t("managerTrips.fareAmount", "Fare Amount (ETB)")} *</label>
                <input
                  type="number"
                  min="50"
                  className="form-control"
                  value={fareAmount}
                  onChange={(e) => setFareAmount(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {wizardStep === 7 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>Step 7: Seat Inventory Grid</h3>
              <div className="form-divider" />
              <div style={{ background: "var(--bg-card, #ffffff)", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "8px", color: "var(--text-main)" }}>
                <div>Total Seat Grid: <strong>{selectedBusObj?.capacity || 45} Seats</strong></div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                  Seats 1 through {selectedBusObj?.capacity || 45} will be dynamically initialized as AVAILABLE in the system.
                </div>
              </div>
            </div>
          )}

          {wizardStep === 8 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>Step 8: Staff Assignment (Driver & Ticket Verifier)</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Dynamically assign active staff members belonging to your organization.
              </p>
              <div className="form-divider" />
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <UserCheck size={14} color="var(--primary)" /> Assign Driver
                </label>
                <select className="form-control" value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)}>
                  <option value="">-- No Driver Assigned --</option>
                  {orgDrivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.licenseNumber || d.phone})</option>
                  ))}
                </select>
                <span className="help-text">Only active drivers registered to your organization are listed.</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <QrCode size={14} color="#059669" /> Assign Ticket Verifier
                </label>
                <select className="form-control" value={selectedVerifierId} onChange={(e) => setSelectedVerifierId(e.target.value)}>
                  <option value="">-- No Ticket Verifier Assigned --</option>
                  {orgVerifiers.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.assignedStation || "Active Staff"})</option>
                  ))}
                </select>
                <span className="help-text">Only active ticket verifiers registered to your organization are listed.</span>
              </div>
            </div>
          )}

          {wizardStep === 9 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>Step 9: Trip Verification & Review</h3>
              <div className="form-divider" />
              <div style={{ background: "var(--bg-card, #ffffff)", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "8px", fontSize: "0.85rem", color: "var(--text-main)" }}>
                <div style={{ marginBottom: "0.4rem" }}><strong>Route:</strong> {selectedRouteObj?.name}</div>
                <div style={{ marginBottom: "0.4rem" }}><strong>Bus:</strong> {selectedBusObj?.busNumber} ({selectedBusObj?.plateNumber})</div>
                <div style={{ marginBottom: "0.4rem" }}><strong>Schedule:</strong> {departureDate} at {departureTime}</div>
                <div style={{ marginBottom: "0.4rem" }}><strong>Fare:</strong> {fareAmount} ETB</div>
                <div style={{ marginBottom: "0.4rem" }}><strong>Driver:</strong> {selectedDriverObj?.name || "Unassigned"}</div>
                <div><strong>Ticket Verifier:</strong> {selectedVerifierObj?.name || "Unassigned"}</div>
              </div>
            </div>
          )}

          {wizardStep === 10 && (
            <div>
              <h3 style={{ marginBottom: "0.4rem", color: "var(--text-main)" }}>Step 10: Confirmation & Dispatch</h3>
              <div className="form-divider" />
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Clicking Confirm will generate this trip record in the database. You can publish or edit it anytime from the trips table.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ManagerTripsPage;
