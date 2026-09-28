import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { QrCode, Plus, Search, ShieldCheck } from "lucide-react";

export const ManagerVerifiersPage = () => {
  const { verifiers, stations, selectedOrgId, addVerifier } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+251 91 ");
  const [email, setEmail] = useState("");
  const [assignedStation, setAssignedStation] = useState(stations[0]?.name || "Addis Ababa Autobus Terra");

  const orgVerifiers = verifiers.filter((v) => v.organizationId === selectedOrgId);
  const filteredVerifiers = orgVerifiers.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.assignedStation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddVerifier = (e) => {
    e.preventDefault();
    if (!name) return;
    addVerifier({
      name,
      phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@selambus.et`,
      assignedStation,
      organizationId: selectedOrgId
    });
    setName("");
    setPhone("+251 91 ");
    setEmail("");
    setShowAddModal(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Ticket Verifiers Account Management</h1>
          <p>Provision verifier accounts for internal terminal staff tasked with scanning passenger QR digital tickets.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Create Verifier Staff Account
        </button>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div className="header-search" style={{ width: "260px" }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              placeholder="Search verifier staff name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Verifier Name</th>
              <th>Phone Contact</th>
              <th>Login Email</th>
              <th>Assigned Terminal Station</th>
              <th>Scans Conducted Today</th>
              <th>Account Status</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredVerifiers.map((v) => (
              <tr key={v.id}>
                <td>
                  <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <QrCode size={14} color="var(--primary)" /> {v.name}
                  </strong>
                </td>
                <td>{v.phone}</td>
                <td><code>{v.email}</code></td>
                <td>{v.assignedStation}</td>
                <td><span style={{ fontWeight: 700 }}>{v.scansToday} QR scans</span></td>
                <td><Badge status={v.status} /></td>
                <td>{v.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Verifier Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Ticket Verifier Account"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddVerifier}>Create Staff Account</button>
          </>
        }
      >
        <form onSubmit={handleAddVerifier}>
          <div className="form-group">
            <label>Verifier Full Name</label>
            <input
              type="text"
              placeholder="e.g. Hiwot Berhanu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="hiwot@company.et"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Assigned Terminal Station</label>
            <select
              value={assignedStation}
              onChange={(e) => setAssignedStation(e.target.value)}
            >
              {stations.map((s) => (
                <option key={s.id} value={s.name}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
