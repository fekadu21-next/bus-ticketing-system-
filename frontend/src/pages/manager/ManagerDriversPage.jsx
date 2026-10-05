import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { UserCheck, Plus, Search, Award, RefreshCw, UserX } from "lucide-react";

export const ManagerDriversPage = () => {
  const {
    drivers,
    selectedOrgId,
    addDriver,
    toggleStaffStatus,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+251911000000");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCategory, setLicenseCategory] = useState("Heavy Commercial (Grade 4)");
  const [licenseExpiry, setLicenseExpiry] = useState("2028-12-31");

  const orgDrivers = drivers.filter((d) => d.organizationId === selectedOrgId);
  const filteredDrivers = orgDrivers.filter((d) => {
    const matchesStatus = filterStatus === "ALL" || d.status === filterStatus;
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.phone && d.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.licenseNumber && d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleAddDriver = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await addDriver({
        name: name.trim(),
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim() || `DL-${Date.now().toString().slice(-6)}`,
        licenseCategory,
        licenseExpiry,
        organizationId: selectedOrgId
      });
      setName("");
      setPhone("+251911000000");
      setLicenseNumber("");
      setShowAddModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Company Drivers Staff Management</h1>
          <p>Register eligible drivers, manage commercial license compliance, and toggle operational status.</p>
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
            <Plus size={16} /> Register New Driver
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
                placeholder="Search driver name or phone..."
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
            Total Registered Drivers: <strong>{orgDrivers.length}</strong>
          </div>
        </div>

        {filteredDrivers.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <UserCheck size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>No driver accounts matching your filter.</div>
            {orgDrivers.length === 0 && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={14} /> Register First Driver
              </button>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>Phone Number</th>
                <th>Commercial License #</th>
                <th>Category</th>
                <th>Trips Completed</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((d) => {
                const isActive = d.status === "ACTIVE";
                return (
                  <tr key={d.id}>
                    <td>
                      <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <UserCheck size={14} color="var(--primary)" /> {d.name}
                      </strong>
                    </td>
                    <td>{d.phone || "—"}</td>
                    <td><code>{d.licenseNumber || `DL-${d.id.slice(0, 6)}`}</code></td>
                    <td>{d.licenseCategory || "Heavy Commercial"}</td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{d.totalTripsCompleted || 0} trips</span>
                    </td>
                    <td><Badge status={d.status} /></td>
                    <td>
                      <button
                        className={`btn btn-sm ${isActive ? "btn-secondary" : "btn-success"}`}
                        onClick={() => toggleStaffStatus(d.id, isActive)}
                        title={isActive ? "Deactivate driver" : "Activate driver"}
                      >
                        {isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Driver Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Driver Account"
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
              onClick={handleAddDriver}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Creating..." : "Create Driver Account"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddDriver} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>
              Full Driver Name
            </label>
            <input
              type="text"
              placeholder="e.g. Alemayehu Tilahun"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>
              Phone Contact
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>
                Commercial License Number
              </label>
              <input
                type="text"
                placeholder="e.g. DL-ETH-88210-CAT-4"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>
                License Expiry Date
              </label>
              <input
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>
              License Grade / Category
            </label>
            <input
              type="text"
              value={licenseCategory}
              onChange={(e) => setLicenseCategory(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManagerDriversPage;
