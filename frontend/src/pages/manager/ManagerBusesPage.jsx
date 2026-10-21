import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { Bus, Plus, Search, AlertCircle, RefreshCw, Eye, Pencil, Trash2, AlertTriangle } from "lucide-react";

export const ManagerBusesPage = () => {
  const { t } = useTranslation();
  const {
    buses,
    selectedOrgId,
    addBus,
    updateBus,
    deleteBus,
    updateBusStatus,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Add Bus Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [capacity, setCapacity] = useState(45);
  const [model, setModel] = useState("");
  const [manufactureYear, setManufactureYear] = useState("2023");

  // View Modal State
  const [viewingBus, setViewingBus] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Edit Modal State
  const [editingBus, setEditingBus] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBusNumber, setEditBusNumber] = useState("");
  const [editPlateNumber, setEditPlateNumber] = useState("");
  const [editCapacity, setEditCapacity] = useState(45);
  const [editModel, setEditModel] = useState("");
  const [editManufactureYear, setEditManufactureYear] = useState("2023");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editError, setEditError] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Modal State
  const [deletingBus, setDeletingBus] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery]);

  const orgBuses = buses.filter((b) => b.organizationId === selectedOrgId);
  const filteredBuses = orgBuses.filter((b) => {
    const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
    const matchesSearch =
      (b.plateNumber && b.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.busNumber && b.busNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.model && b.model.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredBuses.length / pageSize) || 1;
  const paginatedBuses = filteredBuses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleAddBus = async (e) => {
    if (e) e.preventDefault();
    setFormError("");
    const trimmedPlate = plateNumber.trim();
    if (!trimmedPlate) {
      setFormError("Plate number is required.");
      return;
    }
    if (Number(capacity) <= 0 || isNaN(capacity)) {
      setFormError("Please enter a valid passenger seat capacity.");
      return;
    }

    const localDuplicate = orgBuses.find(
      (b) => b.plateNumber && b.plateNumber.trim().toLowerCase() === trimmedPlate.toLowerCase()
    );
    if (localDuplicate) {
      setFormError(`A bus with plate number '${trimmedPlate}' is already registered in your fleet.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addBus({
        busNumber: busNumber.trim() || trimmedPlate,
        plateNumber: trimmedPlate,
        capacity: Number(capacity),
        model: model.trim() || "Standard Coach",
        manufactureYear,
        organizationId: selectedOrgId
      });
      setBusNumber("");
      setPlateNumber("");
      setCapacity(45);
      setModel("");
      setFormError("");
      setShowAddModal(false);
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        err.message ||
        `Failed to add bus with plate '${trimmedPlate}'. A vehicle with this plate may already be registered.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenView = (bus) => {
    setViewingBus(bus);
    setShowViewModal(true);
  };

  const handleOpenEdit = (bus) => {
    setEditingBus(bus);
    setEditBusNumber(bus.busNumber || "");
    setEditPlateNumber(bus.plateNumber || "");
    setEditCapacity(bus.capacity || 45);
    setEditModel(bus.model || "");
    setEditManufactureYear(bus.manufactureYear || "2023");
    setEditStatus(bus.status || "ACTIVE");
    setEditError("");
    setShowEditModal(true);
  };

  const handleUpdateBus = async (e) => {
    if (e) e.preventDefault();
    setEditError("");
    const trimmedPlate = editPlateNumber.trim();
    if (!trimmedPlate) {
      setEditError("Plate number is required.");
      return;
    }
    if (Number(editCapacity) <= 0 || isNaN(editCapacity)) {
      setEditError("Please enter a valid passenger seat capacity.");
      return;
    }

    setIsSubmittingEdit(true);
    try {
      await updateBus(editingBus.id, {
        busNumber: editBusNumber.trim() || trimmedPlate,
        plateNumber: trimmedPlate,
        capacity: Number(editCapacity),
        model: editModel.trim() || "Standard Coach",
        manufactureYear: editManufactureYear,
        status: editStatus
      });
      setShowEditModal(false);
      setEditingBus(null);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || "Failed to update bus.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenDelete = (bus) => {
    setDeletingBus(bus);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBus) return;
    setDeleteError("");
    setIsSubmittingDelete(true);
    try {
      await deleteBus(deletingBus.id);
      setShowDeleteModal(false);
      setDeletingBus(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || "Failed to remove bus from fleet.");
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>{t("managerBuses.title", "Fleet & Buses")}</h1>
          <p>{t("managerBuses.subtitle", "Manage vehicle inventory and operational statuses for your organization fleet.")}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchCoordinatorData(selectedOrgId)}
            disabled={isLoadingData}
          >
            <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> {t("common.refresh", "Refresh")}
          </button>
          <button className="btn btn-primary" onClick={() => { setFormError(""); setShowAddModal(true); }}>
            <Plus size={16} /> {t("managerBuses.registerBtn", "Register New Bus")}
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
                placeholder={t("managerBuses.searchPlaceholder", "Search bus #, plate, model...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">{t("managerBuses.allStatuses", "All Statuses")}</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {t("managerBuses.totalBuses", "Total Company Buses")}: <strong>{orgBuses.length}</strong>
          </div>
        </div>

        {filteredBuses.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <Bus size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>{t("managerBuses.noVehicles", "No vehicles matching your filter.")}</div>
            {orgBuses.length === 0 && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={() => { setFormError(""); setShowAddModal(true); }}
              >
                <Plus size={14} /> {t("managerBuses.registerFirst", "Register First Bus")}
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "920px" }}>
              <thead>
                <tr>
                  <th>{t("managerBuses.tableBusCode", "Bus Code")}</th>
                  <th>{t("managerBuses.tablePlateNumber", "Plate Number")}</th>
                  <th>{t("managerBuses.tableModel", "Vehicle Model")}</th>
                  <th>{t("managerBuses.tableCapacity", "Passenger Capacity")}</th>
                  <th>{t("managerBuses.tableYear", "Year")}</th>
                  <th>{t("managerBuses.tableStatus", "Status")}</th>
                  <th>{t("managerBuses.tableLastUpdate", "Last Update")}</th>
                  <th style={{ textAlign: "right" }}>{t("common.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBuses.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Bus size={14} color="var(--primary)" /> {b.busNumber}
                      </strong>
                    </td>
                    <td><code>{b.plateNumber}</code></td>
                    <td>{b.model}</td>
                    <td><span style={{ fontWeight: 700 }}>{b.capacity} {t("managerBuses.seatsSuffix", "Seats")}</span></td>
                    <td>{b.manufactureYear}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Badge status={b.status} />
                        <select
                          className="org-selector-select"
                          value={b.status}
                          onChange={(e) => updateBusStatus(b.id, e.target.value)}
                          title="Change operational status"
                          style={{ fontSize: "0.75rem", padding: "0.2rem 0.35rem" }}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="MAINTENANCE">MAINTENANCE</option>
                        </select>
                      </div>
                    </td>
                    <td>{b.lastMaintenance || "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenView(b)}
                          title="View vehicle details"
                        >
                          <Eye size={13} /> {t("common.view", "View")}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(b)}
                          title="Edit vehicle details"
                        >
                          <Pencil size={13} /> {t("common.edit", "Edit")}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleOpenDelete(b)}
                          title="Delete vehicle"
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
          totalItems={filteredBuses.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel={t("managerBuses.title", "fleet buses")}
        />
      </div>

      {/* View Bus Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingBus(null); }}
        title={t("managerBuses.viewTitle", "Vehicle Details")}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowViewModal(false); setViewingBus(null); }}
            >
              {t("common.close", "Close")}
            </button>
            {viewingBus && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  const bus = viewingBus;
                  setShowViewModal(false);
                  setViewingBus(null);
                  handleOpenEdit(bus);
                }}
              >
                <Pencil size={14} /> {t("common.edit", "Edit Vehicle")}
              </button>
            )}
          </div>
        }
      >
        {viewingBus && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Bus Operational Code</span>
                <strong style={{ fontSize: "1rem", color: "var(--text-main)" }}>{viewingBus.busNumber}</strong>
              </div>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Plate Number</span>
                <code style={{ fontSize: "1rem", fontWeight: 700 }}>{viewingBus.plateNumber}</code>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Vehicle Model</span>
                <span style={{ fontWeight: 600 }}>{viewingBus.model || "Standard Coach"}</span>
              </div>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Passenger Seat Capacity</span>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>{viewingBus.capacity} Seats</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Manufacture Year</span>
                <span>{viewingBus.manufactureYear || "—"}</span>
              </div>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Operational Status</span>
                <Badge status={viewingBus.status} />
              </div>
            </div>

            <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Last Maintenance / Service Date</span>
              <span>{viewingBus.lastMaintenance || "None recorded"}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Bus Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingBus(null); }}
        title={t("managerBuses.editTitle", "Edit Fleet Vehicle")}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowEditModal(false); setEditingBus(null); }}
              disabled={isSubmittingEdit}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpdateBus}
              disabled={isSubmittingEdit || !editPlateNumber.trim()}
            >
              {isSubmittingEdit ? t("common.saving", "Saving...") : t("common.saveChanges", "Save Changes")}
            </button>
          </div>
        }
      >
        <form onSubmit={handleUpdateBus} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
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
              gap: "0.5rem",
              marginBottom: "0.75rem"
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{editError}</span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t("managerBuses.busNumberLabel", "Bus Number / Operational Code")}</label>
              <input
                type="text"
                className="form-control"
                value={editBusNumber}
                onChange={(e) => setEditBusNumber(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("managerBuses.plateNumberLabel", "Plate Number")} *</label>
              <input
                type="text"
                className="form-control"
                value={editPlateNumber}
                onChange={(e) => {
                  setEditPlateNumber(e.target.value);
                  if (editError) setEditError("");
                }}
                required
              />
            </div>
          </div>

          <div className="form-divider" />

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t("managerBuses.capacityLabel", "Passenger Seat Capacity")} *</label>
              <input
                type="number"
                className="form-control"
                min="10"
                max="80"
                value={editCapacity}
                onChange={(e) => setEditCapacity(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("managerBuses.yearLabel", "Manufacture Year")}</label>
              <input
                type="text"
                className="form-control"
                value={editManufactureYear}
                onChange={(e) => setEditManufactureYear(e.target.value)}
              />
            </div>
          </div>

          <div className="form-divider" />

          <div className="form-group">
            <label className="form-label">{t("managerBuses.modelLabel", "Bus Make & Model Specification")}</label>
            <input
              type="text"
              className="form-control"
              value={editModel}
              onChange={(e) => setEditModel(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("managerBuses.tableStatus", "Operational Status")}</label>
            <select
              className="form-control"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletingBus(null); }}
        title={t("managerBuses.deleteTitle", "Confirm Bus Deletion")}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowDeleteModal(false); setDeletingBus(null); }}
              disabled={isSubmittingDelete}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleConfirmDelete}
              disabled={isSubmittingDelete}
            >
              {isSubmittingDelete ? t("common.deleting", "Deleting...") : t("common.delete", "Delete Bus")}
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
                Are you sure you want to remove vehicle <code>{deletingBus?.plateNumber}</code> ({deletingBus?.busNumber}) from your fleet?
              </p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                This action cannot be undone. Buses assigned to upcoming trips cannot be deleted until those trips are rescheduled or cancelled.
              </p>
            </div>
          </div>

          {deletingBus && (
            <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)", fontSize: "0.85rem" }}>
              <div><strong>Model:</strong> {deletingBus.model}</div>
              <div><strong>Capacity:</strong> {deletingBus.capacity} Seats</div>
              <div><strong>Status:</strong> {deletingBus.status}</div>
            </div>
          )}
        </div>
      </Modal>

      {/* Add Bus Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t("managerBuses.modalTitle", "Register New Fleet Vehicle")}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowAddModal(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddBus}
              disabled={isSubmitting || !plateNumber.trim()}
            >
              {isSubmitting ? t("managerBuses.saving", "Saving...") : t("managerBuses.saveBtn", "Save Vehicle")}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddBus} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {formError && (
            <div style={{
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "0.5rem",
              color: "#ef4444",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem"
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t("managerBuses.busNumberLabel", "Bus Number / Operational Code")}</label>
              <input
                type="text"
                className="form-control"
                placeholder={t("managerBuses.busNumberPlaceholder", "e.g. SLM-104")}
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("managerBuses.plateNumberLabel", "Plate Number")} *</label>
              <input
                type="text"
                className="form-control"
                placeholder={t("managerBuses.plateNumberPlaceholder", "e.g. ET-3-55109")}
                value={plateNumber}
                onChange={(e) => {
                  setPlateNumber(e.target.value);
                  if (formError) setFormError("");
                }}
                required
              />
              <span className="help-text">
                {t("managerBuses.plateHint", "Must be unique within your organization.")}
              </span>
            </div>
          </div>

          <div className="form-divider" />

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t("managerBuses.capacityLabel", "Passenger Seat Capacity")} *</label>
              <input
                type="number"
                className="form-control"
                min="10"
                max="80"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("managerBuses.yearLabel", "Manufacture Year")}</label>
              <input
                type="text"
                className="form-control"
                value={manufactureYear}
                onChange={(e) => setManufactureYear(e.target.value)}
              />
            </div>
          </div>

          <div className="form-divider" />

          <div className="form-group">
            <label className="form-label">{t("managerBuses.modelLabel", "Bus Make & Model Specification")}</label>
            <input
              type="text"
              className="form-control"
              placeholder={t("managerBuses.modelPlaceholder", "e.g. Yutong ZK6129 Luxury Coach")}
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManagerBusesPage;
