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
    updateTicketStatus,
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
                        {/* Active Ticket Status Selector */}
                        <select
                          className="status-selector"
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(t.id, e.target.value)}
                          title="Change ticket status"
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "3px 6px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-color, #cbd5e1)",
                            cursor: "pointer",
                            background:
                              isValid
                                ? "rgba(16, 185, 129, 0.12)"
                                : currentStatus === "USED"
                                ? "rgba(59, 130, 246, 0.12)"
                                : "rgba(239, 68, 68, 0.12)",
                            color:
                              isValid
                                ? "#059669"
                                : currentStatus === "USED"
                                ? "#2563eb"
                                : "#dc2626",
                          }}
                        >
                          <option value="VALID">VALID</option>
                          <option value="USED">USED</option>
                          <option value="CANCELLED">CANCELLED</option>
                          <option value="EXPIRED">EXPIRED</option>
                        </select>
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
                          {currentStatus !== "USED" && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleStatusChange(t.id, "USED")}
                              title="Mark as used / boarded"
                            >
                              Mark Used
                            </button>
                          )}
                          {isValid && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleStatusChange(t.id, "CANCELLED")}
                              title="Cancel / invalidate ticket"
                            >
                              Invalidate
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

            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", margin: "0.5rem 0" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>Ticket State:</span>
              <select
                value={selectedTicket.status || "VALID"}
                onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  cursor: "pointer",
                }}
              >
                <option value="VALID">VALID</option>
                <option value="USED">USED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>

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
    </div>
  );
};

export default AdminTicketsPage;
