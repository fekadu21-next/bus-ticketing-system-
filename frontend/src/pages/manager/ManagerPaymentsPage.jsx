import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { CreditCard, ShieldCheck, Search, RefreshCw, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";

export const ManagerPaymentsPage = () => {
  const {
    payments,
    selectedOrgId,
    coordinatorStats,
    settings,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateFilter, setDateFilter] = useState("ALL"); // ALL, TODAY, CUSTOM
  const [customDate, setCustomDate] = useState("");

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, dateFilter, customDate]);

  const commissionPercent = Number(settings?.platformFeePercent ?? 5.0);
  const commissionRate = commissionPercent / 100;
  const todayStr = new Date().toISOString().split("T")[0];

  const isTodayDate = (dateVal) => {
    if (!dateVal) return false;
    if (typeof dateVal === "string" && dateVal.includes(todayStr)) return true;
    const d = new Date(dateVal);
    return !isNaN(d.getTime()) && d.toISOString().split("T")[0] === todayStr;
  };

  const matchesDateFilter = (dateVal) => {
    if (dateFilter === "ALL") return true;
    if (dateFilter === "TODAY") return isTodayDate(dateVal);
    if (dateFilter === "CUSTOM" && customDate) {
      if (typeof dateVal === "string" && dateVal.includes(customDate)) return true;
      const d = new Date(dateVal);
      return !isNaN(d.getTime()) && d.toISOString().split("T")[0] === customDate;
    }
    return true;
  };

  const orgPayments = payments.filter((p) => p.organizationId === selectedOrgId || p.organization_id === selectedOrgId);
  const completedOrgPayments = orgPayments.filter((p) => p.status === "SUCCESS" || p.status === "COMPLETED");

  const totalGross = coordinatorStats?.payments?.totalRevenue && coordinatorStats?.payments?.totalRevenue > 0
    ? coordinatorStats.payments.totalRevenue
    : completedOrgPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const totalNetRevenue = totalGross * (1 - commissionRate);
  const totalCommissionPaid = totalGross * commissionRate;

  const todayPayments = completedOrgPayments.filter((p) => isTodayDate(p.createdAt || p.created_at || p.paidAt));
  const todayGross = coordinatorStats?.today?.revenue && coordinatorStats?.today?.revenue > 0
    ? coordinatorStats.today.revenue
    : todayPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const todayNetRevenue = todayGross * (1 - commissionRate);

  const filteredPayments = orgPayments.filter((p) => {
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    const matchesDate = matchesDateFilter(p.createdAt || p.created_at || p.paidAt);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (p.transactionReference && p.transactionReference.toLowerCase().includes(q)) ||
      (p.passengerName && p.passengerName.toLowerCase().includes(q)) ||
      (p.paymentReference && p.paymentReference.toLowerCase().includes(q));
    return matchesStatus && matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const filteredCompleted = filteredPayments.filter((p) => p.status === "SUCCESS" || p.status === "COMPLETED");
  const filteredGross = filteredCompleted.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const filteredNet = filteredGross * (1 - commissionRate);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Company Payment Receipts & Revenue</h1>
          <p>Verified passenger transactions, operator earnings, and platform commission ({commissionPercent}%).</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchCoordinatorData(selectedOrgId)}
          disabled={isLoadingData}
        >
          <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Financial & Net Revenue Cards */}
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard
          title="Total Gross Payments"
          value={`${Math.round(totalGross).toLocaleString()} ETB`}
          icon={CreditCard}
          subtitle={`${completedOrgPayments.length} paid company tickets`}
        />
        <StatCard
          title="Net Company Revenue"
          value={`${Math.round(totalNetRevenue).toLocaleString()} ETB`}
          icon={DollarSign}
          trend={`${(100 - commissionPercent).toFixed(1)}% Share`}
          subtitle={`Net earnings after ${commissionPercent}% fee`}
        />
        <StatCard
          title="Today's Gross Payments"
          value={`${Math.round(todayGross).toLocaleString()} ETB`}
          icon={Calendar}
          subtitle={`${todayPayments.length} transactions today`}
        />
        <StatCard
          title="Today's Net Revenue"
          value={`${Math.round(todayNetRevenue).toLocaleString()} ETB`}
          icon={TrendingUp}
          trend={`Daily Net`}
          subtitle={`Take-home revenue today`}
        />
      </div>

      <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "0.82rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <ShieldCheck size={18} />
        <span>🔒 <strong>Manager Security Policy:</strong> Operational Managers monitor payment webhook results. Platform commission fee of <strong>{commissionPercent}%</strong> is automatically settled per transaction.</span>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <div className="header-search" style={{ width: "220px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search transaction ref, passenger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Quick Date Filters */}
            <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "2px 4px" }}>
              <button
                type="button"
                className={`btn btn-sm ${dateFilter === "ALL" ? "btn-primary" : "btn-secondary"}`}
                style={{ border: "none", fontSize: "0.75rem", padding: "3px 8px" }}
                onClick={() => { setDateFilter("ALL"); setCustomDate(""); }}
              >
                All Dates
              </button>
              <button
                type="button"
                className={`btn btn-sm ${dateFilter === "TODAY" ? "btn-primary" : "btn-secondary"}`}
                style={{ border: "none", fontSize: "0.75rem", padding: "3px 8px" }}
                onClick={() => { setDateFilter("TODAY"); setCustomDate(todayStr); }}
              >
                Today
              </button>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateFilter(e.target.value ? "CUSTOM" : "ALL");
                }}
                style={{ fontSize: "0.75rem", padding: "2px 6px", border: "1px solid #cbd5e1", borderRadius: "4px" }}
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
            Filtered Net Revenue: <strong style={{ color: "var(--primary)", fontSize: "0.95rem" }}>{Math.round(filteredNet).toLocaleString()} ETB</strong> (Gross: {Math.round(filteredGross).toLocaleString()} ETB)
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <CreditCard size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>No transaction records matching your filter.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "800px" }}>
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
              {paginatedPayments.map((p) => {
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
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPayments.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          itemLabel="payments"
        />
      </div>
    </div>
  );
};

export default ManagerPaymentsPage;
