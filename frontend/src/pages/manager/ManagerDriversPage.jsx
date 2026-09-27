import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { UserCheck, Plus, Search, Award } from "lucide-react";

export const ManagerDriversPage = () => {
  const { drivers, selectedOrgId, addDriver } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+251 91 ");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCategory, setLicenseCategory] = useState("Heavy Commercial (Grade 4)");
  const [licenseExpiry, setLicenseExpiry] = useState("2028-12-31");

  const orgDrivers = drivers.filter((d) => d.organizationId === selectedOrgId);
  const filteredDrivers = orgDrivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddDriver = (e) => {
    e.preventDefault();
    if (!name || !licenseNumber) return;
    addDriver({
      name,
      phone,
      licenseNumber,
      licenseCategory,
      licenseExpiry,
      organizationId: selectedOrgId
    });
    setName("");
    setPhone("+251 91 ");
    setLicenseNumber("");
    setShowAddModal(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Company Drivers Staff Management</h1>
          <p>Register eligible drivers, manage commercial license compliance, and view trip assignment history.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Register New Driver
        </button>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div className="header-search" style={{ width: "260px" }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              placeholder="Search driver name or license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Total Registered Drivers: <strong>{orgDrivers.length}</strong>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Driver Name</th>
              <th>Phone Number</th>
              <th>Commercial License #</th>
              <th>Category</th>
              <th>License Expiry</th>
              <th>Trips Completed</th>
              <th>Rating</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.map((d) => (
              <tr key={d.id}>
                <td>
                  <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <UserCheck size={14} color="var(--primary)" /> {d.name}
                  </strong>
                </td>
                <td>{d.phone}</td>
                <td><code>{d.licenseNumber}</code></td>
                <td>{d.licenseCategory}</td>
                <td>{d.licenseExpiry}</td>
                <td><span style={{ fontWeight: 700 }}>{d.totalTripsCompleted} trips</span></td>
                <td>
                  <span style={{ color: "var(--warning-text)", fontWeight: 700 }}>★ {d.rating}</span>
                </td>
                <td><Badge status={d.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Driver Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Driver Account"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddDriver}>Create Driver Account</button>
          </>
        }
      >
        <form onSubmit={handleAddDriver}>
          <div className="form-group">
            <label>Full Driver Name</label>
            <input
              type="text"
              placeholder="e.g. Alemayehu Tilahun"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Contact</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Commercial License Number</label>
              <input
                type="text"
                placeholder="e.g. DL-ETH-88210-CAT-4"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>License Expiry Date</label>
              <input
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>License Grade / Category</label>
            <input
              type="text"
              value={licenseCategory}
              onChange={(e) => setLicenseCategory(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
