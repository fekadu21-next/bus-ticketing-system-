import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { Route as RouteIcon, Plus, Search, RefreshCw, AlertCircle, Eye, Pencil, Trash2, AlertTriangle } from "lucide-react";

export const ManagerRoutesPage = () => {
  const { t } = useTranslation();
  const {
    routes,
    stations,
    selectedOrgId,
    addRoute,
    updateRoute,
    deleteRoute,
    updateRouteStatus,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Add Route Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [originStationId, setOriginStationId] = useState("");
  const [destinationStationId, setDestinationStationId] = useState("");
  const [distanceKm, setDistanceKm] = useState(400);
  const [estimatedDuration, setEstimatedDuration] = useState("6h 00m");

  // View Route Modal State
  const [viewingRoute, setViewingRoute] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Edit Route Modal State
  const [editingRoute, setEditingRoute] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editOriginStationId, setEditOriginStationId] = useState("");
  const [editDestinationStationId, setEditDestinationStationId] = useState("");
  const [editDistanceKm, setEditDistanceKm] = useState(400);
  const [editEstimatedDuration, setEditEstimatedDuration] = useState("6h 00m");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editError, setEditError] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Route Modal State
  const [deletingRoute, setDeletingRoute] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const openAddModal = () => {
    setFormError("");
    if (stations.length > 0) {
      setOriginStationId(stations[0]?.id || "");
      setDestinationStationId(stations[1]?.id || stations[0]?.id || "");
    }
    setShowAddModal(true);
  };

  const orgRoutes = routes.filter((r) => r.organizationId === selectedOrgId);
  const filteredRoutes = orgRoutes.filter((r) => {
    const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;
    const matchesSearch =
      (r.name && r.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.originStationName && r.originStationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.destinationStationName && r.destinationStationName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRoutes.length / pageSize) || 1;
  const paginatedRoutes = filteredRoutes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleAddRoute = async (e) => {
    if (e) e.preventDefault();
    setFormError("");
    if (!originStationId || !destinationStationId) {
      setFormError("Both origin and destination terminal stations are required.");
      return;
    }
    if (originStationId === destinationStationId) {
      setFormError("Origin and Destination terminal stations must be different.");
      return;
    }
    setIsSubmitting(true);
    try {
      const originStn = stations.find((s) => s.id === originStationId);
      const destStn = stations.find((s) => s.id === destinationStationId);
      await addRoute({
        origin: originStn?.city || originStn?.name,
        destination: destStn?.city || destStn?.name,
        originStationId,
        destinationStationId,
        distanceKm: Number(distanceKm),
        estimatedDurationHours: parseFloat(estimatedDuration) || 6.0,
        estimatedDuration,
      });
      setFormError("");
      setShowAddModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to register route.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenView = (route) => {
    setViewingRoute(route);
    setShowViewModal(true);
  };

  const handleOpenEdit = (route) => {
    setEditingRoute(route);
    setEditOriginStationId(route.originStationId || "");
    setEditDestinationStationId(route.destinationStationId || "");
    setEditDistanceKm(route.distanceKm || 400);
    setEditEstimatedDuration(route.estimatedDuration || "6h 00m");
    setEditStatus(route.status || "ACTIVE");
    setEditError("");
    setShowEditModal(true);
  };

  const handleUpdateRoute = async (e) => {
    if (e) e.preventDefault();
    setEditError("");
    if (editOriginStationId && editDestinationStationId && editOriginStationId === editDestinationStationId) {
      setEditError("Origin and Destination terminal stations must be different.");
      return;
    }
    if (Number(editDistanceKm) <= 0 || isNaN(editDistanceKm)) {
      setEditError("Please enter a valid distance in kilometers.");
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const originStn = stations.find((s) => s.id === editOriginStationId);
      const destStn = stations.find((s) => s.id === editDestinationStationId);

      await updateRoute(editingRoute.id, {
        origin: originStn?.city || originStn?.name || editingRoute.origin,
        destination: destStn?.city || destStn?.name || editingRoute.destination,
        originStationId: editOriginStationId || editingRoute.originStationId,
        destinationStationId: editDestinationStationId || editingRoute.destinationStationId,
        distanceKm: Number(editDistanceKm),
        estimatedDurationHours: parseFloat(editEstimatedDuration) || 6.0,
        estimatedDuration: editEstimatedDuration,
        status: editStatus,
      });
      setShowEditModal(false);
      setEditingRoute(null);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || "Failed to update route.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenDelete = (route) => {
    setDeletingRoute(route);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRoute) return;
    setDeleteError("");
    setIsSubmittingDelete(true);
    try {
      await deleteRoute(deletingRoute.id);
      setShowDeleteModal(false);
      setDeletingRoute(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || "Failed to delete route.");
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>{t("managerRoutes.title", "Routes & Corridors")}</h1>
          <p>{t("managerRoutes.subtitle", "Permitted highway routes and intercity transit corridors for your fleet.")}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchCoordinatorData(selectedOrgId)}
            disabled={isLoadingData}
          >
            <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> {t("common.refresh", "Refresh")}
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> {t("managerRoutes.createBtn", "Create Operating Route")}
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
                placeholder={t("managerRoutes.searchPlaceholder", "Search route corridor, city, terminal...")}
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
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {t("managerRoutes.totalRoutes", "Total Active Routes")}: <strong>{orgRoutes.length}</strong>
          </div>
        </div>

        {filteredRoutes.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <RouteIcon size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>No route corridors matching your filter.</div>
            {orgRoutes.length === 0 && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={openAddModal}
              >
                <Plus size={14} /> Create First Route
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "900px" }}>
              <thead>
                <tr>
                  <th>{t("managerRoutes.tableRoute", "Route Corridor")}</th>
                  <th>{t("managerRoutes.tableOrigin", "Origin Terminal")}</th>
                  <th>{t("managerRoutes.tableDestination", "Destination Terminal")}</th>
                  <th>{t("managerRoutes.tableDistance", "Distance (KM)")}</th>
                  <th>{t("common.duration", "Est. Duration")}</th>
                  <th>{t("managerBuses.tableStatus", "Status")}</th>
                  <th style={{ textAlign: "right" }}>{t("common.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRoutes.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <RouteIcon size={14} color="var(--primary)" /> {r.name}
                      </strong>
                    </td>
                    <td>{r.originStationName}</td>
                    <td>{r.destinationStationName}</td>
                    <td><strong>{r.distanceKm} km</strong></td>
                    <td>{r.estimatedDuration}</td>
                    <td>
                      <Badge status={r.status} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenView(r)}
                          title="View route corridor details"
                        >
                          <Eye size={13} /> {t("common.view", "View")}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(r)}
                          title="Edit route corridor"
                        >
                          <Pencil size={13} /> {t("common.edit", "Edit")}
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${r.status === "ACTIVE" ? "btn-secondary" : "btn-success"}`}
                          onClick={() => updateRouteStatus(r.id, r.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
                          title={r.status === "ACTIVE" ? "Deactivate route corridor" : "Activate route corridor"}
                        >
                          {r.status === "ACTIVE" ? t("common.deactivate", "Deactivate") : t("common.activate", "Activate")}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleOpenDelete(r)}
                          title="Delete route corridor"
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
          totalItems={filteredRoutes.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          itemLabel={t("managerRoutes.title", "routes")}
        />
      </div>

      {/* View Route Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingRoute(null); }}
        title={t("managerRoutes.viewTitle", "Route Corridor Details")}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowViewModal(false); setViewingRoute(null); }}
            >
              {t("common.close", "Close")}
            </button>
            {viewingRoute && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  const r = viewingRoute;
                  setShowViewModal(false);
                  setViewingRoute(null);
                  handleOpenEdit(r);
                }}
              >
                <Pencil size={14} /> {t("common.edit", "Edit Route")}
              </button>
            )}
          </div>
        }
      >
        {viewingRoute && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Corridor Name</span>
              <strong style={{ fontSize: "1.1rem", color: "var(--text-main)" }}>{viewingRoute.name}</strong>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Origin Terminal</span>
                <span style={{ fontWeight: 600 }}>{viewingRoute.originStationName || viewingRoute.origin}</span>
              </div>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Destination Terminal</span>
                <span style={{ fontWeight: 600 }}>{viewingRoute.destinationStationName || viewingRoute.destination}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Distance</span>
                <strong style={{ fontSize: "1rem", color: "var(--primary)" }}>{viewingRoute.distanceKm} km</strong>
              </div>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Estimated Duration</span>
                <span style={{ fontWeight: 600 }}>{viewingRoute.estimatedDuration || "—"}</span>
              </div>
            </div>

            <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Operational Status</span>
              <div style={{ marginTop: "0.25rem" }}>
                <Badge status={viewingRoute.status} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Route Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingRoute(null); }}
        title={t("managerRoutes.editTitle", "Edit Route Corridor")}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowEditModal(false); setEditingRoute(null); }}
              disabled={isSubmittingEdit}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpdateRoute}
              disabled={isSubmittingEdit || (editOriginStationId && editOriginStationId === editDestinationStationId)}
            >
              {isSubmittingEdit ? t("common.saving", "Saving...") : t("common.saveChanges", "Save Changes")}
            </button>
          </div>
        }
      >
        <form onSubmit={handleUpdateRoute} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
            <label className="form-label">{t("managerRoutes.originLabel", "Origin Terminal Station")} *</label>
            <select
              className="form-control"
              value={editOriginStationId}
              onChange={(e) => setEditOriginStationId(e.target.value)}
              required
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t("managerRoutes.destLabel", "Destination Terminal Station")} *</label>
            <select
              className="form-control"
              value={editDestinationStationId}
              onChange={(e) => setEditDestinationStationId(e.target.value)}
              required
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>

          <div className="form-divider" />

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t("managerRoutes.distanceLabel", "Estimated Distance (km)")} *</label>
              <input
                type="number"
                className="form-control"
                value={editDistanceKm}
                onChange={(e) => setEditDistanceKm(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("common.duration", "Estimated Duration")} *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 5h 30m"
                value={editEstimatedDuration}
                onChange={(e) => setEditEstimatedDuration(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t("managerBuses.tableStatus", "Operational Status")}</label>
            <div style={{ padding: "0.25rem 0" }}>
              <Badge status={editStatus} />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Route Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletingRoute(null); }}
        title={t("managerRoutes.deleteTitle", "Confirm Route Deletion")}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowDeleteModal(false); setDeletingRoute(null); }}
              disabled={isSubmittingDelete}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleConfirmDelete}
              disabled={isSubmittingDelete}
            >
              {isSubmittingDelete ? t("common.deleting", "Deleting...") : t("common.delete", "Delete Route")}
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
                Are you sure you want to delete route corridor <strong>{deletingRoute?.name}</strong>?
              </p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                This route will be permanently removed. Routes with active scheduled trips cannot be deleted until those trips are completed or cancelled.
              </p>
            </div>
          </div>

          {deletingRoute && (
            <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)", fontSize: "0.85rem" }}>
              <div><strong>Distance:</strong> {deletingRoute.distanceKm} km</div>
              <div><strong>Est. Duration:</strong> {deletingRoute.estimatedDuration}</div>
              <div><strong>Status:</strong> {deletingRoute.status}</div>
            </div>
          )}
        </div>
      </Modal>

      {/* Add Route Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t("managerRoutes.modalTitle", "Create Permitted Operating Route")}
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
              onClick={handleAddRoute}
              disabled={isSubmitting || originStationId === destinationStationId}
            >
              {isSubmitting ? t("managerRoutes.saving", "Creating...") : t("managerRoutes.saveBtn", "Save Route")}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddRoute} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
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

          <div className="form-group">
            <label className="form-label">
              {t("managerRoutes.originLabel", "Origin Terminal Station")} *
            </label>
            <select
              className="form-control"
              value={originStationId}
              onChange={(e) => setOriginStationId(e.target.value)}
              required
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("managerRoutes.destLabel", "Destination Terminal Station")} *
            </label>
            <select
              className="form-control"
              value={destinationStationId}
              onChange={(e) => setDestinationStationId(e.target.value)}
              required
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>

          <div className="form-divider" />

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                {t("managerRoutes.distanceLabel", "Estimated Distance (km)")} *
              </label>
              <input
                type="number"
                className="form-control"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("common.duration", "Estimated Duration")} *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 5h 30m"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManagerRoutesPage;
