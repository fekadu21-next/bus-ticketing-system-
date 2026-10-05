import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { CreditCard, Search, RefreshCw } from "lucide-react";

export const AdminPaymentsPage = () => {
  const { payments, organizations, isLoadingData, fetchAdminData } = useApp();
  const [filterProvider, setFilterProvider] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPayments = payments.filter((p) => {
    const prov = (p.provider || p.paymentMethod || "").toUpperCase();
    const matchesProv = filterProvider === "ALL" || prov === filterProvider;
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (p.transactionReference || "").toLowerCase().includes(q) ||
      (p.bookingReference || "").toLowerCase().includes(q) ||
      (p.paymentReference || "").toLowerCase().includes(q) ||
      (p.passengerName || "").toLowerCase().includes(q) ||
      (p.organizationName || "").toLowerCase().includes(q);
    return matchesProv && matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Payments & Transactions</h1>
          <p>Audit log of payment transactions across providers and platform commissions.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchAdminData()}
          title="Refresh Payments"
        >
          <RefreshCw size={14} className={isLoadingData ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div className="header-search" style={{ width: "260px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search transaction ref, booking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
            >
              <option value="ALL">All Payment Providers</option>
              <option value="TELEBIRR">TELEBIRR</option>
              <option value="CHAPA">CHAPA</option>
              <option value="CBE">CBE BIRR</option>
            </select>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="PENDING">PENDING</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing <strong>{filteredPayments.length}</strong> of <strong>{payments.length}</strong> transactions
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Provider</th>
              <th>Tx Reference</th>
              <th>Booking Ref</th>
              <th>Passenger</th>
              <th>Operator</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Paid Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingData && payments.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "2.5rem" }}>
                  <LoadingSpinner label="Loading payment transactions..." />
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                  No payment transactions found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id}>
                  <td><code>{p.paymentReference || `PAY-${p.id.slice(0, 8).toUpperCase()}`}</code></td>
                  <td>
                    <span style={{ fontWeight: 700, color: (p.provider || "").includes("TELEBIRR") ? "#0284c7" : "#7c3aed" }}>
                      {p.provider || p.paymentMethod || "TELEBIRR"}
                    </span>
                  </td>
                  <td><code>{p.transactionReference}</code></td>
                  <td><code>{p.bookingReference}</code></td>
                  <td>{p.passengerName}</td>
                  <td>{p.organizationName}</td>
                  <td><strong>{p.amount} {p.currency || "ETB"}</strong></td>
                  <td><Badge status={p.status} /></td>
                  <td>{p.paidAt || p.createdAt || "Pending Callback"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
