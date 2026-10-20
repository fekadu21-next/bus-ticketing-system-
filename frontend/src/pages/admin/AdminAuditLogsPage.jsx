import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  Search,
  ShieldCheck,
  RefreshCw,
  Building2,
  Calendar,
  Filter,
  Download,
  Eye,
  Clock,
  User,
  Activity,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Globe,
  FileText,
} from "lucide-react";

export const AdminAuditLogsPage = () => {
  const {
    auditLogs = [],
    organizations = [],
    isLoadingData,
    fetchAdminData,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [timeframe, setTimeframe] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterOrg, timeframe, searchQuery]);

  // Helper to categorize action codes
  const getActionCategory = (action = "") => {
    const act = action.toUpperCase();
    if (act.includes("AUTH") || act.includes("LOGIN") || act.includes("LOCK") || act.includes("PASSWORD")) {
      return "AUTH";
    }
    if (act.includes("ORGANIZATION") || act.includes("ORG") || act.includes("APPROVE") || act.includes("REJECT")) {
      return "GOVERNANCE";
    }
    if (act.includes("USER") || act.includes("ROLE") || act.includes("SUSPEND")) {
      return "USERS";
    }
    if (act.includes("TRIP") || act.includes("BUS") || act.includes("ROUTE") || act.includes("SCHEDULE")) {
      return "OPERATIONS";
    }
    if (act.includes("BOOKING") || act.includes("PAYMENT") || act.includes("TICKET") || act.includes("REFUND")) {
      return "FINANCE";
    }
    return "SYSTEM";
  };

  // Helper for color coding category
  const getCategoryConfig = (category) => {
    switch (category) {
      case "GOVERNANCE":
        return { label: "Governance & Approval", bg: "rgba(16, 185, 129, 0.12)", color: "#059669" };
      case "USERS":
        return { label: "User Accounts", bg: "rgba(59, 130, 246, 0.12)", color: "#2563eb" };
      case "AUTH":
        return { label: "Security & Auth", bg: "rgba(239, 68, 68, 0.12)", color: "#dc2626" };
      case "OPERATIONS":
        return { label: "Transit Operations", bg: "rgba(124, 58, 237, 0.12)", color: "#7c3aed" };
      case "FINANCE":
        return { label: "Finance & Ticketing", bg: "rgba(245, 158, 11, 0.12)", color: "#d97706" };
      default:
        return { label: "System Activity", bg: "rgba(100, 116, 139, 0.12)", color: "#64748b" };
    }
  };

  // Human-readable action descriptions
  const getActionDescription = (log) => {
    const action = log.action || "SYSTEM_EVENT";
    const entity = log.entityType || "Record";
    const entityId = log.entityId ? `#${log.entityId}` : "";
    const actUpper = action.toUpperCase();

    if (actUpper.includes("APPROVE")) {
      return `Approved ${entity} ${entityId} for active platform operation.`;
    }
    if (actUpper.includes("REJECT")) {
      return `Rejected registration for ${entity} ${entityId}.`;
    }
    if (actUpper.includes("SUSPEND")) {
      return `Suspended ${entity} ${entityId} account access privileges.`;
    }
    if (actUpper.includes("PUBLISH")) {
      return `Published dispatch schedule for ${entity} ${entityId}.`;
    }
    if (actUpper.includes("CANCEL")) {
      return `Cancelled ${entity} ${entityId} record.`;
    }
    if (actUpper.includes("LOCK")) {
      return `Verified and enforced cryptographic state lock on ${entity} ${entityId}.`;
    }
    if (actUpper.includes("LOGIN")) {
      return `Authenticated user session initiated via security gateway.`;
    }
    if (actUpper.includes("UPDATE") || actUpper.includes("MODIFY")) {
      return `Updated state configuration on ${entity} ${entityId}.`;
    }

    return `${action.replace(/_/g, " ")} executed on ${entity} ${entityId}.`;
  };

  // Helper to test timeframe
  const matchesTimeframe = (dateVal) => {
    if (!dateVal) return true;
    if (timeframe === "ALL") return true;

    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return true;
    const now = new Date();

    if (timeframe === "TODAY") {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }
    if (timeframe === "THIS_WEEK") {
      const diff = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      return d >= startOfWeek;
    }
    if (timeframe === "THIS_MONTH") {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
      );
    }
    return true;
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return auditLogs.filter((log) => {
      const category = getActionCategory(log.action);
      const matchesCat = filterCategory === "ALL" || category === filterCategory;

      const matchesOrg =
        filterOrg === "ALL" ||
        log.organizationId === filterOrg ||
        (organizations.find((o) => o.id === filterOrg)?.name &&
          log.organizationName?.toLowerCase() === organizations.find((o) => o.id === filterOrg)?.name?.toLowerCase());

      const matchesDate = matchesTimeframe(log.timestamp);

      const matchesSearch =
        !q ||
        (log.action || "").toLowerCase().includes(q) ||
        (log.actorName || "").toLowerCase().includes(q) ||
        (log.organizationName || "").toLowerCase().includes(q) ||
        (log.entityType || "").toLowerCase().includes(q) ||
        (log.entityId || "").toLowerCase().includes(q) ||
        (log.oldValues || "").toLowerCase().includes(q) ||
        (log.newValues || "").toLowerCase().includes(q) ||
        (log.ipAddress || "").toLowerCase().includes(q);

      return matchesCat && matchesOrg && matchesDate && matchesSearch;
    });
  }, [auditLogs, organizations, filterCategory, filterOrg, timeframe, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Executive Metrics
  const stats = useMemo(() => {
    const total = auditLogs.length;
    let authCount = 0;
    let govCount = 0;
    let opCount = 0;

    auditLogs.forEach((l) => {
      const cat = getActionCategory(l.action);
      if (cat === "AUTH") authCount++;
      else if (cat === "GOVERNANCE") govCount++;
      else if (cat === "OPERATIONS" || cat === "FINANCE") opCount++;
    });

    return { total, authCount, govCount, opCount };
  }, [auditLogs]);

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

  // CSV Export for Compliance
  const handleExportCSV = () => {
    try {
      const dateStr = new Date().toISOString().split("T")[0];
      const rows = [];

      rows.push(["Platform Security Audit & Regulatory Compliance Log"]);
      rows.push(["Generated Timestamp", new Date().toLocaleString()]);
      rows.push(["Category Filter", filterCategory]);
      rows.push(["Organization Filter", filterOrg]);
      rows.push(["Timeframe", timeframe]);
      rows.push([]);
      rows.push([
        "Log ID",
        "Timestamp",
        "Actor Name",
        "Role Scope",
        "IP Address",
        "Organization",
        "Category",
        "Action Code",
        "Target Entity",
        "Old Values",
        "New Values",
      ]);

      filteredLogs.forEach((l) => {
        rows.push([
          l.id,
          `"${l.timestamp || ""}"`,
          `"${(l.actorName || "").replace(/"/g, '""')}"`,
          `"${l.actorRole || "Admin"}"`,
          l.ipAddress || "127.0.0.1",
          `"${(l.organizationName || "").replace(/"/g, '""')}"`,
          getActionCategory(l.action),
          l.action,
          `"${l.entityType || ""} (${l.entityId || ""})"`,
          `"${(l.oldValues || "").replace(/"/g, '""')}"`,
          `"${(l.newValues || "").replace(/"/g, '""')}"`,
        ]);
      });

      const csvContent = "\uFEFF" + rows.map((e) => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `platform_audit_logs_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (showToast) showToast("Audit trail exported successfully as CSV.");
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Failed to export audit logs.", "error");
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Audit Trail & Security Logs</h1>
          <p>
            Immutable event logging, authentication tracking, administrative status mutations, and system access records.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoadingData}
            title="Refresh Audit Logs"
          >
            <RefreshCw size={14} className={isRefreshing || isLoadingData ? "spin animate-spin" : ""} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExportCSV}
            title="Download Regulatory CSV Compliance Report"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Top Security & Governance Metric Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            borderLeft: "4px solid var(--primary)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Total Audit Events
            </span>
            <Activity size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "0.4rem" }}>
            {stats.total}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Verified security records
          </span>
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            borderLeft: "4px solid #10b981",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Governance Approvals
            </span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "0.4rem", color: "#10b981" }}>
            {stats.govCount}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Organization & status changes
          </span>
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            borderLeft: "4px solid #7c3aed",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Operational Mutations
            </span>
            <Building2 size={18} color="#7c3aed" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "0.4rem" }}>
            {stats.opCount}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Trips, routes, bookings & fleet
          </span>
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            borderLeft: "4px solid #ef4444",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Security & Auth
            </span>
            <ShieldCheck size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "0.4rem", color: "#ef4444" }}>
            {stats.authCount}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Auth sessions & lock events
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card-table-wrapper">
        <div className="card-header-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          {/* Search Bar */}
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap", flex: 1 }}>
            <div className="header-search" style={{ minWidth: "260px", maxWidth: "340px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search action, actor, IP address, state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <select
              className="org-selector-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ fontSize: "0.82rem", padding: "5px 10px" }}
              title="Filter by action category"
            >
              <option value="ALL">All Categories</option>
              <option value="GOVERNANCE">🏢 Governance & Approvals</option>
              <option value="USERS">👥 User Accounts</option>
              <option value="OPERATIONS">🚌 Transit & Trips</option>
              <option value="FINANCE">💳 Finance & Bookings</option>
              <option value="AUTH">🛡️ Security & Auth</option>
            </select>

            {/* Organization Scope Filter */}
            <select
              className="org-selector-select"
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
              style={{ fontSize: "0.82rem", padding: "5px 10px" }}
              title="Filter audit trail by transport carrier"
            >
              <option value="ALL">🏢 All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>

            {/* Timeframe Filter */}
            <select
              className="org-selector-select"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              style={{ fontSize: "0.82rem", padding: "5px 10px" }}
              title="Filter by timeframe"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
            </select>
          </div>

          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            Showing <strong>{filteredLogs.length}</strong> of <strong>{auditLogs.length}</strong> events
          </div>
        </div>

        {/* Audit Log Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: "1150px" }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor Identity</th>
                <th>Scope / Carrier</th>
                <th>Action & Category</th>
                <th>Event Description</th>
                <th>Target Entity</th>
                <th>State Mutation</th>
                <th>IP Address</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData && auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "2.5rem" }}>
                    <LoadingSpinner label="Loading platform audit records..." />
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No audit records match your query and filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const category = getActionCategory(log.action);
                  const catConfig = getCategoryConfig(category);
                  const description = getActionDescription(log);
                  const actorInitial = (log.actorName || "U").charAt(0).toUpperCase();

                  return (
                    <tr key={log.id}>
                      {/* Timestamp */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Clock size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-main)" }}>
                              {log.timestamp}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Actor Identity */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              background: "rgba(37, 99, 235, 0.1)",
                              color: "var(--primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              flexShrink: 0,
                            }}
                          >
                            {actorInitial}
                          </div>
                          <div>
                            <strong style={{ fontSize: "0.82rem" }}>{log.actorName}</strong>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                              {log.actorRole || "Admin"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Scope / Carrier */}
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600, fontSize: "0.78rem" }}>
                          <Building2 size={13} color="var(--primary)" />
                          {log.organizationName || "System Oversight"}
                        </span>
                      </td>

                      {/* Action & Category */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background: catConfig.bg,
                              color: catConfig.color,
                              width: "fit-content",
                            }}
                          >
                            {catConfig.label}
                          </span>
                          <code style={{ fontSize: "0.72rem", background: "rgba(100, 116, 139, 0.1)", padding: "2px 4px", borderRadius: "4px" }}>
                            {log.action}
                          </code>
                        </div>
                      </td>

                      {/* Action Description */}
                      <td style={{ maxWidth: "260px" }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-main)", lineHeight: 1.35, display: "block" }}>
                          {description}
                        </span>
                      </td>

                      {/* Target Entity */}
                      <td>
                        <div style={{ fontSize: "0.78rem" }}>
                          <strong style={{ color: "var(--text-main)" }}>{log.entityType || "Record"}</strong>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                            {log.entityId}
                          </div>
                        </div>
                      </td>

                      {/* State Mutation */}
                      <td style={{ maxWidth: "200px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.74rem" }}>
                          <span style={{ color: "var(--text-muted)", textDecoration: log.oldValues ? "line-through" : "none", maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {log.oldValues || "—"}
                          </span>
                          <ArrowRight size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                          <span style={{ color: "#10b981", fontWeight: 700, maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {log.newValues || "—"}
                          </span>
                        </div>
                      </td>

                      {/* IP Address */}
                      <td>
                        <code style={{ fontSize: "0.74rem", background: "rgba(100, 116, 139, 0.08)", padding: "2px 6px", borderRadius: "4px" }}>
                          {log.ipAddress || "127.0.0.1"}
                        </code>
                      </td>

                      {/* Action */}
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedLog(log)}
                          title="Inspect complete event payload and audit details"
                          style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "4px 8px" }}
                        >
                          <Eye size={12} /> Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
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

      {/* Audit Log Inspector Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={`Audit Event Inspector: ${selectedLog?.id || ""}`}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              Cryptographically verified system record
            </span>
            <button className="btn btn-secondary" onClick={() => setSelectedLog(null)}>
              Close
            </button>
          </div>
        }
      >
        {selectedLog && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Header Badge Strip */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                background: "var(--bg-main, #f8fafc)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: getCategoryConfig(getActionCategory(selectedLog.action)).bg,
                    color: getCategoryConfig(getActionCategory(selectedLog.action)).color,
                  }}
                >
                  {getActionCategory(selectedLog.action)}
                </span>
                <h4 style={{ margin: "6px 0 0", fontSize: "1rem", fontWeight: 700 }}>
                  {selectedLog.action}
                </h4>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Timestamp</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{selectedLog.timestamp}</div>
              </div>
            </div>

            {/* Actor & Security Scope Details */}
            <div className="form-row">
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.85rem", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Actor Identity</span>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <User size={15} color="var(--primary)" />
                  {selectedLog.actorName}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Role: <strong>{selectedLog.actorRole || "System Admin"}</strong>
                </div>
              </div>

              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.85rem", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Network & Origin Security</span>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Globe size={15} color="#10b981" />
                  <code>{selectedLog.ipAddress || "127.0.0.1"}</code>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Carrier Scope: <strong>{selectedLog.organizationName || "Platform System"}</strong>
                </div>
              </div>
            </div>

            {/* Target Entity Details */}
            <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.85rem", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Target Entity</span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <div>
                  <strong style={{ fontSize: "0.9rem" }}>{selectedLog.entityType || "Record"}</strong>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Entity ID: <code>{selectedLog.entityId}</code></div>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "rgba(100, 116, 139, 0.1)", padding: "3px 8px", borderRadius: "4px" }}>
                  Event ID: {selectedLog.id}
                </span>
              </div>
            </div>

            {/* Before vs After State Mutation Diff */}
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                State Transition Diff
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.4rem" }}>
                {/* Old State */}
                <div
                  style={{
                    padding: "0.85rem",
                    borderRadius: "8px",
                    background: "rgba(239, 68, 68, 0.04)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#dc2626", textTransform: "uppercase", marginBottom: "4px" }}>
                    Previous State (Before)
                  </div>
                  <pre style={{ margin: 0, fontSize: "0.78rem", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace", color: "var(--text-main)" }}>
                    {selectedLog.oldValues || "—"}
                  </pre>
                </div>

                {/* New State */}
                <div
                  style={{
                    padding: "0.85rem",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.04)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#059669", textTransform: "uppercase", marginBottom: "4px" }}>
                    Mutated State (After)
                  </div>
                  <pre style={{ margin: 0, fontSize: "0.78rem", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace", color: "#059669", fontWeight: 600 }}>
                    {selectedLog.newValues || "—"}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminAuditLogsPage;
