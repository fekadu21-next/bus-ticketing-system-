import React from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { CreditCard, ShieldCheck } from "lucide-react";

export const ManagerPaymentsPage = () => {
  const { payments, selectedOrgId } = useApp();

  const orgPayments = payments.filter((p) => p.organizationId === selectedOrgId);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Company Payment Receipts</h1>
          <p>Transaction records processed via Telebirr and Chapa for your company bookings.</p>
        </div>
      </div>

      <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "0.82rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <ShieldCheck size={18} />
        <span>🔒 <strong>Manager Security Policy:</strong> Operational Managers monitor payment webhook results. Manual override marking payments as paid is prohibited.</span>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div className="card-title">
            <h3>Payment Transactions Log</h3>
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
              <th>Amount</th>
              <th>Status</th>
              <th>Paid Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {orgPayments.map((p) => (
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
                <td><strong>{p.amount} ETB</strong></td>
                <td><Badge status={p.status} /></td>
                <td>{p.paidAt || "Pending"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
