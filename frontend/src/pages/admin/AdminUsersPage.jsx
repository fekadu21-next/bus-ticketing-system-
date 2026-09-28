import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Search, UserCheck, Shield, UserX } from "lucide-react";

export const AdminUsersPage = () => {
  const { users, toggleUserStatus } = useApp();
  const [filterRole, setFilterRole] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter((u) => {
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);
    return matchesRole && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Users Overview</h1>
          <p>Supervise platform user accounts and permissions.</p>
        </div>
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
              <option value="Admin">Admin</option>
              <option value="Manager">Operational Manager</option>
              <option value="Passenger">Passenger</option>
              <option value="Driver">Driver</option>
              <option value="Verifier">Ticket Verifier</option>
            </select>
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
            {filteredUsers.map((u) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
