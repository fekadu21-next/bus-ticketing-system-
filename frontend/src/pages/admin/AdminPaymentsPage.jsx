import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { CreditCard, Search, RefreshCw, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";

export const AdminPaymentsPage = () => {
  const { payments, organizations, settings, isLoadingData, fetchAdminData } = useApp();
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [filterProvider, setFilterProvider] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("ALL"); // ALL, TODAY, CUSTOM
  const [customDate, setCustomDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterOrg, filterProvider, filterStatus, searchQuery, dateFilter, customDate]);

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

  // Scope payments by selected organization
  const orgScopedPayments = payments.filter((p) => {
    if (filterOrg === "ALL") return true;
    return (
      p.organizationId === filterOrg ||
      p.organization_id === filterOrg ||
      (organizations.find((o) => o.id === filterOrg)?.name &&
        p.organizationName?.toLowerCase() === organizations.find((o) => o.id === filterOrg)?.name?.toLowerCase())
    );
  });

  // Calculations scoped to organization filter
  const successfulPayments = orgScopedPayments.filter((p) => p.status === "SUCCESS" || p.status === "COMPLETED");
  const allTimeGross = successfulPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const allTimePlatformRev = allTimeGross * commissionRate;

  const todayPayments = successfulPayments.filter((p) => isTodayDate(p.createdAt || p.created_at || p.paidAt));
  const todayGross = todayPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const todayPlatformRev = todayGross * commissionRate;

  // Filtered payments (including date, provider, status, search)
  const filteredPayments = orgScopedPayments.filter((p) => {
    const prov = (p.provider || p.paymentMethod || "").toUpperCase();
    const matchesProv = filterProvider === "ALL" || prov === filterProvider;
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    const matchesDate = matchesDateFilter(p.createdAt || p.created_at || p.paidAt);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (p.transactionReference || "").toLowerCase().includes(q) ||
      (p.bookingReference || "").toLowerCase().includes(q) ||
      (p.paymentReference || "").toLowerCase().includes(q) ||
      (p.passengerName || "").toLowerCase().includes(q) ||
      (p.organizationName || "").toLowerCase().includes(q);
    return matchesProv && matchesStatus && matchesSearch && matchesDate;
  });

  const filteredSuccessful = filteredPayments.filter((p) => p.status === "SUCCESS" || p.status === "COMPLETED");
  const filteredGross = filteredSuccessful.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const filteredPlatformRev = filteredGross * commissionRate;

  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Payments & Platform Revenue</h1>
          <p>Audit log of payment transactions across gateways, gross volume, and platform commission ({commissionPercent}%).</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchAdminData()}
          title="Refresh Payments"
        >
          <RefreshCw size={14} className={isLoadingData ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Financial & Revenue Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard
          title="Total Booking Payments"
          value={`${Math.round(allTimeGross).toLocaleString()} ETB`}
          icon={CreditCard}
          subtitle={`${successfulPayments.length} verified transactions`}
        />
        <StatCard
          title="Platform Commission Revenue"
          value={`${Math.round(allTimePlatformRev).toLocaleString()} ETB`}
          icon={DollarSign}
          trend={`${commissionPercent}% Fee`}
          subtitle={`Platform commission revenue`}
        />
        <StatCard
          title="Today's Booking Payments"
          value={`${Math.round(todayGross).toLocaleString()} ETB`}
          icon={Calendar}
          subtitle={`${todayPayments.length} payments today`}
        />
        <StatCard
          title="Today's Platform Revenue"
          value={`${Math.round(todayPlatformRev).toLocaleString()} ETB`}
          icon={TrendingUp}
          trend={`Daily ${commissionPercent}%`}
          subtitle={`Commission earned today`}
        />
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <div className="header-search" style={{ width: "220px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search tx, booking, passenger..."
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

            {/* Filter by Organization */}
            <select
              className="org-selector-select"
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
              title="Filter payments by operator company"
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
            Showing <strong>{filteredPayments.length}</strong> tx | Filtered Revenue: <strong style={{ color: "var(--primary)" }}>{Math.round(filteredPlatformRev).toLocaleString()} ETB</strong>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: "1000px" }}>
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
              paginatedPayments.map((p) => (
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPayments.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="payments"
        />
      </div>
    </div>
  );
};
