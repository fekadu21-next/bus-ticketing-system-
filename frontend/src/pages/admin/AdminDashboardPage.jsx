import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  Building2,
  CalendarDays,
  Ticket,
  CreditCard,
  QrCode,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Users,
  RefreshCw,
  Search,
  Calendar,
  TrendingUp,
  BarChart3,
  MapPin,
  Route as RouteIcon,
} from "lucide-react";

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const {
    organizations = [],
    users = [],
    trips = [],
    bookings = [],
    payments = [],
    verifications = [],
    adminStats,
    settings,
    setActivePage,
    approveOrganization,
    rejectOrganization,
    isLoadingData,
    fetchAdminData,
    selectedOrgId,
    setSelectedOrgId,
    showToast,
  } = useApp();

  const [dateFilter, setDateFilter] = React.useState("ALL"); // ALL, THIS_YEAR, THIS_MONTH, THIS_WEEK, TODAY, CUSTOM
  const [customDate, setCustomDate] = React.useState("");
  const [operatorSearch, setOperatorSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const commissionPercent = Number(settings?.platformFeePercent ?? 5.0);
  const commissionRate = commissionPercent / 100;

  const todayStr = new Date().toISOString().split("T")[0];

  const matchesDateFilter = (dateVal) => {
    if (!dateVal) return false;
    if (dateFilter === "ALL") return true;

    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return true;
    const now = new Date();

    if (dateFilter === "TODAY") {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }

    if (dateFilter === "THIS_WEEK") {
      const nowCopy = new Date(now);
      const day = nowCopy.getDay();
      // Monday as first day of week
      const diff = nowCopy.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(nowCopy.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return d >= startOfWeek && d <= endOfWeek;
    }

    if (dateFilter === "THIS_MONTH") {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
      );
    }

    if (dateFilter === "THIS_YEAR") {
      return d.getFullYear() === now.getFullYear();
    }

    if (dateFilter === "CUSTOM" && customDate) {
      if (typeof dateVal === "string" && dateVal.includes(customDate)) return true;
      const [cy, cm, cd] = customDate.split("-").map(Number);
      return (
        d.getFullYear() === cy &&
        d.getMonth() + 1 === cm &&
        d.getDate() === cd
      );
    }

    return true;
  };

  const isTodayDate = (dateVal) => {
    if (!dateVal) return false;
    if (typeof dateVal === "string" && dateVal.includes(todayStr)) return true;
    const d = new Date(dateVal);
    return !isNaN(d.getTime()) && d.toISOString().split("T")[0] === todayStr;
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchAdminData();
      if (showToast) showToast("Platform overview records synchronized successfully.");
    } catch (err) {
      if (showToast) showToast("Failed to refresh platform data.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleNavigate = (page) => {
    setActivePage(page);
    navigate(`/admin/${page}`);
  };

  // Extract distinct operator categories from registered organizations
  const operatorCategories = React.useMemo(() => {
    const cats = new Set();
    organizations.forEach((o) => {
      if (o.type) cats.add(o.type);
    });
    return Array.from(cats);
  }, [organizations]);

  // Target organizations based on category filter and selected operator
  const targetOrganizations = organizations.filter((org) => {
    const matchesOrg = !selectedOrgId || selectedOrgId === "ALL" || org.id === selectedOrgId;
    const matchesCat = categoryFilter === "ALL" || org.type === categoryFilter;
    return matchesOrg && matchesCat;
  });

  const selectedOrg = organizations.find((o) => o.id === selectedOrgId);
  const isSingleOrg = Boolean(selectedOrgId && selectedOrgId !== "ALL" && selectedOrg);
  const targetOrgIds = new Set(targetOrganizations.map((o) => o.id));

  // Scoped bookings, payments, trips, and users based on operator/category selection
  const isUnfiltered = (!selectedOrgId || selectedOrgId === "ALL") && categoryFilter === "ALL";

  const scopedPayments = isUnfiltered
    ? payments
    : payments.filter((p) => targetOrgIds.has(p.organizationId || p.organization_id));

  const scopedBookings = isUnfiltered
    ? bookings
    : bookings.filter((b) => targetOrgIds.has(b.organizationId || b.organization_id));

  const scopedTrips = isUnfiltered
    ? trips
    : trips.filter((t) => targetOrgIds.has(t.organizationId || t.organization_id));

  const scopedUsers = isUnfiltered
    ? users
    : users.filter((u) => targetOrgIds.has(u.organizationId));

  const scopedVerifications = isUnfiltered
    ? verifications
    : verifications.filter((v) => targetOrgIds.has(v.organizationId));

  // Base platform counts
  const totalOrgs = isSingleOrg ? 1 : targetOrganizations.length;
  const pendingOrgs = targetOrganizations.filter((o) => o.status === "PENDING");
  const pendingOrgsCount = pendingOrgs.length;
  const activeOrgs = targetOrganizations.filter((o) => o.status === "APPROVED").length;
  const validScans = scopedVerifications.filter((v) => v.status === "VALID").length;

  // Payments & Revenue aggregations
  const completedPayments = scopedPayments.filter((p) => p.status === "SUCCESS" || p.status === "COMPLETED");

  // Filtered payments & bookings according to active date filter
  const filteredCompletedPayments = completedPayments.filter((p) => matchesDateFilter(p.createdAt || p.created_at || p.paidAt));
  const filteredGrossRevenue = filteredCompletedPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const filteredPlatformCommission = filteredGrossRevenue * commissionRate;
  const filteredOperatorPayouts = filteredGrossRevenue * (1 - commissionRate);
  const filteredBookings = scopedBookings.filter((b) => matchesDateFilter(b.bookingDate || b.created_at));
  const filteredTrips = scopedTrips.filter((t) => matchesDateFilter(t.departureDate || t.departure_time || t.departureTime || t.createdAt));

  // Daily (Today) payments & revenue
  const todayPayments = completedPayments.filter((p) => isTodayDate(p.createdAt || p.created_at || p.paidAt));
  const todayGrossRevenue = todayPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const todayPlatformCommission = todayGrossRevenue * commissionRate;
  const todayBookingsCount = scopedBookings.filter((b) => isTodayDate(b.bookingDate || b.created_at)).length;
  const todayTrips = (isUnfiltered && adminStats?.today?.tripsCount !== undefined)
    ? adminStats.today.tripsCount
    : scopedTrips.filter((t) => isTodayDate(t.departureDate || t.departure_time)).length;

  // Display totals based on active date filter
  const isFiltered = dateFilter !== "ALL";
  const displayGrossRevenue = isFiltered ? filteredGrossRevenue : (
    (isUnfiltered && adminStats?.financials?.totalRevenue !== undefined)
      ? adminStats.financials.totalRevenue
      : completedPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  );
  const displayPlatformCommission = displayGrossRevenue * commissionRate;
  const displayOperatorPayouts = displayGrossRevenue * (1 - commissionRate);
  const displayBookingsCount = isFiltered ? filteredBookings.length : scopedBookings.length;
  const displayCompletedCount = isFiltered ? filteredCompletedPayments.length : completedPayments.length;

  const dateFilterLabel = {
    ALL: "All Time",
    THIS_YEAR: "This Year",
    THIS_MONTH: "This Month",
    THIS_WEEK: "This Week",
    TODAY: "Today",
    CUSTOM: customDate ? `Date: ${customDate}` : "Custom Date",
  }[dateFilter] || "All Time";

  // Per-Operator breakdown data
  const operatorBreakdown = targetOrganizations.map((org) => {
    const orgBookings = bookings.filter((b) => b.organizationId === org.id || b.organization_id === org.id);
    const orgFilteredBookings = orgBookings.filter((b) => matchesDateFilter(b.bookingDate || b.created_at));
    const orgTodayBookings = orgBookings.filter((b) => isTodayDate(b.bookingDate || b.created_at));

    const orgPayments = completedPayments.filter((p) => p.organizationId === org.id || p.organization_id === org.id);
    const orgFilteredPayments = orgPayments.filter((p) => matchesDateFilter(p.createdAt || p.created_at || p.paidAt));
    const orgTodayPayments = orgPayments.filter((p) => isTodayDate(p.createdAt || p.created_at || p.paidAt));

    const gross = orgFilteredPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const commission = gross * commissionRate;
    const netPayout = gross * (1 - commissionRate);

    const todayGross = orgTodayPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const todayCommission = todayGross * commissionRate;

    return {
      ...org,
      totalBookings: orgFilteredBookings.length,
      allTimeBookings: orgBookings.length,
      todayBookings: orgTodayBookings.length,
      grossPayments: gross,
      platformCommission: commission,
      netPayout,
      todayGross,
      todayCommission,
    };
  }).filter((org) => {
    if (!operatorSearch) return true;
    return (
      (org.name && org.name.toLowerCase().includes(operatorSearch.toLowerCase())) ||
      (org.type && org.type.toLowerCase().includes(operatorSearch.toLowerCase()))
    );
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Overview</h1>
          <p>
            {isSingleOrg
              ? `Operational metrics and financials for ${selectedOrg.name}.`
              : "Overview of intercity bus operators, trips, bookings, and payments across Ethiopia."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Operator Filter Dropdown */}
          <select
            className="org-selector-select"
            value={selectedOrgId || "ALL"}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            style={{ fontSize: "0.8rem", padding: "6px 10px", minWidth: "160px" }}
            title="Filter dashboard by transport operator"
          >
            <option value="ALL">🏢 All Operators</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>

          {/* Category Filter Dropdown */}
          {operatorCategories.length > 0 && (
            <select
              className="org-selector-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ fontSize: "0.8rem", padding: "6px 10px" }}
              title="Filter by operator category / type"
            >
              <option value="ALL">All Categories</option>
              {operatorCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {/* Date Filter Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Calendar size={15} style={{ color: "var(--text-muted)" }} />
            <select
              className="org-selector-select"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value !== "CUSTOM") setCustomDate("");
              }}
              style={{ fontSize: "0.8rem", padding: "6px 10px", minWidth: "135px", fontWeight: 600 }}
              title="Filter by timeframe"
            >
              <option value="ALL">All Time</option>
              <option value="THIS_YEAR">This Year</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="TODAY">Today</option>
              <option value="CUSTOM">Custom Date</option>
            </select>

            {dateFilter === "CUSTOM" && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                style={{
                  fontSize: "0.75rem",
                  padding: "4px 6px",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  borderRadius: "6px",
                  background: "var(--input-bg, #ffffff)",
                  color: "var(--input-text, #0f172a)",
                }}
              />
            )}
          </div>

          {/* Active Refresh Button */}
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingData}
            title="Refresh Platform State"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <RefreshCw size={14} className={isRefreshing || isLoadingData ? "spin animate-spin" : ""} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>

          {/* Active Report Button */}
          <button
            className="btn btn-secondary"
            onClick={() => handleNavigate("reports")}
            title="Navigate to Reports & Analytics"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <BarChart3 size={14} /> Reports
          </button>
        </div>
      </div>

      {isLoadingData && !adminStats && (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <LoadingSpinner label="Synchronizing platform monitoring data..." />
        </div>
      )}

      {/* Primary Financial & Revenue KPIs */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <TrendingUp size={18} color="var(--primary)" /> Platform Financials & Commission Overview
          </h2>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>Configured Platform Commission: <strong style={{ color: "var(--primary)" }}>{commissionPercent}%</strong></span>
            {isFiltered && (
              <span style={{ background: "rgba(59, 130, 246, 0.12)", color: "var(--primary)", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>
                Filter: {dateFilterLabel}
              </span>
            )}
          </span>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <StatCard
            title={isFiltered ? `Payments (${dateFilterLabel})` : "Total Booking Payments"}
            value={`${Math.round(displayGrossRevenue).toLocaleString()} ETB`}
            icon={CreditCard}
            subtitle={`${displayCompletedCount} completed transactions`}
            onClick={() => handleNavigate("payments")}
          />
          <StatCard
            title={isFiltered ? `Commission (${dateFilterLabel})` : "Platform Commission Revenue"}
            value={`${Math.round(displayPlatformCommission).toLocaleString()} ETB`}
            icon={DollarSign}
            trend={`${commissionPercent}% Fee`}
            subtitle={isFiltered ? `From ${dateFilterLabel.toLowerCase()} volume` : `Earned from all operators`}
            onClick={() => handleNavigate("reports")}
          />
          <StatCard
            title="Today's Booking Payments"
            value={`${Math.round(todayGrossRevenue).toLocaleString()} ETB`}
            icon={CalendarDays}
            subtitle={`${todayPayments.length} payments collected today`}
            onClick={() => handleNavigate("payments")}
          />
          <StatCard
            title="Today's Platform Revenue"
            value={`${Math.round(todayPlatformCommission).toLocaleString()} ETB`}
            icon={TrendingUp}
            trend={`Daily ${commissionPercent}%`}
            subtitle={`Platform fee from today's trips`}
            onClick={() => handleNavigate("reports")}
          />
          <StatCard
            title={isFiltered ? `Operator Payouts (${dateFilterLabel})` : "Total Operator Payouts"}
            value={`${Math.round(displayOperatorPayouts).toLocaleString()} ETB`}
            icon={Building2}
            subtitle={`${(100 - commissionPercent).toFixed(1)}% net share to operators`}
            onClick={() => handleNavigate("organizations")}
          />
        </div>
      </div>

      {/* Operational Counts Grid */}
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard
          title={isSingleOrg ? "Assigned Operator" : (categoryFilter !== "ALL" ? `Operators (${categoryFilter})` : "Total Organizations")}
          value={isSingleOrg ? selectedOrg.name : totalOrgs}
          icon={Building2}
          subtitle={isSingleOrg ? `${selectedOrg.type} • Status: ${selectedOrg.status}` : `${activeOrgs} active, ${pendingOrgsCount} pending`}
          onClick={() => handleNavigate("organizations")}
        />
        <StatCard
          title={isSingleOrg ? "Operator Staff" : "Platform Users"}
          value={scopedUsers.length}
          icon={Users}
          subtitle={isSingleOrg ? `Affiliated staff & personnel` : `${scopedUsers.filter((u) => u.status === "ACTIVE" || u.isActive).length} active accounts`}
          onClick={() => handleNavigate("users")}
        />
        <StatCard
          title="Today's Departures"
          value={todayTrips}
          icon={CalendarDays}
          subtitle={isSingleOrg ? `Scheduled for ${selectedOrg.name}` : "Scheduled operational departures"}
          onClick={() => handleNavigate("trips")}
        />
        <StatCard
          title={isFiltered ? `Bookings (${dateFilterLabel})` : "Total Bookings"}
          value={displayBookingsCount}
          icon={Ticket}
          subtitle={isFiltered ? `Bookings within ${dateFilterLabel.toLowerCase()}` : (isSingleOrg ? `Bookings on ${selectedOrg.name}` : `${todayBookingsCount} created today`)}
          onClick={() => handleNavigate("bookings")}
        />
        <StatCard
          title="Tickets Verified"
          value={validScans}
          icon={QrCode}
          subtitle="QR boarding verification events"
          onClick={() => handleNavigate("tickets")}
        />
      </div>

      {/* Pending Approvals Alert Banner */}
      {pendingOrgs.length > 0 && (
        <div className="card-table-wrapper" style={{ borderLeft: "4px solid var(--warning)", marginBottom: "1.5rem" }}>
          <div className="card-header-toolbar" style={{ background: "var(--warning-bg)" }}>
            <div className="card-title">
              <h3 style={{ color: "var(--warning-text)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShieldAlert size={18} /> Pending Operator Approvals ({pendingOrgs.length})
              </h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => handleNavigate("organizations")}>
              View All in Organizations <ArrowRight size={14} />
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Type</th>
                <th>Reg. Ref</th>
                <th>Contact</th>
                <th>Applied Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrgs.map((org) => (
                <tr key={org.id}>
                  <td>
                    <strong>{org.name}</strong>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{org.address}</div>
                  </td>
                  <td>{org.type}</td>
                  <td><code>{org.registrationNumber}</code></td>
                  <td>{org.contactName} ({org.phone})</td>
                  <td>{org.createdAt}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => approveOrganization(org.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => rejectOrganization(org.id, "Documents non-compliant")}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Operator Revenue & Performance Breakdown */}
      <div className="card-table-wrapper" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Building2 size={18} color="var(--primary)" /> Operator Revenue & Performance Breakdown
            </h3>
            <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Platform gross bookings, commission earnings ({commissionPercent}%), and operator payout shares across all transport companies.
              {isFiltered && <span style={{ marginLeft: "0.4rem", fontWeight: 700, color: "var(--primary)" }}>Filtered by: {dateFilterLabel}</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div className="header-search" style={{ width: "220px" }}>
              <Search className="search-icon" size={14} />
              <input
                type="text"
                placeholder="Search operator..."
                value={operatorSearch}
                onChange={(e) => setOperatorSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: "950px" }}>
            <thead>
              <tr>
                <th>Operator</th>
                <th>Type</th>
                <th>Bookings {isFiltered ? `(${dateFilterLabel})` : "Total"}</th>
                <th>Gross Payments (ETB)</th>
                <th>Platform Commission ({commissionPercent}%)</th>
                <th>Operator Payout ({(100 - commissionPercent).toFixed(1)}%)</th>
                <th>Today's Gross</th>
                <th>Today's Commission</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {operatorBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                    No operators match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                operatorBreakdown.map((op) => (
                  <tr key={op.id}>
                    <td>
                      <strong>{op.name}</strong>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{op.registrationNumber || op.id.slice(0, 8)}</div>
                    </td>
                    <td>{op.type || "Bus Operator"}</td>
                    <td>
                      <strong>{op.totalBookings}</strong>
                      {op.todayBookings > 0 && (
                        <span style={{ marginLeft: "0.35rem", fontSize: "0.72rem", color: "#10b981", fontWeight: 700 }}>
                          (+{op.todayBookings} today)
                        </span>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: "var(--text-main)" }}>
                        {Math.round(op.grossPayments).toLocaleString()} ETB
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: "var(--primary)" }}>
                        {Math.round(op.platformCommission).toLocaleString()} ETB
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: "#10b981" }}>
                        {Math.round(op.netPayout).toLocaleString()} ETB
                      </strong>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {Math.round(op.todayGross).toLocaleString()} ETB
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                        {Math.round(op.todayCommission).toLocaleString()} ETB
                      </span>
                    </td>
                    <td>
                      <Badge status={op.status} />
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleNavigate("organizations")}
                        title="View Operator in Organizations"
                      >
                        View Operator
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {operatorBreakdown.length > 0 && (
              <tfoot>
                <tr style={{ background: "rgba(59, 130, 246, 0.05)", fontWeight: 700 }}>
                  <td colSpan={2}>
                    <strong>Total ({operatorBreakdown.length} Operators)</strong>
                  </td>
                  <td>
                    {operatorBreakdown.reduce((sum, o) => sum + o.totalBookings, 0)}
                  </td>
                  <td>
                    {Math.round(operatorBreakdown.reduce((sum, o) => sum + o.grossPayments, 0)).toLocaleString()} ETB
                  </td>
                  <td style={{ color: "var(--primary)" }}>
                    {Math.round(operatorBreakdown.reduce((sum, o) => sum + o.platformCommission, 0)).toLocaleString()} ETB
                  </td>
                  <td style={{ color: "#10b981" }}>
                    {Math.round(operatorBreakdown.reduce((sum, o) => sum + o.netPayout, 0)).toLocaleString()} ETB
                  </td>
                  <td>
                    {Math.round(operatorBreakdown.reduce((sum, o) => sum + o.todayGross, 0)).toLocaleString()} ETB
                  </td>
                  <td style={{ color: "var(--primary)" }}>
                    {Math.round(operatorBreakdown.reduce((sum, o) => sum + o.todayCommission, 0)).toLocaleString()} ETB
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Grid of Platform Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Today's Operational Trips */}
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3>Today's Platform Trips</h3>
              <p>Active departures scheduled across operators</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => handleNavigate("trips")}>
              View All Trips
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Operator</th>
                <th>Route</th>
                <th>Departure</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {scopedTrips.slice(0, 5).map((trp) => (
                <tr key={trp.id}>
                  <td><strong>{trp.organizationName}</strong></td>
                  <td>{trp.routeName}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{trp.departureDate}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 700 }}>{trp.departureTime}</div>
                  </td>
                  <td><Badge status={trp.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Verification Activity */}
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3>Recent QR Boarding Verifications</h3>
              <p>Live ticket scan events at terminals</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => handleNavigate("tickets")}>
              View Ticket QR Logs
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Terminal</th>
                <th>Result</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {verifications.slice(0, 4).map((vrf) => (
                <tr key={vrf.id}>
                  <td><code>{vrf.ticketNumber}</code></td>
                  <td>{vrf.stationName}</td>
                  <td><Badge status={vrf.status} /></td>
                  <td>{vrf.scannedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboardPage;
