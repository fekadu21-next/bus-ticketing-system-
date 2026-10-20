import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Search, ShieldCheck, RefreshCw, Building2, Edit2, Lock, Plus, CheckCircle2 } from "lucide-react";

export const AdminAuditLogsPage = () => {
  const {
    auditLogs = [],
    organizations = [],
    updateAuditLog,
    isLoadingData,
    fetchAdminData,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit / Update Modal State
  const [editingLog, setEditingLog] = useState(null);
  const [editAction, setEditAction] = useState("");
  const [editOldValues, setEditOldValues] = useState("");
  const [editNewValues, setEditNewValues] = useState("");
  const [editIpAddress, setEditIpAddress] = useState("");

  // Create Audit Event Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAction, setNewAction] = useState("SECURITY_AUDIT_LOCK");
  const [newEntity, setNewEntity] = useState("Ticket System");
  const [newOldState, setNewOldState] = useState("Status: UNLOCKED");
  const [newNewState, setNewNewState] = useState("Status: LOCKED & VERIFIED");
  const [newIp, setNewIp] = useState("192.168.1.100");

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterOrg, searchQuery]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return auditLogs.filter((log) => {
      const matchesOrg =
        filterOrg === "ALL" ||
        log.organizationId === filterOrg ||
        (organizations.find((o) => o.id === filterOrg)?.name &&
          log.organizationName?.toLowerCase() === organizations.find((o) => o.id === filterOrg)?.name?.toLowerCase());

      const matchesSearch =
        !q ||
        (log.action || "").toLowerCase().includes(q) ||
        (log.actorName || "").toLowerCase().includes(q) ||
        (log.organizationName || "").toLowerCase().includes(q) ||
        (log.entityType || "").toLowerCase().includes(q) ||
        (log.oldValues || "").toLowerCase().includes(q) ||
        (log.newValues || "").toLowerCase().includes(q) ||
        (log.ipAddress || "").toLowerCase().includes(q);

      return matchesOrg && matchesSearch;
    });
  }, [auditLogs, organizations, filterOrg, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const handleManualRefresh = async () => {
    if (!fetchAdminData) return;
    try {
      setIsRefreshing(true);
      await fetchAdminData();
      if (showToast) showToast("Audit logs synchronized from backend.");
    } catch {
      if (showToast) showToast("Failed to refresh audit logs.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const openEditModal = (log) => {
    setEditingLog(log);
    setEditAction(log.action || "");
    setEditOldValues(log.oldValues || "");
    setEditNewValues(log.newValues || "");
    setEditIpAddress(log.ipAddress || "127.0.0.1");
  };

  const handleSaveEdit = () => {
    if (!editingLog) return;
    if (updateAuditLog) {
      updateAuditLog(editingLog.id, {
        action: editAction.trim(),
        oldValues: editOldValues.trim(),
        newValues: editNewValues.trim(),
        ipAddress: editIpAddress.trim(),
      });
    }
    setEditingLog(null);
  };

  const handleLockState = (log) => {
    if (updateAuditLog) {
      updateAuditLog(log.id, {
        action: `${log.action} [LOCKED]`,
        newValues: `${log.newValues} (State Verified & Locked)`,
        ipAddress: log.ipAddress || "127.0.0.1",
      });
    }
  };

  const handleCreateAuditNote = () => {
    if (!newAction.trim()) return;
    if (updateAuditLog) {
      const generatedId = `aud-${Date.now()}`;
      updateAuditLog(generatedId, {
        id: generatedId,
        actorName: "Platform Admin",
        actorRole: "ADMIN",
        organizationName: "System-wide Oversight",
        action: newAction.trim(),
        entityType: newEntity.trim(),
        entityId: "SYSTEM",
        oldValues: newOldState.trim(),
        newValues: newNewState.trim(),
        timestamp: new Date().toLocaleString(),
        ipAddress: newIp.trim() || "127.0.0.1",
      });
    }
    setShowCreateModal(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Audit Trail & Security Logs</h1>
          <p>Trace administrative mutations, status approvals, cancellations, and manage audit log state, ticket locks, and IP address records.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            className="btn btn-secondary"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoadingData}
            title="Refresh Audit Logs"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <RefreshCw size={14} className={isRefreshing || isLoadingData ? "spin animate-spin" : ""} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            title="Record custom audit event or lock ticket status"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Plus size={14} /> Record Audit Event
          </button>
        </div>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <div className="header-search" style={{ width: "260px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search action, actor, IP, state..."
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
          <table className="data-table" style={{ minWidth: "1150px" }}>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData && auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "2.5rem" }}>
                    <LoadingSpinner label="Loading platform audit trail..." />
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No audit trail records found matching your query.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
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
                    <td>
                      <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(log)}
                          title="Edit audit record state or IP address"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleLockState(log)}
                          title="Lock and verify audit state"
                        >
                          <Lock size={12} /> Lock
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
          totalItems={filteredLogs.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="audit records"
        />
      </div>

      {/* Edit Audit Record Modal */}
      <Modal
        isOpen={Boolean(editingLog)}
        onClose={() => setEditingLog(null)}
        title={`Update Audit Record: ${editingLog?.id || ""}`}
        footer={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" onClick={() => setEditingLog(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveEdit}>
              Save Updates
            </button>
          </div>
        }
      >
        {editingLog && (
          <div>
            <div className="form-group" style={{ marginBottom: "0.85rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                Action Code
              </label>
              <input
                type="text"
                value={editAction}
                onChange={(e) => setEditAction(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
              />
            </div>

            <div className="form-row" style={{ marginBottom: "0.85rem" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                  Old State Values
                </label>
                <input
                  type="text"
                  value={editOldValues}
                  onChange={(e) => setEditOldValues(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                  New State Values
                </label>
                <input
                  type="text"
                  value={editNewValues}
                  onChange={(e) => setEditNewValues(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "0.85rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                Recorded IP Address
              </label>
              <input
                type="text"
                value={editIpAddress}
                onChange={(e) => setEditIpAddress(e.target.value)}
                placeholder="e.g. 192.168.1.1 or 127.0.0.1"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)", fontFamily: "monospace" }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Record Audit Note Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Record Security Audit Event / Lock State"
        footer={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateAuditNote}>
              Record Event
            </button>
          </div>
        }
      >
        <div>
          <div className="form-group" style={{ marginBottom: "0.85rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
              Action Type
            </label>
            <input
              type="text"
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
              placeholder="e.g. TICKET_STATUS_LOCK, SECURITY_AUDIT_LOG"
              style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "0.85rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
              Target Entity
            </label>
            <input
              type="text"
              value={newEntity}
              onChange={(e) => setNewEntity(e.target.value)}
              placeholder="e.g. Ticket QR System, Booking Coordinator"
              style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
            />
          </div>

          <div className="form-row" style={{ marginBottom: "0.85rem" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                Old State
              </label>
              <input
                type="text"
                value={newOldState}
                onChange={(e) => setNewOldState(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                New State
              </label>
              <input
                type="text"
                value={newNewState}
                onChange={(e) => setNewNewState(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
              Auditor / Terminal IP Address
            </label>
            <input
              type="text"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)", fontFamily: "monospace" }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAuditLogsPage;
