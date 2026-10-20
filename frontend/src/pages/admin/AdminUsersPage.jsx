import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Search, Shield, RefreshCw, Eye, CheckCircle2, AlertTriangle, Building2, User, KeyRound, Clock } from "lucide-react";

export const AdminUsersPage = () => {
  const { users = [], organizations = [], toggleUserStatus, isLoadingData, fetchAdminData } = useApp();
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterRole, filterOrg, searchQuery]);

  const filteredUsers = users.filter((u) => {
    const roleUpper = (u.role || "").toUpperCase();
    const matchesRole =
      filterRole === "ALL" ||
      roleUpper === filterRole ||
      (filterRole === "ADMIN" && roleUpper.includes("ADMIN")) ||
      (filterRole === "COORDINATOR" && (roleUpper.includes("COORDINATOR") || roleUpper.includes("MANAGER"))) ||
      (filterRole === "PASSENGER" && roleUpper.includes("PASSENGER")) ||
      (filterRole === "DRIVER" && roleUpper.includes("DRIVER")) ||
      (filterRole === "VERIFIER" && roleUpper.includes("VERIFIER"));

    const matchesOrg =
      filterOrg === "ALL" ||
      (filterOrg === "SYSTEM" && (!u.organizationId || u.organizationId === "" || u.organizationName === "—")) ||
      u.organizationId === filterOrg ||
      (organizations.find((o) => o.id === filterOrg)?.name &&
        u.organizationName?.toLowerCase() === organizations.find((o) => o.id === filterOrg)?.name?.toLowerCase());

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.id || "").toLowerCase().includes(q) ||
      (u.organizationName || "").toLowerCase().includes(q) ||
      (u.phone || "").includes(q);

    return matchesRole && matchesOrg && matchesSearch;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Users & Roles Governance</h1>
          <p>Supervise platform user accounts, authentication credentials, assigned organizations, and security parameters.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchAdminData && fetchAdminData()}
          title="Refresh Users"
        >
          <RefreshCw size={14} className={isLoadingData ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <div className="header-search" style={{ width: "240px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search name, email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter by Organization */}
            <select
              className="org-selector-select"
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
              title="Filter users by assigned operator"
            >
              <option value="ALL">🏢 All Organizations</option>
              <option value="SYSTEM">🌐 Platform / Independent (No Org)</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>

            {/* Filter by Role */}
            <select
              className="org-selector-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              title="Filter by assigned system role"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Platform Admin</option>
              <option value="COORDINATOR">Booking Coordinator</option>
              <option value="DRIVER">Driver</option>
              <option value="VERIFIER">Ticket Verifier</option>
              <option value="PASSENGER">Passenger</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> accounts
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: "1050px" }}>
            <thead>
              <tr>
                <th>User Identity & ID</th>
                <th>Contact & Verification</th>
                <th>System Role</th>
                <th>Assigned Organization</th>
                <th>Account Status</th>
                <th>Security / Login</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData && users.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem" }}>
                    <LoadingSpinner label="Loading platform users..." />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No users found matching the selected organization, role, or search filter.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                        ID: {u.id?.length > 18 ? `${u.id.substring(0, 18)}...` : u.id}
                      </div>
                    </td>
                    <td>
                      <div>{u.email}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "2px" }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{u.phone}</span>
                        {u.emailVerified ? (
                          <span style={{ fontSize: "0.68rem", color: "#10b981", display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: 600 }}>
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.68rem", color: "#f59e0b", display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: 600 }}>
                            <AlertTriangle size={11} /> Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          fontWeight: 600,
                          fontSize: "0.78rem",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: u.role === "ADMIN" ? "rgba(239, 68, 68, 0.1)" : "rgba(37, 99, 235, 0.08)",
                          color: u.role === "ADMIN" ? "#dc2626" : "var(--primary)",
                        }}
                      >
                        <Shield size={13} /> {u.role}
                      </span>
                    </td>
                    <td>
                      {u.organizationName && u.organizationName !== "—" ? (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                          <Building2 size={13} color="var(--primary)" />
                          <span>{u.organizationName}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Platform System</span>
                      )}
                    </td>
                    <td>
                      <Badge status={u.status} />
                    </td>
                    <td>
                      <div style={{ fontSize: "0.74rem" }}>
                        Last login: <strong>{u.lastLoginAt || "Never"}</strong>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: (u.failedLoginAttempts || 0) > 0 ? "var(--danger)" : "var(--text-muted)" }}>
                        Failed attempts: <strong>{u.failedLoginAttempts || 0}</strong>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.78rem" }}>{u.createdAt}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedUserModal(u)}
                          title="View complete sensitive profile and credentials details"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          className={`btn btn-sm ${u.status === "ACTIVE" ? "btn-secondary" : "btn-success"}`}
                          onClick={() => toggleUserStatus(u.id)}
                          title={u.status === "ACTIVE" ? "Suspend user account" : "Re-activate user account"}
                        >
                          {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="users"
        />
      </div>

      {/* Sensitive Profile Details Modal */}
      <Modal
        isOpen={Boolean(selectedUserModal)}
        onClose={() => setSelectedUserModal(null)}
        title={`User Security & Profile Details: ${selectedUserModal?.name}`}
        footer={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" onClick={() => setSelectedUserModal(null)}>
              Close
            </button>
            <button
              className={`btn ${selectedUserModal?.status === "ACTIVE" ? "btn-danger" : "btn-success"}`}
              onClick={() => {
                if (selectedUserModal?.id) {
                  toggleUserStatus(selectedUserModal.id);
                  setSelectedUserModal(null);
                }
              }}
            >
              {selectedUserModal?.status === "ACTIVE" ? "Suspend Account" : "Activate Account"}
            </button>
          </div>
        }
      >
        {selectedUserModal && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>{selectedUserModal.name}</h2>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                  UUID: {selectedUserModal.id}
                </span>
              </div>
              <Badge status={selectedUserModal.status} />
            </div>

            <div className="form-row" style={{ marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Email & Verification</span>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", marginTop: "2px" }}>{selectedUserModal.email}</div>
                <div style={{ marginTop: "4px" }}>
                  {selectedUserModal.emailVerified ? (
                    <span style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <CheckCircle2 size={12} /> Email Verified
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <AlertTriangle size={12} /> Email Unverified
                    </span>
                  )}
                </div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Phone Number</span>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", marginTop: "2px" }}>{selectedUserModal.phone || "—"}</div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Official contact on record</span>
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Role & Governance Scope</span>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", marginTop: "2px" }}>{selectedUserModal.role}</div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>System permission level</span>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Affiliated Organization</span>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", marginTop: "2px" }}>{selectedUserModal.organizationName || "System / Independent"}</div>
                {selectedUserModal.organizationId && (
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    Org ID: {selectedUserModal.organizationId}
                  </span>
                )}
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Failed Login Attempts</span>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: (selectedUserModal.failedLoginAttempts || 0) > 0 ? "var(--danger)" : "var(--text-main)", marginTop: "2px" }}>
                  {selectedUserModal.failedLoginAttempts || 0} attempts
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Threshold: 5 attempts before lock</span>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Last Login & Created</span>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", marginTop: "2px" }}>{selectedUserModal.lastLoginAt || "Never"}</div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Registered: {selectedUserModal.createdAt}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
