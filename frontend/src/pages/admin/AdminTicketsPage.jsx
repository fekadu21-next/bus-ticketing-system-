import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { QrCode, Search, Eye, ShieldCheck, RefreshCw, Building2 } from "lucide-react";

export const AdminTicketsPage = () => {
  const { tickets = [], verifications = [], organizations = [], isLoadingData, fetchAdminData } = useApp();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [activeTab, setActiveTab] = useState("TICKETS");

  const filteredTickets = tickets.filter((t) => {
    const matchesOrg =
      filterOrg === "ALL" ||
      t.organizationId === filterOrg ||
      (organizations.find((o) => o.id === filterOrg)?.name &&
        t.organizationName?.toLowerCase() === organizations.find((o) => o.id === filterOrg)?.name?.toLowerCase());

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (t.ticketNumber || "").toLowerCase().includes(q) ||
      (t.passengerName || "").toLowerCase().includes(q) ||
      (t.qrToken || "").toLowerCase().includes(q) ||
      (t.organizationName || "").toLowerCase().includes(q);

    return matchesOrg && matchesSearch;
  });

  const filteredVerifications = verifications.filter((v) => {
    const matchesOrg =
      filterOrg === "ALL" ||
      v.organizationId === filterOrg ||
      (organizations.find((o) => o.id === filterOrg)?.name &&
        v.organizationName?.toLowerCase() === organizations.find((o) => o.id === filterOrg)?.name?.toLowerCase());

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (v.ticketNumber || "").toLowerCase().includes(q) ||
      (v.passengerName || "").toLowerCase().includes(q) ||
      (v.verifierName || "").toLowerCase().includes(q) ||
      (v.stationName || "").toLowerCase().includes(q);

    return matchesOrg && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Tickets & QR Verification Inspector</h1>
          <p>Monitor digital ticket issuance and live QR code verification scans conducted by terminal staff.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchAdminData && fetchAdminData()}
          title="Refresh Tickets"
        >
          <RefreshCw size={14} className={isLoadingData ? "spin" : ""} /> Refresh
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
                filteredTickets.map((t) => (
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
                    <td><Badge status={t.status} /></td>
                    <td>{t.issuedAt}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedTicket(t)}
                        title="Inspect QR Code"
                      >
                        <Eye size={13} /> View QR
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                <th>Scan ID</th>
                <th>Ticket #</th>
                <th>Passenger</th>
                <th>Verifier Staff</th>
                <th>Terminal Station</th>
                <th>Scan Result</th>
                <th>Scanned Timestamp</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredVerifications.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No QR scan verification events recorded matching your filter.
                  </td>
                </tr>
              ) : (
                filteredVerifications.map((v) => (
                  <tr key={v.id}>
                    <td><code>{v.id}</code></td>
                    <td><code>{v.ticketNumber}</code></td>
                    <td>{v.passengerName}</td>
                    <td>{v.verifierName}</td>
                    <td>{v.stationName}</td>
                    <td><Badge status={v.status} /></td>
                    <td>{v.scannedAt}</td>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{v.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Code Modal Preview */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Digital Ticket: ${selectedTicket?.ticketNumber}`}
        footer={
          <button className="btn btn-secondary" onClick={() => setSelectedTicket(null)}>
            Close
          </button>
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

            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{selectedTicket.passengerName}</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              {selectedTicket.routeName} | Seat <strong>{selectedTicket.seatNumber}</strong>
            </p>
            <Badge status={selectedTicket.status} />

            <div
              style={{
                background: "#f8fafc",
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
                <span style={{ color: "var(--text-muted)" }}>Assigned Bus:</span>
                <code>{selectedTicket.busPlateNumber}</code>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Departure Time:</span>
                <strong>{selectedTicket.departureDate} at {selectedTicket.departureTime}</strong>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTicketsPage;
