import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  Building2,
  CalendarDays,
  Ticket,
  CreditCard,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Users,
  RefreshCw,
  Search,
  Calendar,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Eye,
  AlertTriangle,
  Clock,
  Bus,
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

  const [dateFilter, setDateFilter] = useState("ALL"); // ALL, THIS_YEAR, THIS_MONTH, THIS_WEEK, TODAY, CUSTOM
  const [customDate, setCustomDate] = useState("");
  const [operatorSearch, setOperatorSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tripSearch, setTripSearch] = useState("");
  const [tripStatusFilter, setTripStatusFilter] = useState("ALL");
  const [tripPage, setTripPage] = useState(1);
  const tripPageSize = 10;

  // Modals state
  const [selectedOrgModal, setSelectedOrgModal] = useState(null);
  const [selectedTripModal, setSelectedTripModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

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

  // Upcoming Trips Computation - strictly upcoming scheduled departures
  const filteredUpcomingTrips = useMemo(() => {
    const q = tripSearch.toLowerCase().trim();
    const now = new Date();
    return scopedTrips
      .filter((t) => {
        // Exclude completed, cancelled, departed trips
        if (t.status === "COMPLETED" || t.status === "CANCELLED") return false;

        // Use actual scheduled departure date and time to verify it is upcoming
        const depDate = t.departureDate || (t.departure_time ? t.departure_time.split("T")[0] : "");
        const depTime = t.departureTime || "00:00";
        const depDateTime = new Date(`${depDate} ${depTime}`);
        if (!isNaN(depDateTime.getTime()) && depDateTime < now && !isTodayDate(depDate)) {
          return false;
        }

        const matchesStatus = tripStatusFilter === "ALL" || t.status === tripStatusFilter;
        const matchesDate = matchesDateFilter(depDate || t.departure_time);
        const matchesSearch =
          !q ||
          (t.tripCode || "").toLowerCase().includes(q) ||
          (t.organizationName || "").toLowerCase().includes(q) ||
          (t.routeName || "").toLowerCase().includes(q) ||
          (t.originStation || "").toLowerCase().includes(q) ||
          (t.destinationStation || "").toLowerCase().includes(q) ||
          (t.busPlateNumber || "").toLowerCase().includes(q) ||
          (t.driverName || "").toLowerCase().includes(q);
        return matchesStatus && matchesDate && matchesSearch;
      })
      .sort((a, b) => {
        const depA = new Date(`${a.departureDate || a.departure_time || ""} ${a.departureTime || "00:00"}`).getTime();
        const depB = new Date(`${b.departureDate || b.departure_time || ""} ${b.departureTime || "00:00"}`).getTime();
        return depA - depB;
      });
  }, [scopedTrips, tripSearch, tripStatusFilter, dateFilter, customDate]);

  const totalTripPages = Math.ceil(filteredUpcomingTrips.length / tripPageSize) || 1;
  const paginatedUpcomingTrips = React.useMemo(() => {
    return filteredUpcomingTrips.slice((tripPage - 1) * tripPageSize, tripPage * tripPageSize);
  }, [filteredUpcomingTrips, tripPage, tripPageSize]);

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
          subtitle={isSingleOrg ? `${selectedOrg.type} • Status: ${selectedOrg.status}` : `${activeOrgs} active operators`}
          onClick={() => handleNavigate("organizations")}
        />
        <StatCard
          title="Organizations Awaiting Approval"
          value={pendingOrgsCount}
          icon={ShieldAlert}
          subtitle={pendingOrgsCount > 0 ? "Requires administrative review" : "All operators verified & active"}
          onClick={() => handleNavigate("organizations")}
        />
        <StatCard
          title="Upcoming Departures"
          value={filteredUpcomingTrips.length}
          icon={CalendarDays}
          subtitle="Scheduled upcoming platform trips"
          onClick={() => handleNavigate("trips")}
        />
        <StatCard
          title={isSingleOrg ? "Operator Staff" : "Platform Users"}
          value={scopedUsers.length}
          icon={Users}
          subtitle={isSingleOrg ? `Affiliated staff & personnel` : `${scopedUsers.filter((u) => u.status === "ACTIVE" || u.isActive).length} active accounts`}
          onClick={() => handleNavigate("users")}
        />
        <StatCard
          title={isFiltered ? `Bookings (${dateFilterLabel})` : "Total Bookings"}
          value={displayBookingsCount}
          icon={Ticket}
          subtitle={isFiltered ? `Bookings within ${dateFilterLabel.toLowerCase()}` : (isSingleOrg ? `Bookings on ${selectedOrg.name}` : `${todayBookingsCount} created today`)}
          onClick={() => handleNavigate("bookings")}
        />
      </div>

      {/* Organizations Awaiting Approval Dedicated Section */}
      <div className="card-table-wrapper" style={{ borderLeft: pendingOrgs.length > 0 ? "4px solid #f59e0b" : "4px solid #10b981", marginBottom: "1.5rem" }}>
        <div className="card-header-toolbar" style={{ background: pendingOrgs.length > 0 ? "rgba(245, 158, 11, 0.08)" : "rgba(16, 185, 129, 0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div className="card-title">
            <h3 style={{ color: pendingOrgs.length > 0 ? "#b45309" : "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, fontSize: "1rem", fontWeight: 700 }}>
              {pendingOrgs.length > 0 ? <ShieldAlert size={18} color="#f59e0b" /> : <Building2 size={18} color="#10b981" />}
              Organizations Awaiting Approval ({pendingOrgs.length})
            </h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => handleNavigate("organizations")} title="View all organizations in catalog">
            View All Organizations <ArrowRight size={13} />
          </button>
        </div>

        {pendingOrgs.length === 0 ? (
          <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
            <CheckCircle2 size={36} color="#10b981" style={{ margin: "0 auto 0.5rem", display: "block" }} />
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)" }}>All Organizations Approved</div>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
              All registered transport operators have been reviewed and approved. New registrations will appear here for administrative verification.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "900px" }}>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Type</th>
                  <th>Reg. Ref</th>
                  <th>Contact Person</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                    <td>
                      <div>{org.contactName}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{org.phone}</div>
                    </td>
                    <td>{org.createdAt}</td>
                    <td>
                      <Badge status={org.status} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedOrgModal(org)}
                          title="View registration and licensing details"
                        >
                          <Eye size={13} /> Details
                        </button>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => approveOrganization(org.id)}
                          title="Approve operator registration"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setSelectedOrgModal(org);
                            setShowRejectInput(true);
                          }}
                          title="Reject operator registration"
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
      </div>

      {/* Upcoming Platform Trips Section */}
      <div className="card-table-wrapper" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CalendarDays size={18} color="var(--primary)" /> Upcoming Platform Trips & Scheduled Departures
            </h3>
            <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Upcoming intercity schedules sorted by earliest departure time. Completed and cancelled trips are excluded.
              {isFiltered && <span style={{ marginLeft: "0.4rem", fontWeight: 700, color: "var(--primary)" }}>Filtered by: {dateFilterLabel}</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <div className="header-search" style={{ width: "230px" }}>
              <Search className="search-icon" size={14} />
              <input
                type="text"
                placeholder="Search route, code, bus..."
                value={tripSearch}
                onChange={(e) => {
                  setTripSearch(e.target.value);
                  setTripPage(1);
                }}
              />
            </div>
            <select
              className="org-selector-select"
              value={tripStatusFilter}
              onChange={(e) => {
                setTripStatusFilter(e.target.value);
                setTripPage(1);
              }}
              style={{ fontSize: "0.8rem", padding: "5px 10px" }}
              title="Filter by upcoming trip status"
            >
              <option value="ALL">All Upcoming Statuses</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="DRAFT">DRAFT</option>
            </select>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleNavigate("trips")}
              title="View Complete Trips Schedule"
            >
              View All Trips <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: "1050px" }}>
            <thead>
              <tr>
                <th>Trip Code</th>
                <th>Operator</th>
                <th>Route Corridor</th>
                <th>Scheduled Departure</th>
                <th>Vehicle & Driver</th>
                <th>Occupancy (Seats)</th>
                <th>Fare (ETB)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUpcomingTrips.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No upcoming trips found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedUpcomingTrips.map((trp) => {
                  const booked = Number(trp.bookedSeatsCount || 0);
                  const total = Number(trp.totalSeats || 45);
                  const occPct = Math.round((booked / total) * 100);
                  return (
                    <tr key={trp.id}>
                      <td>
                        <code>{trp.tripCode}</code>
                      </td>
                      <td>
                        <strong>{trp.organizationName}</strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{trp.routeName}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          {trp.originStation} ➔ {trp.destinationStation}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{trp.departureDate}</div>
                        <div style={{ fontSize: "0.74rem", color: "var(--primary)", fontWeight: 700 }}>
                          {trp.departureTime}
                          {trp.arrivalTime && <span style={{ color: "var(--text-muted)", fontWeight: 500 }}> (ETA {trp.arrivalTime})</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{trp.busPlateNumber || "Plate Pending"}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          Driver: {trp.driverName || "Unassigned"}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontWeight: 700 }}>{booked}</span>
                          <span style={{ color: "var(--text-muted)" }}>/ {total}</span>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: occPct >= 80 ? "#10b981" : "var(--text-muted)" }}>
                            ({occPct}%)
                          </span>
                        </div>
                        <div style={{ width: "85px", height: "4px", background: "rgba(100, 116, 139, 0.2)", borderRadius: "99px", marginTop: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(occPct, 100)}%`, height: "100%", background: occPct >= 80 ? "#10b981" : "var(--primary)" }} />
                        </div>
                      </td>
                      <td>
                        <strong>{Number(trp.fareAmount || 0).toLocaleString()} ETB</strong>
                      </td>
                      <td>
                        <Badge status={trp.status} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedTripModal(trp)}
                          title="Inspect trip schedule, vehicle, and seat occupancy"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Showing <strong>{paginatedUpcomingTrips.length}</strong> of <strong>{filteredUpcomingTrips.length}</strong> upcoming trips
          </div>
          <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={tripPage <= 1}
              onClick={() => setTripPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span style={{ fontSize: "0.78rem", padding: "0 0.5rem", fontWeight: 600 }}>
              Page {tripPage} of {totalTripPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={tripPage >= totalTripPages}
              onClick={() => setTripPage((p) => Math.min(totalTripPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Organization Details Modal */}
      {selectedOrgModal && (
        <Modal
          isOpen={Boolean(selectedOrgModal)}
          onClose={() => {
            setSelectedOrgModal(null);
            setShowRejectInput(false);
            setRejectReason("");
          }}
          title={`Operator Details: ${selectedOrgModal.name}`}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "0.5rem" }}>
              <div>
                {selectedOrgModal.status === "PENDING" && (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => {
                        approveOrganization(selectedOrgModal.id);
                        setSelectedOrgModal(null);
                      }}
                    >
                      Approve Organization
                    </button>
                    {!showRejectInput ? (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => setShowRejectInput(true)}
                      >
                        Reject...
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedOrgModal(null);
                  setShowRejectInput(false);
                  setRejectReason("");
                }}
              >
                Close
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>{selectedOrgModal.name}</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{selectedOrgModal.type}</span>
              </div>
              <Badge status={selectedOrgModal.status} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ background: "var(--bg-main, #f8fafc)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Registration Ref</span>
                <div style={{ fontWeight: 600, marginTop: "2px" }}><code>{selectedOrgModal.registrationNumber}</code></div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Submission Date</span>
                <div style={{ fontWeight: 600, marginTop: "2px" }}>{selectedOrgModal.createdAt}</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Contact Representative</span>
                <div style={{ fontWeight: 600, marginTop: "2px" }}>{selectedOrgModal.contactName}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{selectedOrgModal.phone}</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Official Email & Location</span>
                <div style={{ fontWeight: 600, marginTop: "2px" }}>{selectedOrgModal.email}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{selectedOrgModal.address}</div>
              </div>
            </div>

            {selectedOrgModal.notes && (
              <div style={{ background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 700 }}>Verification / Documentation Notes</span>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>{selectedOrgModal.notes}</p>
              </div>
            )}

            {showRejectInput && selectedOrgModal.status === "PENDING" && (
              <div style={{ background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "0.75rem", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                  <AlertTriangle size={14} /> Specify Reason for Rejection
                </span>
                <textarea
                  rows={2}
                  style={{ width: "100%", marginTop: "6px", padding: "6px 8px", fontSize: "0.82rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                  placeholder="e.g. Incomplete commercial transport licensing documentation..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "6px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setShowRejectInput(false);
                      setRejectReason("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      rejectOrganization(selectedOrgModal.id, rejectReason || "Documentation non-compliant");
                      setSelectedOrgModal(null);
                      setShowRejectInput(false);
                      setRejectReason("");
                    }}
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Trip Details Modal */}
      {selectedTripModal && (
        <Modal
          isOpen={Boolean(selectedTripModal)}
          onClose={() => setSelectedTripModal(null)}
          title={`Upcoming Trip: ${selectedTripModal.tripCode}`}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSelectedTripModal(null);
                  handleNavigate("trips");
                }}
              >
                Open in Trips & Schedules <ArrowRight size={13} />
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedTripModal(null)}
              >
                Close
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>{selectedTripModal.tripCode}</h3>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{selectedTripModal.routeName}</span>
              </div>
              <Badge status={selectedTripModal.status} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ background: "var(--bg-main, #f8fafc)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Transport Operator</span>
                <div style={{ fontWeight: 600, marginTop: "2px" }}>{selectedTripModal.organizationName}</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Route Corridor</span>
                <div style={{ fontWeight: 600, marginTop: "2px" }}>{selectedTripModal.originStation} ➔ {selectedTripModal.destinationStation}</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Scheduled Departure</span>
                <div style={{ fontWeight: 700, color: "var(--primary)", marginTop: "2px" }}>{selectedTripModal.departureDate} at {selectedTripModal.departureTime}</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Vehicle & Driver</span>
                <div style={{ fontWeight: 600, marginTop: "2px" }}>{selectedTripModal.busPlateNumber || "Plate Pending"}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Driver: {selectedTripModal.driverName || "Unassigned"}</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Seat Occupancy</span>
                <div style={{ fontWeight: 700, marginTop: "2px" }}>{selectedTripModal.bookedSeatsCount || 0} / {selectedTripModal.totalSeats || 50} Booked</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Passenger Fare</span>
                <div style={{ fontWeight: 700, marginTop: "2px" }}>{Number(selectedTripModal.fareAmount || 0).toLocaleString()} ETB</div>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
export default AdminDashboardPage;
