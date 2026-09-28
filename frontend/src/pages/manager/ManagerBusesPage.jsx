import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Bus, Plus, Search, AlertCircle, RefreshCw } from "lucide-react";

export const ManagerBusesPage = () => {
  const {
    buses,
    selectedOrgId,
    addBus,
    updateBusStatus,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [busNumber, setBusNumber] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [capacity, setCapacity] = useState(45);
  const [model, setModel] = useState("");
  const [manufactureYear, setManufactureYear] = useState("2023");

  const orgBuses = buses.filter((b) => b.organizationId === selectedOrgId);
  const filteredBuses = orgBuses.filter((b) => {
    const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
    const matchesSearch =
      (b.plateNumber && b.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.busNumber && b.busNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.model && b.model.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleAddBus = async (e) => {
    e.preventDefault();
    if (!plateNumber.trim() || capacity <= 0) return;
    setIsSubmitting(true);
    try {
      await addBus({
        busNumber: busNumber.trim() || plateNumber.trim(),
        plateNumber: plateNumber.trim(),
        capacity: Number(capacity),
        model: model.trim() || "Standard Coach",
        manufactureYear,
        organizationId: selectedOrgId
      });
      setBusNumber("");
      setPlateNumber("");
      setCapacity(45);
      setModel("");
      setShowAddModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Fleet & Buses</h1>
          <p>Manage vehicle inventory and operational statuses for your organization fleet.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchCoordinatorData(selectedOrgId)}
            disabled={isLoadingData}
          >
            <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Register New Bus
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
                placeholder="Search bus #, plate, model..."
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
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Total Company Buses: <strong>{orgBuses.length}</strong>
          </div>
        </div>

        {filteredBuses.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <Bus size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>No vehicles matching your filter.</div>
            {orgBuses.length === 0 && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={14} /> Register First Bus
              </button>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Bus Code</th>
                <th>Plate Number</th>
                <th>Vehicle Model</th>
                <th>Passenger Capacity</th>
                <th>Year</th>
                <th>Status</th>
                <th>Last Update</th>
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
        )}
      </div>

      {/* Add Bus Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Fleet Vehicle"
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
              onClick={handleAddBus}
              disabled={isSubmitting || !plateNumber.trim()}
            >
              {isSubmitting ? "Saving..." : "Save Vehicle"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddBus} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-row">
            <div className="form-group">
              <label>Bus Number / Operational Code</label>
              <input
                type="text"
                placeholder="e.g. SLM-104"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
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

export default ManagerBusesPage;
