import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { FileSpreadsheet, Search, ShieldCheck } from "lucide-react";

export const AdminAuditLogsPage = () => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Audit Trail Logs</h1>
          <p>Immutable event log tracing every administrative mutation, approval, suspension and operational update.</p>
        </div>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div className="header-search" style={{ width: "300px" }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              placeholder="Search action, actor, organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Total Audit Records: <strong>{auditLogs.length}</strong>
          </div>
        </div>

        <table className="data-table">
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
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td><span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{log.timestamp}</span></td>
                <td><strong>{log.actorName}</strong></td>
                <td>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary)" }}>
                    {log.actorRole}
                  </span>
                </td>
                <td>{log.organizationName}</td>
                <td><code style={{ background: "#f1f5f9", padding: "0.2rem 0.4rem", color: "#0f172a" }}>{log.action}</code></td>
                <td>{log.entityType} ({log.entityId})</td>
                <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{log.oldValues}</td>
                <td style={{ fontSize: "0.75rem", color: "var(--success-text)", fontWeight: 600 }}>{log.newValues}</td>
                <td><code>{log.ipAddress}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
