import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Search, Shield, RefreshCw } from "lucide-react";

export const AdminUsersPage = () => {
  const { users, toggleUserStatus, isLoadingData, fetchAdminData } = useApp();
  const [filterRole, setFilterRole] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.phone || "").includes(q);

    return matchesRole && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Users Overview</h1>
          <p>Supervise platform user accounts and permissions.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchAdminData()}
          title="Refresh Users"
        >
          <RefreshCw size={14} className={isLoadingData ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div className="header-search" style={{ width: "260px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search user name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Platform Admin</option>
              <option value="COORDINATOR">Booking Coordinator</option>
              <option value="PASSENGER">Passenger</option>
              <option value="DRIVER">Driver</option>
              <option value="VERIFIER">Ticket Verifier</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>User Identity</th>
              <th>Email / Contact</th>
              <th>System Role</th>
              <th>Assigned Organization</th>
              <th>Account Status</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingData && users.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "2.5rem" }}>
                  <LoadingSpinner label="Loading platform users..." />
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                  No users found matching the selected criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>ID: {u.id}</div>
                  </td>
                  <td>
                    <div>{u.email}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{u.phone}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontWeight: 600,
                        fontSize: "0.78rem"
                      }}
                    >
                      <Shield size={13} color="var(--primary)" /> {u.role}
                    </span>
                  </td>
                  <td>{u.organizationName || "—"}</td>
                  <td><Badge status={u.status} /></td>
                  <td>{u.createdAt}</td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.status === "ACTIVE" ? "btn-secondary" : "btn-success"}`}
                      onClick={() => toggleUserStatus(u.id)}
                    >
                      {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
