import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Search,
  RefreshCw,
  Power,
  RotateCcw,
} from "lucide-react";

export const AdminOrganizationsPage = () => {
  const {
    organizations = [],
    buses = [],
    approveOrganization,
    rejectOrganization,
    suspendOrganization,
    reactivateOrganization,
    updateOrganizationStatus,
    isLoadingData,
    fetchAdminData,
    showToast,
  } = useApp();

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [targetOrgId, setTargetOrgId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Performance: only load if empty on initial mount
  useEffect(() => {
    if (organizations.length === 0 && fetchAdminData) {
      fetchAdminData();
    }
  }, [organizations.length, fetchAdminData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterType, searchQuery]);

  const categories = useMemo(() => {
    return Array.from(new Set(organizations.map((o) => o.type).filter(Boolean)));
  }, [organizations]);

  const getOrgBusCount = (org) => {
    if (org.totalBuses !== undefined && org.totalBuses > 0) return org.totalBuses;
    const fromBuses = (buses || []).filter((b) => b.organizationId === org.id || b.organization_id === org.id).length;
    return fromBuses || (org._count?.buses ?? org.buses?.length ?? 0);
  };

  const filteredOrgs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return organizations.filter((org) => {
      const matchesStatus = filterStatus === "ALL" || org.status === filterStatus;
      const matchesType = filterType === "ALL" || org.type === filterType;
      const matchesSearch =
        !q ||
        (org.name || "").toLowerCase().includes(q) ||
        (org.registrationNumber || "").toLowerCase().includes(q) ||
        (org.contactName || "").toLowerCase().includes(q) ||
        (org.address || "").toLowerCase().includes(q) ||
        (org.email || "").toLowerCase().includes(q);
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [organizations, filterStatus, filterType, searchQuery]);

  const totalPages = Math.ceil(filteredOrgs.length / pageSize) || 1;
  const paginatedOrgs = useMemo(() => {
    return filteredOrgs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredOrgs, currentPage, pageSize]);

  const handleManualRefresh = async () => {
    if (!fetchAdminData) return;
    try {
      setIsRefreshing(true);
      await fetchAdminData();
      if (showToast) showToast("Organizations directory updated from backend.");
    } catch {
      if (showToast) showToast("Failed to refresh organizations.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusSelectChange = (orgId, nextStatus) => {
    if (nextStatus === "REJECTED") {
      setTargetOrgId(orgId);
      setShowRejectModal(true);
    } else if (nextStatus === "SUSPENDED") {
      setTargetOrgId(orgId);
      setShowSuspendModal(true);
    } else {
      updateOrganizationStatus(orgId, nextStatus);
      if (selectedOrg && selectedOrg.id === orgId) {
        setSelectedOrg((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    }
  };

  const handleConfirmReject = () => {
    if (targetOrgId) {
      const reason = rejectReason.trim() || "Documentation verification failed";
      rejectOrganization(targetOrgId, reason);
      if (selectedOrg && selectedOrg.id === targetOrgId) {
        setSelectedOrg((prev) => (prev ? { ...prev, status: "REJECTED", notes: reason } : null));
      }
      setShowRejectModal(false);
      setRejectReason("");
      setTargetOrgId(null);
    }
  };

  const handleConfirmSuspend = () => {
    if (targetOrgId) {
      const reason = suspendReason.trim() || "Administrative safety suspension";
      suspendOrganization(targetOrgId, reason);
      if (selectedOrg && selectedOrg.id === targetOrgId) {
        setSelectedOrg((prev) => (prev ? { ...prev, status: "SUSPENDED", notes: reason } : null));
      }
      setShowSuspendModal(false);
      setSuspendReason("");
      setTargetOrgId(null);
    }
  };

  const handleApprove = (orgId) => {
    approveOrganization(orgId);
    if (selectedOrg && selectedOrg.id === orgId) {
      setSelectedOrg((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
    }
  };

  const handleReactivate = (orgId) => {
    reactivateOrganization(orgId);
    if (selectedOrg && selectedOrg.id === orgId) {
      setSelectedOrg((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Organizations & Bus Operators</h1>
          <p>Supervise transport operator credentials, legal registration, operational fleet, and live licensing status.</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <div className="header-search" style={{ width: "260px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search by name, reg #, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              title="Filter by operator category / type"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              title="Filter by approval status"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved Active</option>
              <option value="PENDING">Pending Review</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.85rem",
                fontSize: "0.825rem",
                cursor: "pointer",
                borderRadius: "0.5rem"
              }}
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoadingData}
              title="Refresh organizations list from backend"
            >
              <RefreshCw size={13} className={isRefreshing || isLoadingData ? "spin animate-spin" : ""} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing <strong>{filteredOrgs.length}</strong> of <strong>{organizations.length}</strong> operators
          </div>
        </div>

        {/* Operators Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: "1050px" }}>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Type</th>
                <th>Registration Ref</th>
                <th>Contact Details</th>
                <th>Fleet / Trips</th>
                <th>Current Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData && organizations.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem" }}>
                    <LoadingSpinner label="Loading registered organizations..." />
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No organizations found matching the selected filter or search term.
                  </td>
                </tr>
              ) : (
                paginatedOrgs.map((org) => {
                  const currentStatus = org.status || "APPROVED";
                  const busCount = getOrgBusCount(org);
                  return (
                    <tr key={org.id}>
                      <td>
                        <strong>{org.name}</strong>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{org.address}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{org.type}</span>
                      </td>
                      <td><code>{org.registrationNumber}</code></td>
                      <td>
                        <div>{org.contactName}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{org.phone} | {org.email}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)" }}>
                          {busCount} {busCount === 1 ? "bus" : "buses"}
                        </span>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{org.activeTrips || 0} active trips</div>
                      </td>
                      <td>
                        <Badge status={currentStatus} />
                      </td>
                      <td>{org.createdAt}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedOrg(org)}
                            title="View complete organization profile"
                          >
                            <Eye size={13} /> View
                          </button>

                          {currentStatus === "PENDING" && (
                            <>
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() => handleApprove(org.id)}
                                title="Approve operator application"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                  setTargetOrgId(org.id);
                                  setShowRejectModal(true);
                                }}
                                title="Reject operator application"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {currentStatus === "APPROVED" && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                setTargetOrgId(org.id);
                                setShowSuspendModal(true);
                              }}
                              title="Suspend operator operations"
                            >
                              Suspend
                            </button>
                          )}

                          {currentStatus === "SUSPENDED" && (
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => handleReactivate(org.id)}
                              title="Reactivate suspended operator"
                            >
                              Reactivate
                            </button>
                          )}

                          {currentStatus === "REJECTED" && (
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => handleApprove(org.id)}
                              title="Re-evaluate and approve operator"
                            >
                              Approve
                            </button>
                          )}
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
          totalItems={filteredOrgs.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="organizations"
        />
      </div>

      {/* Detail View Modal */}
      <Modal
        isOpen={!!selectedOrg}
        onClose={() => setSelectedOrg(null)}
        title={`Organization Profile: ${selectedOrg?.name || ""}`}
        footer={
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button className="btn btn-secondary" onClick={() => setSelectedOrg(null)}>
              Close
            </button>
            {selectedOrg?.status === "PENDING" && (
              <>
                <button
                  className="btn btn-success"
                  onClick={() => handleApprove(selectedOrg.id)}
                >
                  Approve Operator
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setTargetOrgId(selectedOrg.id);
                    setShowRejectModal(true);
                  }}
                >
                  Reject
                </button>
              </>
            )}
            {selectedOrg?.status === "APPROVED" && (
              <button
                className="btn btn-danger"
                onClick={() => {
                  setTargetOrgId(selectedOrg.id);
                  setShowSuspendModal(true);
                }}
              >
                Suspend Operator
              </button>
            )}
            {selectedOrg?.status === "SUSPENDED" && (
              <button
                className="btn btn-success"
                onClick={() => handleReactivate(selectedOrg.id)}
              >
                Reactivate Operator
              </button>
            )}
            {selectedOrg?.status === "REJECTED" && (
              <button
                className="btn btn-success"
                onClick={() => handleApprove(selectedOrg.id)}
              >
                Approve Operator
              </button>
            )}
          </div>
        }
      >
        {selectedOrg && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>{selectedOrg.name}</h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.2rem 0 0 0" }}>{selectedOrg.type}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>Status:</span>
                <Badge status={selectedOrg.status || "APPROVED"} />
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: "1rem" }}>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Registration Number</span>
                <div style={{ fontWeight: 700 }}>{selectedOrg.registrationNumber}</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Application Date</span>
                <div style={{ fontWeight: 700 }}>{selectedOrg.createdAt}</div>
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: "1rem" }}>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Primary Contact</span>
                <div style={{ fontWeight: 700 }}>{selectedOrg.contactName}</div>
                <div style={{ fontSize: "0.75rem" }}>{selectedOrg.phone} | {selectedOrg.email}</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Operational Fleet</span>
                <div style={{ fontWeight: 700 }}>{getOrgBusCount(selectedOrg)} Registered Buses</div>
                <div style={{ fontSize: "0.75rem" }}>{selectedOrg.activeTrips || 0} Active Departure Schedules</div>
              </div>
            </div>

            <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Address & Operational Notes</span>
              <div style={{ fontSize: "0.82rem", margin: "0.2rem 0" }}>{selectedOrg.address}</div>
              <div style={{ fontSize: "0.78rem", fontStyle: "italic", color: "var(--text-muted)" }}>
                "{selectedOrg.notes || "Registered transport operator."}"
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason("");
          setTargetOrgId(null);
        }}
        title="Reject Operator Application"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason("");
                setTargetOrgId(null);
              }}
            >
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleConfirmReject}>
              Confirm Rejection
            </button>
          </>
        }
      >
        <div className="form-group">
          <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.35rem", display: "block" }}>
            Reason for Application Rejection
          </label>
          <textarea
            rows={3}
            placeholder="Provide official rationale (e.g. invalid commercial transport license...)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
          />
        </div>
      </Modal>

      {/* Suspend Modal */}
      <Modal
        isOpen={showSuspendModal}
        onClose={() => {
          setShowSuspendModal(false);
          setSuspendReason("");
          setTargetOrgId(null);
        }}
        title="Suspend Organization Operations"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowSuspendModal(false);
                setSuspendReason("");
                setTargetOrgId(null);
              }}
            >
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleConfirmSuspend}>
              Suspend Operator
            </button>
          </>
        }
      >
        <div className="form-group">
          <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.35rem", display: "block" }}>
            Reason for Suspension
          </label>
          <textarea
            rows={3}
            placeholder="Specify reason for suspending operator active status..."
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
          />
        </div>
      </Modal>
    </div>
  );
};
export default AdminOrganizationsPage;
