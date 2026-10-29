import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  Search,
  Shield,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  KeyRound,
  Clock,
  Power,
} from "lucide-react";

export const AdminUsersPage = () => {
  const {
    users = [],
    organizations = [],
    updateUserStatus,
    toggleUserStatus,
    isLoadingData,
    fetchAdminData,
    showToast,
  } = useApp();

  const [filterRole, setFilterRole] = useState("ALL");
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterRole, filterOrg, searchQuery]);

  // Deduplicate users by email to prevent duplicate accounts in the Users & Roles section
  const uniqueUsers = useMemo(() => {
    const seen = new Set();
    return users.filter((u) => {
      const emailKey = (u.email || "").toLowerCase().trim();
      if (!emailKey) return true;
      if (seen.has(emailKey)) return false;
      seen.add(emailKey);
      return true;
    });
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return uniqueUsers.filter((u) => {
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

      const matchesSearch =
        !q ||
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.id || "").toLowerCase().includes(q) ||
        (u.organizationName || "").toLowerCase().includes(q) ||
        (u.phone || "").includes(q);

      return matchesRole && matchesOrg && matchesSearch;
    });
  }, [uniqueUsers, organizations, filterRole, filterOrg, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handleManualRefresh = async () => {
    if (!fetchAdminData) return;
    try {
      setIsRefreshing(true);
      await fetchAdminData();
      if (showToast) showToast("Users directory refreshed successfully.");
    } catch {
      if (showToast) showToast("Failed to refresh users.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = (userId, newStatus) => {
    if (updateUserStatus) {
      updateUserStatus(userId, newStatus);
    } else if (toggleUserStatus) {
      toggleUserStatus(userId);
    }
    if (selectedUserModal && selectedUserModal.id === userId) {
      setSelectedUserModal((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Users & Roles Governance</h1>
          <p>Supervise platform user accounts, authentication credentials, assigned organizations, and security parameters.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleManualRefresh}
          disabled={isRefreshing || isLoadingData}
          title="Refresh Users"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          <RefreshCw size={14} className={isRefreshing || isLoadingData ? "spin animate-spin" : ""} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
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
                paginatedUsers.map((u) => {
                  const currentStatus = u.status || "ACTIVE";
                  const isActive = currentStatus === "ACTIVE";
                  return (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.name && u.name !== u.email ? u.name : (u.email ? u.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Platform User')}</strong>
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
                        <Badge status={currentStatus} />
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
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedUserModal(u)}
                            title="View complete sensitive profile and credentials details"
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${isActive ? "btn-secondary" : "btn-success"}`}
                            onClick={() => handleStatusChange(u.id, isActive ? "SUSPENDED" : "ACTIVE")}
                            title={isActive ? "Suspend user account" : "Re-activate user account"}
                          >
                            {isActive ? "Suspend" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
        title={`User Security & Profile Details: ${selectedUserModal?.name || ""}`}
        footer={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" onClick={() => setSelectedUserModal(null)}>
              Close
            </button>
            <button
              className={`btn ${selectedUserModal?.status === "ACTIVE" ? "btn-danger" : "btn-success"}`}
              onClick={() => {
                if (selectedUserModal?.id) {
                  const nextStatus = selectedUserModal.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
                  handleStatusChange(selectedUserModal.id, nextStatus);
                  setSelectedUserModal((prev) => (prev ? { ...prev, status: nextStatus } : null));
                }
              }}
            >
              {selectedUserModal?.status === "ACTIVE" ? "Suspend Account" : "Activate Account"}
            </button>
          </div>
        }
      >
        {selectedUserModal && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--primary-bg, #eff6ff)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.1rem" }}>
                  {selectedUserModal.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{selectedUserModal.name && selectedUserModal.name !== selectedUserModal.email ? selectedUserModal.name : (selectedUserModal.email ? selectedUserModal.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Platform User')}</h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{selectedUserModal.email}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Status:</span>
                <Badge status={selectedUserModal.status || "ACTIVE"} />
              </div>
            </div>

            <div className="form-row">
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Assigned Role</span>
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "2px" }}>
                  <Shield size={14} color="var(--primary)" /> {selectedUserModal.role}
                </div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Organization Scope</span>
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "2px" }}>
                  <Building2 size={14} color="var(--primary)" /> {selectedUserModal.organizationName || "Platform System"}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Contact Phone</span>
                <div style={{ fontWeight: 600, marginTop: "2px" }}>{selectedUserModal.phone || "—"}</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Email Verification</span>
                <div style={{ fontWeight: 600, marginTop: "2px", color: selectedUserModal.emailVerified ? "#10b981" : "#f59e0b" }}>
                  {selectedUserModal.emailVerified ? "Verified Identity" : "Pending Verification"}
                </div>
              </div>
            </div>

            <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Authentication & Security Audit</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.4rem", fontSize: "0.8rem" }}>
                <div>Last Recorded Login: <strong>{selectedUserModal.lastLoginAt || "Never"}</strong></div>
                <div>Failed Login Attempts: <strong style={{ color: selectedUserModal.failedLoginAttempts > 0 ? "var(--danger)" : "inherit" }}>{selectedUserModal.failedLoginAttempts || 0}</strong></div>
                <div>User ID: <code style={{ fontSize: "0.7rem" }}>{selectedUserModal.id}</code></div>
                <div>Account Created: <strong>{selectedUserModal.createdAt}</strong></div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default AdminUsersPage;
