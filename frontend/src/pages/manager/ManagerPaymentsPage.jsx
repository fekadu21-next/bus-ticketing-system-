import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { CreditCard, ShieldCheck, Search, RefreshCw } from "lucide-react";

export const ManagerPaymentsPage = () => {
  const {
    payments,
    selectedOrgId,
    coordinatorStats,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const orgPayments = payments.filter((p) => p.organizationId === selectedOrgId);
  const filteredPayments = orgPayments.filter((p) => {
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (p.transactionReference && p.transactionReference.toLowerCase().includes(q)) ||
      (p.passengerName && p.passengerName.toLowerCase().includes(q)) ||
      (p.paymentReference && p.paymentReference.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const totalRevenue = coordinatorStats?.payments?.totalRevenue ?? orgPayments
    .filter((p) => p.status === "SUCCESS" || p.status === "COMPLETED")
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Company Payment Receipts</h1>
          <p>Transaction records processed via Telebirr, CBE Birr, and digital gateways for your company bookings.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchCoordinatorData(selectedOrgId)}
          disabled={isLoadingData}
        >
          <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "0.82rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <ShieldCheck size={18} />
        <span>🔒 <strong>Manager Security Policy:</strong> Operational Managers monitor payment webhook results. Manual override marking payments as paid is prohibited by platform RBAC.</span>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div className="header-search" style={{ width: "260px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search transaction ref, passenger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All States</option>
              <option value="SUCCESS">SUCCESS / COMPLETED</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Total Verified Revenue: <strong style={{ color: "var(--primary)", fontSize: "1rem" }}>{totalRevenue.toLocaleString()} ETB</strong>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <CreditCard size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>No transaction records matching your filter.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tx Reference</th>
                <th>Provider / Method</th>
                <th>Booking Ref</th>
                <th>Passenger</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => {
                const method = p.paymentMethod || p.provider || "Telebirr";
                return (
                  <tr key={p.id}>
                    <td><code>{p.transactionReference || p.paymentReference || `TX-${p.id.slice(0, 8)}`}</code></td>
                    <td>
                      <span style={{ fontWeight: 700, color: method.toUpperCase().includes("TELEBIRR") ? "#0284c7" : "#7c3aed" }}>
                        {method}
                      </span>
                    </td>
                    <td><code>{p.bookingReference || "Direct"}</code></td>
                    <td><strong>{p.passengerName || "Passenger"}</strong></td>
                    <td><strong>{p.amount || 0} ETB</strong></td>
                    <td><Badge status={p.status === "COMPLETED" ? "SUCCESS" : p.status} /></td>
                    <td>{p.paidAt || p.createdAt || "Pending"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManagerPaymentsPage;
