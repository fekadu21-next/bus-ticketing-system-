import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Route as RouteIcon, Plus, Search } from "lucide-react";

export const ManagerRoutesPage = () => {
  const { routes, stations, addRoute } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [originStationId, setOriginStationId] = useState(stations[0]?.id || "");
  const [destinationStationId, setDestinationStationId] = useState(stations[1]?.id || "");
  const [distanceKm, setDistanceKm] = useState(400);
  const [estimatedDuration, setEstimatedDuration] = useState("6h 00m");

  const filteredRoutes = routes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddRoute = (e) => {
    e.preventDefault();
    if (originStationId === destinationStationId) {
      alert("Origin and Destination stations must be different.");
      return;
    }
    addRoute({
      originStationId,
      destinationStationId,
      distanceKm: Number(distanceKm),
      estimatedDuration
    });
    setShowAddModal(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Company Reusable Routes</h1>
          <p>Configure route corridors connecting physical stations for your company departures.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Create Reusable Route
        </button>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div className="header-search" style={{ width: "260px" }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              placeholder="Search routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

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
      </div>

      {/* Add Route Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Reusable Route"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddRoute}>Save Route</button>
          </>
        }
      >
        <form onSubmit={handleAddRoute}>
          <div className="form-group">
            <label>Origin Terminal Station</label>
            <select
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
            <label>Destination Terminal Station</label>
            <select
              value={destinationStationId}
              onChange={(e) => setDestinationStationId(e.target.value)}
              required
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Distance (KM)</label>
              <input
                type="number"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Estimated Duration</label>
              <input
                type="text"
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
