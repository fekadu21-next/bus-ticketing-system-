import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Building2, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Eye, Search, RefreshCw } from "lucide-react";

export const AdminOrganizationsPage = () => {
  const {
    organizations,
    approveOrganization,
    rejectOrganization,
    suspendOrganization,
    reactivateOrganization,
    isLoadingData,
    fetchAdminData,
  } = useApp();

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [targetOrgId, setTargetOrgId] = useState(null);

  const filteredOrgs = organizations.filter((org) => {
    const matchesStatus = filterStatus === "ALL" || org.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (org.name || "").toLowerCase().includes(q) ||
      (org.registrationNumber || "").toLowerCase().includes(q) ||
      (org.contactName || "").toLowerCase().includes(q) ||
      (org.address || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleConfirmReject = () => {
    if (targetOrgId) {
      rejectOrganization(targetOrgId, rejectReason || "Documentation non-compliant");
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedOrg(null);
    }
  };

  const handleConfirmSuspend = () => {
    if (targetOrgId) {
      suspendOrganization(targetOrgId, suspendReason || "Safety policy non-conformance");
      setShowSuspendModal(false);
      setSuspendReason("");
      setSelectedOrg(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Organizations</h1>
          <p>Review operator applications and active transport providers.</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div className="header-search" style={{ width: "260px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Filter by name, reg #..."
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
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing <strong>{filteredOrgs.length}</strong> of <strong>{organizations.length}</strong> registered operators
          </div>
        </div>

        {/* Operators Table */}
        <table className="data-table">
          <thead>
            <tr>
              <th>Organization</th>
              <th>Type</th>
              <th>Registration Ref</th>
              <th>Contact Details</th>
              <th>Fleet / Trips</th>
              <th>Status</th>
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
              filteredOrgs.map((org) => (
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
                    <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{org.totalBuses} buses</span>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{org.activeTrips} active trips</div>
                  </td>
                  <td><Badge status={org.status} /></td>
                  <td>{org.createdAt}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedOrg(org)}
                      >
                        <Eye size={13} /> View
                      </button>
                      {org.status === "PENDING" && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => approveOrganization(org.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setTargetOrgId(org.id);
                              setShowRejectModal(true);
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {org.status === "APPROVED" && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setTargetOrgId(org.id);
                            setShowSuspendModal(true);
                          }}
                        >
                          Suspend
                        </button>
                      )}
                      {org.status === "SUSPENDED" && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => reactivateOrganization(org.id)}
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail View Modal */}
      <Modal
        isOpen={!!selectedOrg}
        onClose={() => setSelectedOrg(null)}
        title={`Organization Profile: ${selectedOrg?.name}`}
        footer={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" onClick={() => setSelectedOrg(null)}>
              Close
            </button>
            {selectedOrg?.status === "PENDING" && (
              <button
                className="btn btn-success"
                onClick={() => {
                  approveOrganization(selectedOrg.id);
                  setSelectedOrg(null);
                }}
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
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{selectedOrg.name}</h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{selectedOrg.type}</p>
              </div>
              <Badge status={selectedOrg.status} />
            </div>

            <div className="form-row" style={{ marginBottom: "1rem" }}>
              <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Registration Number</span>
                <div style={{ fontWeight: 700 }}>{selectedOrg.registrationNumber}</div>
              </div>
              <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Application Date</span>
                <div style={{ fontWeight: 700 }}>{selectedOrg.createdAt}</div>
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: "1rem" }}>
              <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Primary Contact</span>
                <div style={{ fontWeight: 700 }}>{selectedOrg.contactName}</div>
                <div style={{ fontSize: "0.75rem" }}>{selectedOrg.phone} | {selectedOrg.email}</div>
              </div>
              <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Operational Fleet</span>
                <div style={{ fontWeight: 700 }}>{selectedOrg.totalBuses} Registered Buses</div>
                <div style={{ fontSize: "0.75rem" }}>{selectedOrg.activeTrips} Active Departure Schedules</div>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Address & Notes</span>
              <div style={{ fontSize: "0.82rem", margin: "0.2rem 0" }}>{selectedOrg.address}</div>
              <div style={{ fontSize: "0.78rem", fontStyle: "italic", color: "var(--text-muted)" }}>
                "{selectedOrg.notes}"
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Operator Application"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleConfirmReject}>Confirm Rejection</button>
          </>
        }
      >
        <div className="form-group">
          <label>Reason for Application Rejection</label>
          <textarea
            rows={3}
            placeholder="Provide official rationale (e.g. invalid commercial transport license...)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* Suspend Modal */}
      <Modal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        title="Suspend Organization Operations"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowSuspendModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleConfirmSuspend}>Suspend Operator</button>
          </>
        }
      >
        <div className="form-group">
          <label>Reason for Suspension</label>
          <textarea
            rows={3}
            placeholder="Specify reason for suspending operator active status..."
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
