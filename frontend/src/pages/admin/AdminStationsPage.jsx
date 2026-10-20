import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { MapPin, Plus, Search, Edit2, RefreshCw, Trash2, Power } from "lucide-react";

export const AdminStationsPage = () => {
  const {
    stations,
    addStation,
    updateStation,
    deleteStation,
    toggleStationStatus,
    fetchAdminData,
    isLoadingData,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Add Station Form State
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Edit Station Form State
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editLatitude, setEditLatitude] = useState("");
  const [editLongitude, setEditLongitude] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const filteredStations = stations.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(q) ||
      (s.city || "").toLowerCase().includes(q) ||
      (s.code || "").toLowerCase().includes(q) ||
      (s.address || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredStations.length / pageSize) || 1;
  const paginatedStations = filteredStations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreateStation = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim() || !city.trim()) {
      setErrorMessage("Station name and city are required.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const generatedCode =
        code.trim() ||
        `${city.trim().substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      await addStation({
        name: name.trim(),
        city: city.trim(),
        code: generatedCode,
        address: address.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        isActive: true,
      });

      setName("");
      setCity("");
      setCode("");
      setAddress("");
      setLatitude("");
      setLongitude("");
      setShowAddModal(false);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || "Failed to create station.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStation = async (e) => {
    if (e) e.preventDefault();
    if (!editingStation) return;
    if (!editName.trim() || !editCity.trim()) {
      setErrorMessage("Station name and city are required.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      await updateStation(editingStation.id, {
        name: editName.trim(),
        city: editCity.trim(),
        code: editCode.trim() || editingStation.code,
        address: editAddress.trim() || null,
        latitude: editLatitude ? parseFloat(editLatitude) : null,
        longitude: editLongitude ? parseFloat(editLongitude) : null,
        isActive: editIsActive,
      });

      setShowEditModal(false);
      setEditingStation(null);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || "Failed to update station.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStation = async (station) => {
    const routeCount = (station._count?.origin_routes || 0) + (station._count?.destination_routes || 0);
    if (routeCount > 0) {
      alert(`Cannot delete "${station.name}": It is currently referenced by ${routeCount} active route(s). Please deactivate the station instead or remove the assigned routes.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete station "${station.name}" (${station.city})?`)) {
      return;
    }

    try {
      await deleteStation(station.id);
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Failed to delete station.");
    }
  };

  const handleToggleStatus = async (station) => {
    try {
      await toggleStationStatus(station);
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Failed to toggle station status.");
    }
  };

  const openEditModal = (station) => {
    setErrorMessage("");
    setEditingStation(station);
    setEditName(station.name || "");
    setEditCity(station.city || "");
    setEditCode(station.code || "");
    setEditAddress(station.address || "");
    setEditLatitude(station.latitude !== null && station.latitude !== undefined ? station.latitude.toString() : "");
    setEditLongitude(station.longitude !== null && station.longitude !== undefined ? station.longitude.toString() : "");
    setEditIsActive(station.is_active ?? true);
    setShowEditModal(true);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Stations & Physical Locations Registry</h1>
          <p>Maintain centralized bus terminal records utilized by transport routes across Ethiopia.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={fetchAdminData}
            title="Refresh Stations"
            disabled={isLoadingData}
          >
            <RefreshCw size={14} className={isLoadingData ? "spin" : ""} /> Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setErrorMessage("");
              setShowAddModal(true);
            }}
          >
            <Plus size={16} /> Add New Station
          </button>
        </div>
      </div>

      <div className="card-table-wrapper" style={{ overflowX: "auto" }}>
        <div className="card-header-toolbar" style={{ minWidth: "100%" }}>
          <div className="header-search" style={{ width: "280px" }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              placeholder="Search station by name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing <strong>{filteredStations.length}</strong> of <strong>{stations.length}</strong> stations
          </div>
        </div>

        <table className="data-table" style={{ minWidth: "850px" }}>
          <thead>
            <tr>
              <th>Station Name</th>
              <th>City / Location</th>
              <th>Terminal Code</th>
              <th>Address / Details</th>
              <th>Active Routes</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingData && stations.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem" }}>
                  <LoadingSpinner label="Loading stations directory..." />
                </td>
              </tr>
            ) : filteredStations.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                  {stations.length === 0
                    ? "No stations found in the database. Click 'Add New Station' to create one."
                    : "No bus stations found matching your search."}
                </td>
              </tr>
            ) : (
              paginatedStations.map((s) => {
                const totalRoutes = (s._count?.origin_routes || 0) + (s._count?.destination_routes || 0);
                const isActive = s.is_active ?? true;
                return (
                  <tr key={s.id}>
                    <td>
                      <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <MapPin size={14} color="var(--primary)" /> {s.name}
                      </strong>
                    </td>
                    <td>{s.city}</td>
                    <td><code>{s.code}</code></td>
                    <td>{s.address || "—"}</td>
                    <td>
                      <span style={{ fontWeight: 700 }}>
                        {totalRoutes} routes
                      </span>
                    </td>
                    <td><Badge status={isActive ? "ACTIVE" : "INACTIVE"} /></td>
                    <td>{s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(s)}
                          title="Edit station"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          className={`btn btn-sm ${isActive ? "btn-secondary" : "btn-success"}`}
                          onClick={() => handleToggleStatus(s)}
                          title={isActive ? "Deactivate station" : "Activate station"}
                        >
                          <Power size={13} /> {isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteStation(s)}
                          title="Delete station"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredStations.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="stations"
        />
      </div>

      {/* Add Station Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Physical Station"
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateStation} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Save Station"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateStation}>
          {errorMessage && (
            <div style={{ color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.6rem 0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.85rem" }}>
              {errorMessage}
            </div>
          )}
          <div className="form-group">
            <label>Station Name *</label>
            <input
              type="text"
              placeholder="e.g. Hawassa Intercity Bus Terminal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City / Location *</label>
              <input
                type="text"
                placeholder="e.g. Hawassa"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Station Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. HWA-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Full Address Details</label>
            <textarea
              rows={2}
              placeholder="e.g. Piassa Area near Main Market"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Latitude (Optional)</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 7.0586"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Longitude (Optional)</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 38.4757"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Station Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Station"
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={isSubmitting}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleUpdateStation} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Station"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleUpdateStation}>
          {errorMessage && (
            <div style={{ color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.6rem 0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.85rem" }}>
              {errorMessage}
            </div>
          )}
          <div className="form-group">
            <label>Station Name *</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City / Location *</label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Station Code *</label>
              <input
                type="text"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Full Address Details</label>
            <textarea
              rows={2}
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Latitude (Optional)</label>
              <input
                type="number"
                step="any"
                value={editLatitude}
                onChange={(e) => setEditLatitude(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Longitude (Optional)</label>
              <input
                type="number"
                step="any"
                value={editLongitude}
                onChange={(e) => setEditLongitude(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: "0.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
              />
              <span>Station is operational & active</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminStationsPage;
