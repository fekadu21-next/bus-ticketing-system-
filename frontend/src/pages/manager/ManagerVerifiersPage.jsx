import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { QrCode, Plus, Search, ShieldCheck, RefreshCw } from "lucide-react";

export const ManagerVerifiersPage = () => {
  const {
    verifiers,
    stations,
    selectedOrgId,
    addVerifier,
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
  const [email, setEmail] = useState("");
  const [assignedStation, setAssignedStation] = useState(stations[0]?.name || "Addis Ababa Autobus Terra");

  const orgVerifiers = verifiers.filter((v) => v.organizationId === selectedOrgId);
  const filteredVerifiers = orgVerifiers.filter((v) => {
    const matchesStatus = filterStatus === "ALL" || v.status === filterStatus;
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.email && v.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.assignedStation && v.assignedStation.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleAddVerifier = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await addVerifier({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, ".")}@operator.et`,
        assignedStation,
        organizationId: selectedOrgId
      });
      setName("");
      setPhone("+251911000000");
      setEmail("");
      setShowAddModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Ticket Verifiers Account Management</h1>
          <p>Provision verifier accounts for internal terminal staff tasked with scanning passenger QR digital tickets.</p>
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
            <Plus size={16} /> Create Verifier Staff Account
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
                placeholder="Search verifier name or email..."
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
            Total Ticket Verifiers: <strong>{orgVerifiers.length}</strong>
          </div>
        </div>

        {filteredVerifiers.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <QrCode size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>No ticket verifier accounts matching your filter.</div>
            {orgVerifiers.length === 0 && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={14} /> Create First Verifier Account
              </button>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Verifier Name</th>
                <th>Phone Contact</th>
                <th>Login Email</th>
                <th>Terminal Station</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVerifiers.map((v) => {
                const isActive = v.status === "ACTIVE";
                return (
                  <tr key={v.id}>
                    <td>
                      <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <QrCode size={14} color="var(--primary)" /> {v.name}
                      </strong>
                    </td>
                    <td>{v.phone || "—"}</td>
                    <td><code>{v.email}</code></td>
                    <td>{v.assignedStation || "Addis Ababa Central Terminal"}</td>
                    <td><Badge status={v.status} /></td>
                    <td>
                      <button
                        className={`btn btn-sm ${isActive ? "btn-secondary" : "btn-success"}`}
                        onClick={() => toggleStaffStatus(v.id, isActive)}
                        title={isActive ? "Deactivate verifier" : "Activate verifier"}
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

      {/* Add Verifier Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Ticket Verifier Staff Account"
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
              onClick={handleAddVerifier}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddVerifier} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>
              Full Staff Name
            </label>
            <input
              type="text"
              placeholder="e.g. Bethlehem Yohannes"
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

          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>
              Corporate Login Email
            </label>
            <input
              type="email"
              placeholder="e.g. b.yohannes@selambus.et"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>
              Assigned Terminal Station
            </label>
            <select
              value={assignedStation}
              onChange={(e) => setAssignedStation(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
            >
              {stations.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManagerVerifiersPage;
