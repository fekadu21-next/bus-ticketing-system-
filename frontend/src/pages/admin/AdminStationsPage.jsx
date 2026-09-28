import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { MapPin, Plus, Search, Edit2 } from "lucide-react";

export const AdminStationsPage = () => {
  const { stations, addStation, updateStation } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");

  const filteredStations = stations.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateStation = (e) => {
    e.preventDefault();
    if (!name || !city) return;
    addStation({ name, city, code: code || `${city.substring(0, 3).toUpperCase()}-01`, address });
    setName("");
    setCity("");
    setCode("");
    setAddress("");
    setShowAddModal(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Stations & Physical Locations Registry</h1>
          <p>Maintain centralized bus terminal records utilized by transport routes across Ethiopia.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add New Station
        </button>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
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
            Total Stations: <strong>{stations.length}</strong>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Station Name</th>
              <th>City</th>
              <th>Terminal Code</th>
              <th>Address / Location</th>
              <th>Active Routes</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStations.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <MapPin size={14} color="var(--primary)" /> {s.name}
                  </strong>
                </td>
                <td>{s.city}</td>
                <td><code>{s.code}</code></td>
                <td>{s.address}</td>
                <td>
                  <span style={{ fontWeight: 700 }}>{s.activeRoutesCount} routes</span>
                </td>
                <td><Badge status={s.status} /></td>
                <td>{s.createdAt}</td>
                <td>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      updateStation(s.id, {
                        status: s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                      })
                    }
                  >
                    {s.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Station Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Physical Station"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateStation}>Save Station</button>
          </>
        }
      >
        <form onSubmit={handleCreateStation}>
          <div className="form-group">
            <label>Station Name</label>
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
              <label>City / Location</label>
              <input
                type="text"
                placeholder="e.g. Hawassa"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Station Code</label>
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
        </form>
      </Modal>
    </div>
  );
};
