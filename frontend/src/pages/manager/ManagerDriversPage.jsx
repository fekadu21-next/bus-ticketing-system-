import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+251911000000");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Driver@123456");
  const [licenseNumber, setLicenseNumber] = useState("");

  const resetForm = () => {
    setName("");
    setPhone("+251911000000");
    setEmail("");
    setPassword("Driver@123456");
    setLicenseNumber("");
  };

  const orgDrivers = drivers.filter((d) => d.organizationId === selectedOrgId);
  const filteredDrivers = orgDrivers.filter((d) => {
    const matchesStatus = filterStatus === "ALL" || d.status === filterStatus;
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.phone && d.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.licenseNumber && d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredDrivers.length / pageSize) || 1;
  const paginatedDrivers = filteredDrivers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleAddDriver = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const driverEmail = email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, ".")}@operator.et`;
      const driverPassword = password.trim() || "Driver@123456";

      console.log('Submitting driver data:', {
        name: name.trim(),
        phone: phone.trim(),
        email: driverEmail,
        password: driverPassword,
      });

      await addDriver({
        name: name.trim(),
        phone: phone.trim(),
        email: driverEmail,
        password: driverPassword,
      });
      resetForm();
      setShowAddModal(false);
    } catch (err) {
      console.error('Driver submission error:', err);
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
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "800px" }}>
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Trips Completed</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDrivers.map((d) => {
                const isActive = d.status === "ACTIVE";
                return (
                  <tr key={d.id}>
                    <td>
                      <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <UserCheck size={14} color="var(--primary)" /> {d.name}
                      </strong>
                    </td>
                    <td>{d.phone || "—"}</td>
                    <td><code>{d.email || "—"}</code></td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{d.totalTripsCompleted || 0} trips</span>
                    </td>
                    <td><Badge status={d.status} /></td>
                    <td>
                      <button
                        className={`btn btn-sm ${isActive ? "btn-secondary" : "btn-success"}`}
                        onClick={() => toggleStaffStatus(d.id, !isActive)}
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
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredDrivers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          itemLabel="drivers"
        />
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
              Full Driver Name *
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
              Phone Contact *
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
              Email Address (for login)
            </label>
            <input
              type="email"
              placeholder="e.g. a.tilahun@operator.et"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Auto-generated if empty: name@operator.et
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>
              Password (for first login)
            </label>
            <input
              type="password"
              placeholder="Default: Driver@123456"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Default password: Driver@123456 (can be changed after first login)
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManagerDriversPage;
