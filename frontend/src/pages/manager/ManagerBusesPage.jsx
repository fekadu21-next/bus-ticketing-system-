import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Bus, Plus, Search, AlertCircle } from "lucide-react";

export const ManagerBusesPage = () => {
  const { buses, selectedOrgId, addBus, updateBusStatus } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [busNumber, setBusNumber] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [capacity, setCapacity] = useState(45);
  const [model, setModel] = useState("");
  const [manufactureYear, setManufactureYear] = useState("2023");

  const orgBuses = buses.filter((b) => b.organizationId === selectedOrgId);
  const filteredBuses = orgBuses.filter(
    (b) =>
      b.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddBus = (e) => {
    e.preventDefault();
    if (!busNumber || !plateNumber || capacity <= 0) return;
    addBus({
      busNumber,
      plateNumber,
      capacity: Number(capacity),
      model: model || "Standard Coach",
      manufactureYear,
      organizationId: selectedOrgId
    });
    setBusNumber("");
    setPlateNumber("");
    setCapacity(45);
    setModel("");
    setShowAddModal(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Fleet & Buses</h1>
          <p>Manage vehicle inventory and operational statuses.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Register New Bus
        </button>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div className="header-search" style={{ width: "260px" }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              placeholder="Search bus # or plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Total Company Buses: <strong>{orgBuses.length}</strong>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Bus Code</th>
              <th>Plate Number</th>
              <th>Vehicle Model</th>
              <th>Passenger Capacity</th>
              <th>Year</th>
              <th>Status</th>
              <th>Last Maintenance</th>
              <th>Status Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBuses.map((b) => (
              <tr key={b.id}>
                <td>
                  <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Bus size={14} color="var(--primary)" /> {b.busNumber}
                  </strong>
                </td>
                <td><code>{b.plateNumber}</code></td>
                <td>{b.model}</td>
                <td><span style={{ fontWeight: 700 }}>{b.capacity} Seats</span></td>
                <td>{b.manufactureYear}</td>
                <td><Badge status={b.status} /></td>
                <td>{b.lastMaintenance}</td>
                <td>
                  <select
                    className="org-selector-select"
                    value={b.status}
                    onChange={(e) => updateBusStatus(b.id, e.target.value)}
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Bus Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Fleet Vehicle"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddBus}>Save Vehicle</button>
          </>
        }
      >
        <form onSubmit={handleAddBus}>
          <div className="form-row">
            <div className="form-group">
              <label>Bus Number / Operational Code</label>
              <input
                type="text"
                placeholder="e.g. SLM-104"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Plate Number</label>
              <input
                type="text"
                placeholder="e.g. ET-3-55109"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Passenger Seat Capacity</label>
              <input
                type="number"
                min="10"
                max="80"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Manufacture Year</label>
              <input
                type="text"
                value={manufactureYear}
                onChange={(e) => setManufactureYear(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Bus Make & Model Specification</label>
            <input
              type="text"
              placeholder="e.g. Yutong ZK6129 Luxury Coach"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
