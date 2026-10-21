import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { QrCode, Search, Eye, ShieldCheck, RefreshCw, Building2, CheckCircle2, XCircle } from "lucide-react";

export const AdminTicketsPage = () => {
  const {
    tickets = [],
    verifications = [],
    organizations = [],
    stations = [],
    updateTicketStatus,
    verifyTicket,
    isLoadingData,
    fetchAdminData,
    showToast,
  } = useApp();

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [activeTab, setActiveTab] = useState("TICKETS");
  const [currentPageTickets, setCurrentPageTickets] = useState(1);
  const [pageSizeTickets, setPageSizeTickets] = useState(10);
  const [currentPageVerif, setCurrentPageVerif] = useState(1);
  const [pageSizeVerif, setPageSizeVerif] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live Ticket Verification Testing Terminal State
  const [showTestVerifyModal, setShowTestVerifyModal] = useState(false);
  const [testTicketInput, setTestTicketInput] = useState(tickets[0]?.ticketNumber || "ET-TKT-9001");
  const [testStationName, setTestStationName] = useState(stations[0]?.name || "Addis Ababa Intercity Terminal");
  const [testVerifierName, setTestVerifierName] = useState("Platform Auditor");
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  React.useEffect(() => {
    setCurrentPageTickets(1);
    setCurrentPageVerif(1);
  }, [filterOrg, filterStatus, searchQuery, activeTab]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tickets.filter((t) => {
      const matchesOrg =
        filterOrg === "ALL" ||
        t.organizationId === filterOrg ||
        (organizations.find((o) => o.id === filterOrg)?.name &&
          t.organizationName?.toLowerCase() === organizations.find((o) => o.id === filterOrg)?.name?.toLowerCase());

      const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
      const matchesSearch =
        !q ||
        (t.ticketNumber || "").toLowerCase().includes(q) ||
        (t.passengerName || "").toLowerCase().includes(q) ||
        (t.qrToken || "").toLowerCase().includes(q) ||
        (t.tripCode || "").toLowerCase().includes(q) ||
        (t.organizationName || "").toLowerCase().includes(q);

      return matchesOrg && matchesStatus && matchesSearch;
    });
  }, [tickets, organizations, filterOrg, filterStatus, searchQuery]);

  const filteredVerifications = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return verifications.filter((v) => {
      const matchesOrg =
        filterOrg === "ALL" ||
        v.organizationId === filterOrg ||
        (organizations.find((o) => o.id === filterOrg)?.name &&
          v.organizationName?.toLowerCase() === organizations.find((o) => o.id === filterOrg)?.name?.toLowerCase());

      const matchesSearch =
        !q ||
        (v.ticketNumber || "").toLowerCase().includes(q) ||
        (v.passengerName || "").toLowerCase().includes(q) ||
        (v.verifierName || "").toLowerCase().includes(q) ||
        (v.stationName || "").toLowerCase().includes(q);

      return matchesOrg && matchesSearch;
    });
  }, [verifications, organizations, filterOrg, searchQuery]);

  const totalPagesTickets = Math.ceil(filteredTickets.length / pageSizeTickets) || 1;
  const paginatedTickets = useMemo(() => {
    return filteredTickets.slice(
      (currentPageTickets - 1) * pageSizeTickets,
      currentPageTickets * pageSizeTickets
    );
  }, [filteredTickets, currentPageTickets, pageSizeTickets]);

  const totalPagesVerif = Math.ceil(filteredVerifications.length / pageSizeVerif) || 1;
  const paginatedVerifications = useMemo(() => {
    return filteredVerifications.slice(
      (currentPageVerif - 1) * pageSizeVerif,
      currentPageVerif * pageSizeVerif
    );
  }, [filteredVerifications, currentPageVerif, pageSizeVerif]);

  const handleManualRefresh = async () => {
    if (!fetchAdminData) return;
    try {
      setIsRefreshing(true);
      await fetchAdminData();
      if (showToast) showToast("Tickets and QR scan records refreshed.");
    } catch {
      if (showToast) showToast("Failed to refresh tickets.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestVerifyAction = async (overrideCode = null) => {
    const code = overrideCode || testTicketInput;
    if (!code || !code.trim()) {
      if (showToast) showToast("Please enter or select a ticket code to test.", "error");
      return;
    }
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const result = await verifyTicket({
        ticketNumber: code.trim(),
        stationName: testStationName || stations[0]?.name || "Addis Ababa Intercity Terminal",
        verifierName: testVerifierName || "Platform Auditor",
      });
      setVerificationResult(result);
    } catch (err) {
      setVerificationResult({
        valid: false,
        status: "ERROR",
        message: err.message || "Verification failed.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleStatusChange = (ticketId, newStatus) => {
    if (updateTicketStatus) {
      updateTicketStatus(ticketId, newStatus);
    }
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Tickets & QR Verification Inspector</h1>
          <p>Monitor digital ticket issuance, passenger QR validity, and live QR code verification scans conducted by terminal staff.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoadingData}
            title="Refresh Tickets"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <RefreshCw size={14} className={isRefreshing || isLoadingData ? "spin animate-spin" : ""} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            className="btn btn-primary"
            style={{ background: "#059669", borderColor: "#059669", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            onClick={() => { setVerificationResult(null); setShowTestVerifyModal(true); }}
            title="Launch Interactive Ticket Verification Simulator"
          >
            <QrCode size={15} /> Test Ticket Verification
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          className={`btn ${activeTab === "TICKETS" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("TICKETS")}
        >
          <QrCode size={15} /> Issued Digital Tickets ({filteredTickets.length})
        </button>
        <button
          className={`btn ${activeTab === "LOGS" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("LOGS")}
        >
          <ShieldCheck size={15} /> Live QR Scan Events ({filteredVerifications.length})
        </button>
      </div>

      {activeTab === "TICKETS" ? (
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <div className="header-search" style={{ width: "260px" }}>
                <Search className="search-icon" size={15} />
                <input
                  type="text"
                  placeholder="Search ticket # or QR token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Organization Filter */}
              <select
                className="org-selector-select"
                value={filterOrg}
                onChange={(e) => setFilterOrg(e.target.value)}
                title="Filter tickets by transport company"
              >
                <option value="ALL">🏢 All Organizations</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>

              <select
                className="org-selector-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                title="Filter tickets by status"
              >
                <option value="ALL">All Ticket Statuses</option>
                <option value="VALID">VALID</option>
                <option value="USED">USED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Showing <strong>{filteredTickets.length}</strong> of <strong>{tickets.length}</strong> tickets
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Passenger</th>
                <th>Operator</th>
                <th>Trip Code</th>
                <th>Seat #</th>
                <th>QR Token</th>
                <th>Status</th>
                <th>Issued At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData && tickets.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "2.5rem" }}>
                    <LoadingSpinner label="Loading digital tickets..." />
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No digital tickets found matching your query.
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((t) => {
                  const currentStatus = t.status || "VALID";
                  const isValid = currentStatus === "VALID";
                  return (
                    <tr key={t.id}>
                      <td><code>{t.ticketNumber}</code></td>
                      <td><strong>{t.passengerName}</strong></td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                          <Building2 size={13} color="var(--primary)" />
                          {t.organizationName}
                        </span>
                      </td>
                      <td><code>{t.tripCode}</code></td>
                      <td><strong>{t.seatNumber}</strong></td>
                      <td><code>{t.qrToken}</code></td>
                      <td>
                        <Badge status={currentStatus} />
                      </td>
                      <td>{t.issuedAt}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedTicket(t)}
                            title="Inspect QR Code"
                          >
                            <Eye size={13} /> View QR
                          </button>
                          </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPageTickets}
            totalPages={totalPagesTickets}
            totalItems={filteredTickets.length}
            pageSize={pageSizeTickets}
            onPageChange={setCurrentPageTickets}
            onPageSizeChange={setPageSizeTickets}
            itemLabel="tickets"
          />
        </div>
      ) : (
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <div className="header-search" style={{ width: "260px" }}>
                <Search className="search-icon" size={15} />
                <input
                  type="text"
                  placeholder="Search scan logs by ticket, passenger..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Organization Filter */}
              <select
                className="org-selector-select"
                value={filterOrg}
                onChange={(e) => setFilterOrg(e.target.value)}
                title="Filter scan events by transport company"
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
              Showing <strong>{filteredVerifications.length}</strong> of <strong>{verifications.length}</strong> events
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Scanned At</th>
                <th>Ticket #</th>
                <th>Passenger</th>
                <th>Operator</th>
                <th>Terminal Location</th>
                <th>Terminal Verifier</th>
                <th>Verification Result</th>
              </tr>
            </thead>
            <tbody>
              {filteredVerifications.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No QR scan events found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedVerifications.map((v) => (
                  <tr key={v.id}>
                    <td><span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{v.scannedAt}</span></td>
                    <td><code>{v.ticketNumber}</code></td>
                    <td><strong>{v.passengerName}</strong></td>
                    <td>{v.organizationName}</td>
                    <td>{v.stationName}</td>
                    <td>{v.verifierName}</td>
                    <td>
                      <Badge status={v.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPageVerif}
            totalPages={totalPagesVerif}
            totalItems={filteredVerifications.length}
            pageSize={pageSizeVerif}
            onPageChange={setCurrentPageVerif}
            onPageSizeChange={setPageSizeVerif}
            itemLabel="verification scans"
          />
        </div>
      )}

      {/* QR Inspector Modal */}
      <Modal
        isOpen={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        title={`Digital QR Ticket: ${selectedTicket?.ticketNumber || ""}`}
        footer={
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button className="btn btn-secondary" onClick={() => setSelectedTicket(null)}>
              Close
            </button>
            {selectedTicket?.status !== "USED" && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleStatusChange(selectedTicket.id, "USED");
                }}
              >
                Mark as Boarded / Used
              </button>
            )}
            {selectedTicket?.status !== "VALID" && (
              <button
                className="btn btn-success"
                onClick={() => {
                  handleStatusChange(selectedTicket.id, "VALID");
                }}
              >
                Re-validate Ticket
              </button>
            )}
            {selectedTicket?.status !== "CANCELLED" && (
              <button
                className="btn btn-danger"
                onClick={() => {
                  handleStatusChange(selectedTicket.id, "CANCELLED");
                }}
              >
                Cancel / Invalidate
              </button>
            )}
          </div>
        }
      >
        {selectedTicket && (
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <div
              style={{
                width: "180px",
                height: "180px",
                margin: "0 auto 1rem",
                background: "#000000",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                padding: "1rem"
              }}
            >
              <QrCode size={110} color="#ffffff" />
              <span style={{ fontSize: "0.68rem", marginTop: "0.4rem", letterSpacing: "1px" }}>
                {selectedTicket.qrToken}
              </span>
            </div>

            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0.4rem 0" }}>{selectedTicket.passengerName}</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              {selectedTicket.routeName} | Seat <strong>{selectedTicket.seatNumber}</strong>
            </p>

            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", margin: "0.5rem 0" }}><Badge status={selectedTicket.status || "VALID"} /></div>

            <div
              style={{
                background: "var(--bg-main, #f8fafc)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                padding: "0.75rem",
                marginTop: "1rem",
                textAlign: "left",
                fontSize: "0.78rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Operating Carrier:</span>
                <strong>{selectedTicket.organizationName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Trip Code:</span>
                <code>{selectedTicket.tripCode}</code>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Seat Number:</span>
                <strong>{selectedTicket.seatNumber}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Issued Date:</span>
                <strong>{selectedTicket.issuedAt}</strong>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Admin Test Ticket Verification & QR Inspection Simulator Modal */}
      <Modal
        isOpen={showTestVerifyModal}
        onClose={() => { setShowTestVerifyModal(false); setVerificationResult(null); }}
        title="Platform Ticket Verification & QR Audit Simulator"
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Inspector: <strong>Platform Auditor</strong>
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn btn-secondary"
                onClick={() => { setShowTestVerifyModal(false); setVerificationResult(null); }}
              >
                Close Inspector
              </button>
              <button
                className="btn btn-primary"
                style={{ background: "#059669", borderColor: "#059669" }}
                onClick={() => handleTestVerifyAction()}
                disabled={isVerifying || !testTicketInput.trim()}
              >
                {isVerifying ? "Verifying Token..." : "Verify & Validate Ticket"}
              </button>
            </div>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ background: "rgba(5, 150, 105, 0.08)", border: "1px solid rgba(5, 150, 105, 0.2)", borderRadius: "8px", padding: "0.85rem", fontSize: "0.85rem", color: "var(--text-main)" }}>
            <strong>Platform Verifier Simulator:</strong> Test barcode and QR token validation against all registered carrier trips. Validate boarding status, test duplicate scan prevention, and verify immediate status synchronization.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Inspection Terminal / Station</label>
              <select
                className="form-control"
                value={testStationName}
                onChange={(e) => setTestStationName(e.target.value)}
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.name}>{st.name} ({st.city})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Verifier / Inspector Identity</label>
              <input
                type="text"
                className="form-control"
                value={testVerifierName}
                onChange={(e) => setTestVerifierName(e.target.value)}
                placeholder="e.g. Platform Auditor"
              />
            </div>
          </div>

          {/* Quick Ticket Selector Bar */}
          <div>
            <label className="form-label" style={{ fontWeight: 700, marginBottom: "0.4rem" }}>
              Select Active Issued Ticket to Verify:
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {tickets.slice(0, 5).map((tk) => (
                <button
                  key={tk.id}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: "0.75rem",
                    borderColor: testTicketInput === tk.ticketNumber ? "var(--primary)" : undefined,
                    background: testTicketInput === tk.ticketNumber ? "rgba(37, 99, 235, 0.1)" : undefined
                  }}
                  onClick={() => {
                    setTestTicketInput(tk.ticketNumber);
                    handleTestVerifyAction(tk.ticketNumber);
                  }}
                >
                  <code>{tk.ticketNumber}</code> ({tk.passengerName?.split(" ")[0]} - {tk.status})
                </button>
              ))}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: "0.75rem", color: "#ef4444", borderColor: "#fca5a5" }}
                onClick={() => {
                  setTestTicketInput("ET-INVALID-9999");
                  handleTestVerifyAction("ET-INVALID-9999");
                }}
              >
                <code>ET-INVALID-9999</code> (Test Invalid)
              </button>
            </div>
          </div>

          {/* Manual Input */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>Or Enter Ticket Code / Scan Payload:</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. ET-TKT-9001 or booking reference"
                value={testTicketInput}
                onChange={(e) => setTestTicketInput(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: "#059669", borderColor: "#059669" }}
                onClick={() => handleTestVerifyAction()}
                disabled={isVerifying}
              >
                <QrCode size={16} /> Verify
              </button>
            </div>
          </div>

          {/* Verification Result Banner */}
          {verificationResult && (
            <div
              style={{
                borderRadius: "10px",
                padding: "1rem",
                border: "1px solid",
                borderColor:
                  verificationResult.status === "VALID"
                    ? "#10b981"
                    : verificationResult.status === "ALREADY_USED"
                    ? "#f59e0b"
                    : "#ef4444",
                background:
                  verificationResult.status === "VALID"
                    ? "rgba(16, 185, 129, 0.08)"
                    : verificationResult.status === "ALREADY_USED"
                    ? "rgba(245, 158, 11, 0.08)"
                    : "rgba(239, 68, 68, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    padding: "0.25rem 0.65rem",
                    borderRadius: "6px",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    color: "#ffffff",
                    background:
                      verificationResult.status === "VALID"
                        ? "#10b981"
                        : verificationResult.status === "ALREADY_USED"
                        ? "#f59e0b"
                        : "#ef4444",
                  }}
                >
                  {verificationResult.status}
                </span>
                <strong style={{ fontSize: "0.95rem" }}>{verificationResult.message}</strong>
              </div>

              {verificationResult.ticket && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.75rem", fontSize: "0.82rem", background: "var(--bg-card, #ffffff)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                  <div><strong>Passenger:</strong> {verificationResult.ticket.passengerName}</div>
                  <div><strong>Seat Number:</strong> Seat #{verificationResult.ticket.seatNumber}</div>
                  <div><strong>Trip Code:</strong> {verificationResult.ticket.tripCode}</div>
                  <div><strong>Ticket Code:</strong> <code>{verificationResult.ticket.ticketNumber}</code></div>
                  <div><strong>Route:</strong> {verificationResult.ticket.departureStation} → {verificationResult.ticket.arrivalStation}</div>
                  <div><strong>Boarding Status:</strong> <span style={{ color: "#10b981", fontWeight: 700 }}>BOARDED / CLEARED</span></div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminTicketsPage;
