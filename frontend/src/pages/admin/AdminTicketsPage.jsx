import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { QrCode, Search, Eye, ShieldCheck } from "lucide-react";

export const AdminTicketsPage = () => {
  const { tickets, verifications } = useApp();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("TICKETS");

  const filteredTickets = tickets.filter(
    (t) =>
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.passengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.qrToken.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Tickets & QR Verification Inspector</h1>
          <p>Monitor digital ticket issuance and live QR code verification scans conducted by terminal staff.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          className={`btn ${activeTab === "TICKETS" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("TICKETS")}
        >
          <QrCode size={15} /> Issued Digital Tickets ({tickets.length})
        </button>
        <button
          className={`btn ${activeTab === "LOGS" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("LOGS")}
        >
          <ShieldCheck size={15} /> Live QR Scan Events ({verifications.length})
        </button>
      </div>

      {activeTab === "TICKETS" ? (
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="header-search" style={{ width: "280px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search ticket # or QR token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
              {filteredTickets.map((t) => (
                <tr key={t.id}>
                  <td><code>{t.ticketNumber}</code></td>
                  <td><strong>{t.passengerName}</strong></td>
                  <td>{t.organizationName}</td>
                  <td>{t.tripCode}</td>
                  <td><span style={{ fontWeight: 700 }}>Seat {t.seatNumber}</span></td>
                  <td><code>{t.qrToken}</code></td>
                  <td><Badge status={t.status} /></td>
                  <td>{t.issuedAt}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedTicket(t)}
                    >
                      <Eye size={13} /> View QR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3>Terminal Boarding Scan Log</h3>
              <p>Validation results: VALID, ALREADY_USED, INVALID, WRONG_TRIP</p>
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
              {verifications.map((v) => (
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
              ))}
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
              <div><strong>Operator:</strong> {selectedTicket.organizationName}</div>
              <div><strong>Trip Reference:</strong> {selectedTicket.tripCode}</div>
              <div><strong>Booking Ref:</strong> {selectedTicket.bookingReference}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
