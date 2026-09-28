import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Route as RouteIcon, Plus, Search, RefreshCw, AlertCircle } from "lucide-react";

export const ManagerRoutesPage = () => {
  const {
    routes,
    stations,
    selectedOrgId,
    addRoute,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [originStationId, setOriginStationId] = useState(stations[0]?.id || "");
  const [destinationStationId, setDestinationStationId] = useState(stations[1]?.id || "");
  const [distanceKm, setDistanceKm] = useState(400);
  const [estimatedDuration, setEstimatedDuration] = useState("6h 00m");

  const orgRoutes = routes.filter((r) => r.organizationId === selectedOrgId);
  const filteredRoutes = orgRoutes.filter((r) => {
    const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;
    const matchesSearch =
      (r.name && r.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.originStationName && r.originStationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.destinationStationName && r.destinationStationName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

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
      await addRoute({
        originStationId,
        destinationStationId,
        distanceKm: Number(distanceKm),
        estimatedDuration
      });
      setFormError("");
      setShowAddModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to register route.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Company Reusable Routes</h1>
          <p>Configure and manage intercity route corridors connecting stations for your departures.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchCoordinatorData(selectedOrgId)}
            disabled={isLoadingData}
          >
            <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => { setFormError(""); setShowAddModal(true); }}>
            <Plus size={16} /> Create Reusable Route
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
                placeholder="Search routes by city or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Total Organization Corridors: <strong>{orgRoutes.length}</strong>
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
                onClick={() => { setFormError(""); setShowAddModal(true); }}
              >
                <Plus size={14} /> Create First Route
              </button>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Route Name</th>
                <th>Origin Terminal</th>
                <th>Destination Terminal</th>
                <th>Distance (KM)</th>
                <th>Est. Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.map((r) => (
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
                  <td><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Route Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Reusable Route"
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowAddModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddRoute}
              disabled={isSubmitting || originStationId === destinationStationId}
            >
              {isSubmitting ? "Creating..." : "Save Route"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddRoute} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {formError && (
            <div style={{
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "0.375rem",
              color: "#ef4444",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>
              Origin Terminal Station
            </label>
            <select
              value={originStationId}
              onChange={(e) => setOriginStationId(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>
              Destination Terminal Station
            </label>
            <select
              value={destinationStationId}
              onChange={(e) => setDestinationStationId(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>
                Distance (KM)
              </label>
              <input
                type="number"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                required
                style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>
                Estimated Duration
              </label>
              <input
                type="text"
                placeholder="e.g. 5h 30m"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                required
                style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManagerRoutesPage;
