import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { CreditCard, Search, ShieldCheck } from "lucide-react";

export const AdminPaymentsPage = () => {
  const { payments, organizations } = useApp();
  const [filterProvider, setFilterProvider] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPayments = payments.filter((p) => {
    const matchesProv = filterProvider === "ALL" || p.provider === filterProvider;
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    const matchesSearch =
      p.transactionReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bookingReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.passengerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProv && matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Payments & Transactions</h1>
          <p>Audit log of payment transactions across providers.</p>
        </div>
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
            </select>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="PENDING">PENDING</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="FAILED">FAILED</option>
            </select>
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
            {filteredPayments.map((p) => (
              <tr key={p.id}>
                <td><code>{p.paymentReference}</code></td>
                <td>
                  <span style={{ fontWeight: 700, color: p.provider === "TELEBIRR" ? "#0284c7" : "#7c3aed" }}>
                    {p.provider}
                  </span>
                </td>
                <td><code>{p.transactionReference}</code></td>
                <td><code>{p.bookingReference}</code></td>
                <td>{p.passengerName}</td>
                <td>{p.organizationName}</td>
                <td><strong>{p.amount} ETB</strong></td>
                <td><Badge status={p.status} /></td>
                <td>{p.paidAt || "Pending Callback"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
