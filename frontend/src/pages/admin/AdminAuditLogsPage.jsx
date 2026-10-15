import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Search, ShieldCheck, RefreshCw, Building2 } from "lucide-react";

export const AdminAuditLogsPage = () => {
  const { auditLogs = [], organizations = [], isLoadingData, fetchAdminData } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOrg, setFilterOrg] = useState("ALL");

  const filteredLogs = auditLogs.filter((log) => {
    const matchesOrg =
      filterOrg === "ALL" ||
      log.organizationId === filterOrg ||
      (organizations.find((o) => o.id === filterOrg)?.name &&
        log.organizationName?.toLowerCase() === organizations.find((o) => o.id === filterOrg)?.name?.toLowerCase());

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (log.action || "").toLowerCase().includes(q) ||
      (log.actorName || "").toLowerCase().includes(q) ||
      (log.organizationName || "").toLowerCase().includes(q) ||
      (log.entityType || "").toLowerCase().includes(q) ||
      (log.ipAddress || "").toLowerCase().includes(q);

    return matchesOrg && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Audit Trail Logs</h1>
          <p>Immutable event log tracing every administrative mutation, approval, suspension and operational update.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchAdminData && fetchAdminData()}
          title="Refresh Audit Logs"
        >
          <RefreshCw size={14} className={isLoadingData ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <div className="header-search" style={{ width: "260px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search action, actor, organization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter by Organization */}
            <select
              className="org-selector-select"
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
              title="Filter audit trail by organization"
            >
              <option value="ALL">🏢 All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing <strong>{filteredLogs.length}</strong> of <strong>{auditLogs.length}</strong> audit records
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: "1100px" }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor Identity</th>
                <th>Role Scope</th>
                <th>Organization</th>
                <th>Action Code</th>
                <th>Target Entity</th>
                <th>Old State</th>
                <th>New State</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData && auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "2.5rem" }}>
                    <LoadingSpinner label="Loading platform audit trail..." />
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No audit trail records found matching your query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td><span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{log.timestamp}</span></td>
                    <td><strong>{log.actorName}</strong></td>
                    <td>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary)" }}>
                        {log.actorRole}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                        <Building2 size={13} color="var(--primary)" />
                        {log.organizationName}
                      </span>
                    </td>
                    <td><code style={{ background: "#f1f5f9", padding: "0.2rem 0.4rem", color: "#0f172a" }}>{log.action}</code></td>
                    <td>{log.entityType} ({log.entityId})</td>
                    <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{log.oldValues}</td>
                    <td style={{ fontSize: "0.75rem", color: "var(--success-text)", fontWeight: 600 }}>{log.newValues}</td>
                    <td><code>{log.ipAddress}</code></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
