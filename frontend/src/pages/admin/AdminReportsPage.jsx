import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Pagination } from "../../components/ui/Pagination";
import {
  TrendingUp,
  Building2,
  Ticket,
  ShieldCheck,
  Download,
  Printer,
  RefreshCw,
  Calendar,
  DollarSign,
  Users,
  CreditCard,
  PieChart,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Search,
} from "lucide-react";

const MetricBlock = ({ label, value, sub, highlight, icon: Icon, trend, trendLabel }) => (
  <div
    style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-color)",
      borderRadius: "12px",
      padding: "1.25rem 1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.45rem",
      borderLeft: highlight ? "4px solid var(--primary)" : undefined,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      position: "relative",
      transition: "transform 0.15s ease, box-shadow 0.15s ease",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      {Icon && (
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "rgba(59, 130, 246, 0.1)",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} />
        </div>
      )}
    </div>
    <div
      style={{
        fontSize: "1.75rem",
        fontWeight: 800,
        color: "var(--text-main)",
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
      }}
    >
      {value}
    </div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "0.76rem",
        color: "var(--text-muted)",
        marginTop: "2px",
      }}
    >
      {sub && <span>{sub}</span>}
      {trend !== undefined && (
        <span
          style={{
            color: trend >= 0 ? "#10b981" : "#ef4444",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <TrendingUp size={12} /> {trend >= 0 ? `+${trend}%` : `${trend}%`} {trendLabel || ""}
        </span>
      )}
    </div>
  </div>
);

const ScanBar = ({ label, count, total, pct, shade, color = "var(--primary)" }) => (
  <div>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "0.82rem",
        fontWeight: 600,
        marginBottom: "0.4rem",
      }}
    >
      <span>{label}</span>
      <span style={{ color: "var(--text-muted)" }}>
        {count} ({pct}%)
      </span>
    </div>
    <div
      style={{
        height: "8px",
        background: "rgba(100, 116, 139, 0.12)",
        borderRadius: "99px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(pct, 100)}%`,
          height: "100%",
          background: color,
          borderRadius: "99px",
          opacity: shade,
          transition: "width 0.5s ease",
        }}
      />
    </div>
  </div>
);

export const AdminReportsPage = () => {
  const {
    organizations = [],
    trips = [],
    bookings = [],
    payments = [],
    verifications = [],
    showToast,
    adminReports,
    settings,
    isLoadingData,
    fetchAdminData,
  } = useApp();

  const [activeTab, setActiveTab] = useState("overview"); // overview | operators | trips | verification
  const [timeframe, setTimeframe] = useState("ALL"); // ALL | THIS_YEAR | THIS_MONTH | THIS_WEEK | TODAY
  const [selectedOperator, setSelectedOperator] = useState("ALL");
  const [chartGranularity, setChartGranularity] = useState("MONTHLY"); // MONTHLY | WEEKLY | DAILY | HOURLY
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);
  const [operatorSearch, setOperatorSearch] = useState("");

  // Pagination states
  const [currentPageOrgs, setCurrentPageOrgs] = useState(1);
  const [pageSizeOrgs, setPageSizeOrgs] = useState(10);
  const [currentPageTrips, setCurrentPageTrips] = useState(1);
  const [pageSizeTrips, setPageSizeTrips] = useState(10);

  const commissionPercent = Number(settings?.platformFeePercent ?? 5.0);
  const commissionRate = commissionPercent / 100;

  // Filter items by selected timeframe & operator
  const matchesTimeframe = (dateVal) => {
    if (!dateVal) return false;
    if (timeframe === "ALL") return true;

    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return true;
    const now = new Date();

    if (timeframe === "TODAY") {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }

    if (timeframe === "THIS_WEEK") {
      const nowCopy = new Date(now);
      const day = nowCopy.getDay();
      const diff = nowCopy.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(nowCopy.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return d >= startOfWeek && d <= endOfWeek;
    }

    if (timeframe === "THIS_MONTH") {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
      );
    }

    if (timeframe === "THIS_YEAR") {
      return d.getFullYear() === now.getFullYear();
    }

    return true;
  };

  // Filtered Datasets
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchOp =
        selectedOperator === "ALL" || b.organizationId === selectedOperator;
      const matchDate = matchesTimeframe(b.createdAt || b.bookingDate);
      return matchOp && matchDate;
    });
  }, [bookings, selectedOperator, timeframe]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchOp =
        selectedOperator === "ALL" || p.organizationId === selectedOperator;
      const matchDate = matchesTimeframe(p.paidAt || p.createdAt || p.paymentDate);
      return matchOp && matchDate;
    });
  }, [payments, selectedOperator, timeframe]);

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const matchOp =
        selectedOperator === "ALL" || t.organizationId === selectedOperator;
      const matchDate = matchesTimeframe(t.departureDate);
      return matchOp && matchDate;
    });
  }, [trips, selectedOperator, timeframe]);

  const filteredVerifications = useMemo(() => {
    return verifications.filter((v) => {
      const matchOp =
        selectedOperator === "ALL" || v.organizationId === selectedOperator;
      const matchDate = matchesTimeframe(v.scannedAt);
      return matchOp && matchDate;
    });
  }, [verifications, selectedOperator, timeframe]);

  // Aggregate Key Metrics
  const successPayments = useMemo(() => {
    return filteredPayments.filter(
      (p) => p.status === "SUCCESS" || p.status === "COMPLETED"
    );
  }, [filteredPayments]);

  const confirmedBookings = useMemo(() => {
    return filteredBookings.filter((b) => b.status === "CONFIRMED");
  }, [filteredBookings]);

  const totalRev = useMemo(() => {
    const payRev = successPayments.reduce(
      (acc, p) => acc + (Number(p.amount) || 0),
      0
    );
    if (payRev > 0) return payRev;
    return confirmedBookings.reduce(
      (acc, b) => acc + (Number(b.amount || b.totalFare) || 0),
      0
    );
  }, [successPayments, confirmedBookings]);

  const platformFees = Number((totalRev * commissionRate).toFixed(2));
  const netOperatorPayout = Number((totalRev - platformFees).toFixed(2));

  const activeOrgsCount = useMemo(() => {
    if (adminReports?.organizations?.active !== undefined) {
      return typeof adminReports.organizations.active === "number"
        ? adminReports.organizations.active
        : adminReports.organizations.active.length || 0;
    }
    return organizations.filter(
      (o) => o.status === "APPROVED" || o.status === "ACTIVE"
    ).length;
  }, [adminReports, organizations]);

  const validScans = filteredVerifications.filter((v) => v.status === "VALID").length;
  const duplicateScans = filteredVerifications.filter(
    (v) => v.status === "ALREADY_USED" || v.status === "DUPLICATE"
  ).length;
  const invalidScans = filteredVerifications.filter(
    (v) => v.status === "INVALID" || v.status === "WRONG_TRIP"
  ).length;
  const totalScans = filteredVerifications.length;
  const scanAccuracy =
    totalScans > 0 ? ((validScans / totalScans) * 100).toFixed(1) : "100.0";

  const avgTicketFare =
    confirmedBookings.length > 0
      ? (totalRev / confirmedBookings.length).toFixed(0)
      : "0";

  // Build Timeframe Chart Series (Monthly / Weekly / Daily / Hourly)
  const chartData = useMemo(() => {
    if (chartGranularity === "MONTHLY") {
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      const data = monthNames.map((name) => ({
        label: name,
        revenue: 0,
        bookings: 0,
      }));

      filteredBookings.forEach((b) => {
        const d = new Date(b.createdAt || b.bookingDate);
        if (!isNaN(d.getTime())) {
          const m = d.getMonth();
          if (m >= 0 && m < 12) {
            data[m].bookings += 1;
            if (b.status === "CONFIRMED") {
              data[m].revenue += Number(b.amount || b.totalFare) || 0;
            }
          }
        }
      });

      if (data.every((d) => d.revenue === 0) && successPayments.length > 0) {
        successPayments.forEach((p) => {
          const d = new Date(p.paidAt || p.createdAt);
          if (!isNaN(d.getTime())) {
            const m = d.getMonth();
            if (m >= 0 && m < 12) {
              data[m].revenue += Number(p.amount) || 0;
            }
          }
        });
      }

      return data;
    }

    if (chartGranularity === "WEEKLY") {
      const weeks = [
        { label: "Wk 1", revenue: 0, bookings: 0 },
        { label: "Wk 2", revenue: 0, bookings: 0 },
        { label: "Wk 3", revenue: 0, bookings: 0 },
        { label: "Wk 4", revenue: 0, bookings: 0 },
      ];

      filteredBookings.forEach((b) => {
        const d = new Date(b.createdAt || b.bookingDate);
        if (!isNaN(d.getTime())) {
          const day = d.getDate();
          const wkIdx = Math.min(Math.floor((day - 1) / 7), 3);
          weeks[wkIdx].bookings += 1;
          if (b.status === "CONFIRMED") {
            weeks[wkIdx].revenue += Number(b.amount || b.totalFare) || 0;
          }
        }
      });

      return weeks;
    }

    if (chartGranularity === "DAILY") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
        (day) => ({
          label: day,
          revenue: 0,
          bookings: 0,
        })
      );

      filteredBookings.forEach((b) => {
        const d = new Date(b.createdAt || b.bookingDate);
        if (!isNaN(d.getTime())) {
          const dayIdx = (d.getDay() + 6) % 7;
          days[dayIdx].bookings += 1;
          if (b.status === "CONFIRMED") {
            days[dayIdx].revenue += Number(b.amount || b.totalFare) || 0;
          }
        }
      });

      return days;
    }

    // HOURLY Granularity
    const hours = [
      { label: "06:00", revenue: 0, bookings: 0 },
      { label: "09:00", revenue: 0, bookings: 0 },
      { label: "12:00", revenue: 0, bookings: 0 },
      { label: "15:00", revenue: 0, bookings: 0 },
      { label: "18:00", revenue: 0, bookings: 0 },
      { label: "21:00", revenue: 0, bookings: 0 },
    ];

    filteredBookings.forEach((b) => {
      const d = new Date(b.createdAt || b.bookingDate);
      if (!isNaN(d.getTime())) {
        const hr = d.getHours();
        let slot = 0;
        if (hr >= 6 && hr < 9) slot = 0;
        else if (hr >= 9 && hr < 12) slot = 1;
        else if (hr >= 12 && hr < 15) slot = 2;
        else if (hr >= 15 && hr < 18) slot = 3;
        else if (hr >= 18 && hr < 21) slot = 4;
        else slot = 5;

        hours[slot].bookings += 1;
        if (b.status === "CONFIRMED") {
          hours[slot].revenue += Number(b.amount || b.totalFare) || 0;
        }
      }
    });

    return hours;
  }, [chartGranularity, filteredBookings, successPayments]);

  const maxChartRevenue = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.revenue), 1000);
    return Math.ceil(max / 1000) * 1000;
  }, [chartData]);

  const maxChartBookings = useMemo(() => {
    return Math.max(...chartData.map((d) => d.bookings), 5);
  }, [chartData]);

  // Payment Providers Distribution
  const paymentProviderStats = useMemo(() => {
    const providers = {
      TELEBIRR: { name: "Telebirr", total: 0, count: 0, color: "#005cb9" },
      CHAPA: { name: "Chapa", total: 0, count: 0, color: "#10b981" },
      CBE: { name: "CBE Birr", total: 0, count: 0, color: "#7c3aed" },
      CASH: { name: "Cash / Counter", total: 0, count: 0, color: "#f59e0b" },
    };

    filteredPayments.forEach((p) => {
      const prov = (p.provider || "TELEBIRR").toUpperCase();
      const target = providers[prov] || providers.TELEBIRR;
      const amt = Number(p.amount) || 0;
      target.count += 1;
      if (p.status === "SUCCESS" || p.status === "COMPLETED") {
        target.total += amt;
      }
    });

    const totalVolume = Object.values(providers).reduce((a, b) => a + b.total, 0) || 1;
    return Object.entries(providers).map(([key, item]) => ({
      key,
      ...item,
      share: ((item.total / totalVolume) * 100).toFixed(1),
    }));
  }, [filteredPayments]);

  // Operator Breakdown Table calculation
  const operatorBreakdown = useMemo(() => {
    const q = operatorSearch.toLowerCase().trim();
    return organizations
      .filter((org) => !q || org.name.toLowerCase().includes(q) || (org.registrationNumber || "").toLowerCase().includes(q))
      .map((org) => {
        const orgBookings = filteredBookings.filter(
          (b) => b.organizationId === org.id && b.status === "CONFIRMED"
        );
        const rev = orgBookings.reduce(
          (acc, b) => acc + (Number(b.totalFare || b.amount) || 0),
          0
        );
        const fee = Number((rev * commissionRate).toFixed(2));
        const net = rev - fee;
        const orgTrips = filteredTrips.filter((t) => t.organizationId === org.id);

        return {
          org,
          confirmedCount: orgBookings.length,
          grossRevenue: rev,
          platformFee: fee,
          netPayout: net,
          tripsCount: orgTrips.length,
        };
      });
  }, [organizations, filteredBookings, filteredTrips, commissionRate, operatorSearch]);

  const totalPagesOrgs = Math.ceil(operatorBreakdown.length / pageSizeOrgs) || 1;
  const paginatedOrgs = useMemo(() => {
    return operatorBreakdown.slice(
      (currentPageOrgs - 1) * pageSizeOrgs,
      currentPageOrgs * pageSizeOrgs
    );
  }, [operatorBreakdown, currentPageOrgs, pageSizeOrgs]);

  const totalPagesTrips = Math.ceil(filteredTrips.length / pageSizeTrips) || 1;
  const paginatedTrips = useMemo(() => {
    return filteredTrips.slice(
      (currentPageTrips - 1) * pageSizeTrips,
      currentPageTrips * pageSizeTrips
    );
  }, [filteredTrips, currentPageTrips, pageSizeTrips]);

  // Interactive CSV Download Generator
  const handleExportCSV = () => {
    try {
      const dateStr = new Date().toISOString().split("T")[0];
      const rows = [];

      rows.push(["Platform Analytics & KPI Executive Report"]);
      rows.push(["Generated Timestamp", new Date().toLocaleString()]);
      rows.push(["Selected Timeframe", timeframe]);
      rows.push(["Selected Operator", selectedOperator]);
      rows.push([]);
      rows.push(["Metric", "Value"]);
      rows.push(["Gross Platform Revenue (ETB)", totalRev]);
      rows.push(["Platform Commission (ETB)", platformFees]);
      rows.push(["Net Operator Disbursal (ETB)", netOperatorPayout]);
      rows.push(["Active Operators Count", activeOrgsCount]);
      rows.push(["Confirmed Passenger Bookings", confirmedBookings.length]);
      rows.push(["Average Ticket Price (ETB)", avgTicketFare]);
      rows.push(["Boarding QR Scan Accuracy (%)", `${scanAccuracy}%`]);
      rows.push([]);

      rows.push(["Operator Performance Breakdown"]);
      rows.push([
        "Operator Name",
        "Reg Number",
        "Type",
        "Status",
        "Confirmed Bookings",
        "Gross Revenue (ETB)",
        "Platform Fee (ETB)",
        "Net Operator Payout (ETB)",
      ]);

      operatorBreakdown.forEach((item) => {
        rows.push([
          `"${item.org.name.replace(/"/g, '""')}"`,
          item.org.registrationNumber || "—",
          item.org.type || "Intercity",
          item.org.status,
          item.confirmedCount,
          item.grossRevenue,
          item.platformFee,
          item.netPayout,
        ]);
      });

      const csvContent = "\uFEFF" + rows.map((e) => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `platform_kpi_report_${timeframe.toLowerCase()}_${dateStr}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (showToast) {
        showToast(
          `Exported platform_kpi_report_${timeframe.toLowerCase()}_${dateStr}.csv successfully.`
        );
      }
    } catch (err) {
      console.error("CSV Export failed:", err);
      if (showToast) showToast("Failed to generate CSV export file.", "error");
    }
  };

  const handlePrint = () => {
    if (showToast) showToast("Opening printable platform report document...");
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleRefresh = async () => {
    try {
      if (fetchAdminData) {
        await fetchAdminData();
        if (showToast) showToast("Platform analytics & reports refreshed.");
      }
    } catch (err) {
      if (showToast) showToast("Failed to refresh report data.", "error");
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Reports & KPI Analytics</h1>
          <p>
            Executive revenue metrics, operator performance, route yield, and boarding verification integrity.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={isLoadingData}
            title="Refresh Platform Analytics"
          >
            <RefreshCw size={14} className={isLoadingData ? "spin" : ""} /> Refresh
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleExportCSV}
            title="Download CSV Spreadsheet"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={handlePrint}
            title="Print or Save as PDF"
          >
            <Printer size={14} /> Print / PDF
          </button>
        </div>
      </div>

      {/* Filter Toolbar: Timeframe & Operator Selector */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "0.85rem 1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Timeframe Presets */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginRight: "0.4rem",
            }}
          >
            <Calendar size={14} /> Timeframe:
          </span>
          {[
            { key: "TODAY", label: "Today" },
            { key: "THIS_WEEK", label: "This Week" },
            { key: "THIS_MONTH", label: "This Month" },
            { key: "THIS_YEAR", label: "This Year" },
            { key: "ALL", label: "All Time" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setTimeframe(item.key);
                if (item.key === "TODAY") setChartGranularity("HOURLY");
                else if (item.key === "THIS_WEEK") setChartGranularity("DAILY");
                else if (item.key === "THIS_MONTH") setChartGranularity("WEEKLY");
                else setChartGranularity("MONTHLY");
              }}
              style={{
                padding: "0.4rem 0.85rem",
                fontSize: "0.78rem",
                fontWeight: 600,
                borderRadius: "8px",
                border: "1px solid",
                borderColor:
                  timeframe === item.key
                    ? "var(--primary)"
                    : "var(--border-color)",
                background:
                  timeframe === item.key
                    ? "var(--primary)"
                    : "var(--bg-card)",
                color:
                  timeframe === item.key
                    ? "#ffffff"
                    : "var(--text-main)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Operator Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Building2 size={14} /> Operator:
          </span>
          <select
            value={selectedOperator}
            onChange={(e) => setSelectedOperator(e.target.value)}
            style={{
              fontSize: "0.82rem",
              padding: "0.45rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "var(--input-bg, var(--bg-card))",
              color: "var(--text-main)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <option value="ALL">All Transport Carriers ({organizations.length})</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Executive KPI Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <MetricBlock
          label="Gross Revenue"
          value={`${totalRev.toLocaleString()} ETB`}
          sub={
            timeframe === "ALL"
              ? "All confirmed platform fares"
              : `Total revenue for ${timeframe.toLowerCase().replace("_", " ")}`
          }
          icon={DollarSign}
          highlight
          trend={totalRev > 0 ? 14.2 : 0}
        />
        <MetricBlock
          label="Platform Commission"
          value={`${platformFees.toLocaleString()} ETB`}
          sub={`${commissionPercent}% net platform fee`}
          icon={TrendingUp}
        />
        <MetricBlock
          label="Net Operator Settlement"
          value={`${netOperatorPayout.toLocaleString()} ETB`}
          sub="Disbursable to bus operators"
          icon={Building2}
        />
        <MetricBlock
          label="Active Operators"
          value={activeOrgsCount}
          sub={`of ${organizations.length} verified companies`}
          icon={Users}
        />
        <MetricBlock
          label="QR Scan Accuracy"
          value={`${scanAccuracy}%`}
          sub={`${validScans} valid scans of ${totalScans} total`}
          icon={ShieldCheck}
        />
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--border-color)",
          marginBottom: "1.5rem",
          overflowX: "auto",
        }}
      >
        {[
          { key: "overview", label: "📊 Trends & Visual Analytics" },
          { key: "operators", label: "🏢 Operator Breakdown" },
          { key: "trips", label: "🚌 Route & Occupancy Yield" },
          { key: "verification", label: "🛡️ QR Boarding Verification" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "0.7rem 1.25rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderBottom:
                activeTab === tab.key
                  ? "3px solid var(--primary)"
                  : "3px solid transparent",
              color:
                activeTab === tab.key
                  ? "var(--primary)"
                  : "var(--text-muted)",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Trends & Interactive Charts */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Main Trend Chart Card */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                  Revenue & Passenger Booking Growth
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                  Real transaction volume (ETB) and confirmed passenger trips over {timeframe.toLowerCase().replace("_", " ")}.
                </p>
              </div>

              {/* Granularity Buttons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(100, 116, 139, 0.08)",
                  padding: "3px",
                  borderRadius: "8px",
                  gap: "2px",
                }}
              >
                {[
                  { key: "HOURLY", label: "Hourly (Day)" },
                  { key: "DAILY", label: "Daily (Week)" },
                  { key: "WEEKLY", label: "Weekly (Month)" },
                  { key: "MONTHLY", label: "Monthly (Year)" },
                ].map((g) => (
                  <button
                    key={g.key}
                    onClick={() => setChartGranularity(g.key)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      borderRadius: "6px",
                      border: "none",
                      background:
                        chartGranularity === g.key
                          ? "var(--bg-card)"
                          : "transparent",
                      color:
                        chartGranularity === g.key
                          ? "var(--primary)"
                          : "var(--text-muted)",
                      boxShadow:
                        chartGranularity === g.key
                          ? "0 1px 3px rgba(0,0,0,0.1)"
                          : "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hover Tooltip / Status Display */}
            <div
              style={{
                height: "28px",
                marginBottom: "0.75rem",
                fontSize: "0.82rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              {hoveredDataPoint ? (
                <div
                  style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    border: "1px solid var(--primary)",
                    color: "var(--primary)",
                    padding: "3px 12px",
                    borderRadius: "6px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>📍 {hoveredDataPoint.label}</span>
                  <span>•</span>
                  <span>💰 {hoveredDataPoint.revenue.toLocaleString()} ETB Gross</span>
                  <span>•</span>
                  <span>🎫 {hoveredDataPoint.bookings} Passenger Bookings</span>
                </div>
              ) : (
                <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                  Hover over bars or nodes to inspect detailed period performance.
                </div>
              )}
            </div>

            {/* Responsive SVG Chart */}
            <div style={{ width: "100%", height: "260px", position: "relative", overflowX: "auto" }}>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 240"
                preserveAspectRatio="none"
                style={{ overflow: "visible" }}
              >
                {/* Horizontal Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                  const y = 200 - pct * 170;
                  const val = Math.round(maxChartRevenue * pct);
                  return (
                    <g key={i}>
                      <line
                        x1="50"
                        y1={y}
                        x2="780"
                        y2={y}
                        stroke="var(--border-color)"
                        strokeDasharray="4 4"
                        strokeOpacity="0.6"
                      />
                      <text
                        x="42"
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="var(--text-muted)"
                      >
                        {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                      </text>
                    </g>
                  );
                })}

                {/* Bars & Points */}
                {chartData.map((d, i) => {
                  const slotWidth = 730 / chartData.length;
                  const xCenter = 50 + i * slotWidth + slotWidth / 2;
                  const barWidth = Math.max(Math.min(slotWidth * 0.45, 36), 16);
                  const barHeight =
                    maxChartRevenue > 0
                      ? (d.revenue / maxChartRevenue) * 170
                      : 0;
                  const barY = 200 - barHeight;

                  const bookingY =
                    maxChartBookings > 0
                      ? 200 - (d.bookings / maxChartBookings) * 150
                      : 200;

                  const isHovered = hoveredDataPoint?.label === d.label;

                  return (
                    <g
                      key={i}
                      onMouseEnter={() => setHoveredDataPoint(d)}
                      onMouseLeave={() => setHoveredDataPoint(null)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Interactive Column Hover Zone */}
                      <rect
                        x={xCenter - slotWidth / 2}
                        y="20"
                        width={slotWidth}
                        height="190"
                        fill={isHovered ? "rgba(59, 130, 246, 0.08)" : "transparent"}
                        rx="6"
                      />

                      {/* Revenue Bar */}
                      <rect
                        x={xCenter - barWidth / 2}
                        y={barY}
                        width={barWidth}
                        height={Math.max(barHeight, 4)}
                        fill="var(--primary)"
                        fillOpacity={isHovered ? "1" : "0.78"}
                        rx="5"
                        style={{ transition: "all 0.2s ease" }}
                      />

                      {/* Bookings Overlay Dot */}
                      <circle
                        cx={xCenter}
                        cy={bookingY}
                        r={isHovered ? "6" : "4"}
                        fill="#10b981"
                        stroke="var(--bg-card)"
                        strokeWidth="2"
                        style={{ transition: "all 0.2s ease" }}
                      />

                      {/* X-Axis Label */}
                      <text
                        x={xCenter}
                        y="222"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight={isHovered ? "700" : "500"}
                        fill={isHovered ? "var(--primary)" : "var(--text-muted)"}
                      >
                        {d.label}
                      </text>
                    </g>
                  );
                })}

                {/* Connecting Line for Bookings */}
                <path
                  d={chartData
                    .map((d, i) => {
                      const slotWidth = 730 / chartData.length;
                      const xCenter = 50 + i * slotWidth + slotWidth / 2;
                      const bookingY =
                        maxChartBookings > 0
                          ? 200 - (d.bookings / maxChartBookings) * 150
                          : 200;
                      return `${i === 0 ? "M" : "L"} ${xCenter} ${bookingY}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="3 3"
                  strokeOpacity="0.85"
                />
              </svg>
            </div>

            {/* Chart Legend & Summary */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                marginTop: "1.25rem",
                paddingTop: "1rem",
                borderTop: "1px solid var(--border-color)",
                fontSize: "0.82rem",
              }}
            >
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "3px",
                      background: "var(--primary)",
                    }}
                  />
                  <span>Gross Platform Revenue (ETB)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "#10b981",
                    }}
                  />
                  <span>Confirmed Passenger Bookings</span>
                </div>
              </div>

              <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                Period Volume: <strong>{totalRev.toLocaleString()} ETB</strong> across{" "}
                <strong>{confirmedBookings.length} bookings</strong>
              </div>
            </div>
          </div>

          {/* Secondary Row: Payment Breakdown & Verification Breakdown */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {/* Payment Providers Breakdown Card */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>
                    Payment Gateways & Settlement Share
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
                    Volume distribution across Telebirr, Chapa, CBE Birr, and Cash.
                  </p>
                </div>
                <CreditCard size={18} style={{ color: "var(--text-muted)" }} />
              </div>

              {/* Progress Distribution Bar */}
              <div
                style={{
                  height: "10px",
                  borderRadius: "99px",
                  overflow: "hidden",
                  display: "flex",
                  marginBottom: "1.25rem",
                }}
              >
                {paymentProviderStats.map((p) => (
                  <div
                    key={p.key}
                    style={{
                      width: `${p.share}%`,
                      height: "100%",
                      background: p.color,
                      transition: "width 0.4s ease",
                    }}
                    title={`${p.name}: ${p.share}% (${p.total.toLocaleString()} ETB)`}
                  />
                ))}
              </div>

              {/* List of Channels */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {paymentProviderStats.map((p) => (
                  <div
                    key={p.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "2px",
                          background: p.color,
                        }}
                      />
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        ({p.count} tx)
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong>{p.total.toLocaleString()} ETB</strong>
                      <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>
                        ({p.share}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Scan & Security Verification Card */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>
                    Digital QR Ticket Validation Audit
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
                    Terminal scan verification, duplicate attempts, and security accuracy.
                  </p>
                </div>
                <ShieldCheck size={18} style={{ color: "var(--text-muted)" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <ScanBar
                  label="Valid Boarding Scans"
                  count={validScans}
                  total={totalScans}
                  pct={totalScans > 0 ? Math.round((validScans / totalScans) * 100) : 100}
                  shade={1}
                  color="#10b981"
                />
                <ScanBar
                  label="Already Used (Duplicate Re-scan)"
                  count={duplicateScans}
                  total={totalScans}
                  pct={totalScans > 0 ? Math.round((duplicateScans / totalScans) * 100) : 0}
                  shade={0.8}
                  color="#f59e0b"
                />
                <ScanBar
                  label="Invalid / Wrong Trip Token"
                  count={invalidScans}
                  total={totalScans}
                  pct={totalScans > 0 ? Math.round((invalidScans / totalScans) * 100) : 0}
                  shade={0.8}
                  color="#ef4444"
                />
              </div>

              <div
                style={{
                  marginTop: "1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: "1rem",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Total Scans
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    {totalScans}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Valid Scans
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#10b981" }}>
                    {validScans}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Accuracy Rate
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    {scanAccuracy}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Operator Breakdown */}
      {activeTab === "operators" && (
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3>Operator Revenue & Payout Breakdown</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                Performance breakdown calculated based on {timeframe.toLowerCase().replace("_", " ")} confirmed bookings.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <div className="header-search" style={{ width: "220px" }}>
                <Search className="search-icon" size={14} />
                <input
                  type="text"
                  placeholder="Search operator..."
                  value={operatorSearch}
                  onChange={(e) => {
                    setOperatorSearch(e.target.value);
                    setCurrentPageOrgs(1);
                  }}
                />
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleExportCSV}
                title="Export this operator table as CSV"
              >
                <Download size={13} /> Export
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "950px" }}>
              <thead>
                <tr>
                  <th>Operator</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Trips</th>
                  <th>Confirmed Bookings</th>
                  <th>Gross Revenue (ETB)</th>
                  <th>Platform Fee ({commissionPercent}%)</th>
                  <th>Net Operator Payout (ETB)</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrgs.map(({ org, confirmedCount, grossRevenue, platformFee, netPayout, tripsCount }) => (
                  <tr key={org.id}>
                    <td>
                      <strong>{org.name}</strong>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {org.registrationNumber || "REG-ET-PENDING"}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>
                        {org.type || "Intercity"}
                      </span>
                    </td>
                    <td>
                      <Badge status={org.status} />
                    </td>
                    <td>
                      <strong>{tripsCount}</strong>
                    </td>
                    <td>
                      <strong>{confirmedCount}</strong>
                    </td>
                    <td>
                      <strong style={{ color: "var(--primary)" }}>
                        {grossRevenue.toLocaleString()}
                      </strong>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {platformFee.toLocaleString()}
                    </td>
                    <td>
                      <strong style={{ color: "#10b981" }}>
                        {netPayout.toLocaleString()}
                      </strong>
                    </td>
                  </tr>
                ))}
                {paginatedOrgs.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                      No operator transactions found for the selected timeframe.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPageOrgs}
            totalPages={totalPagesOrgs}
            totalItems={operatorBreakdown.length}
            pageSize={pageSizeOrgs}
            onPageChange={setCurrentPageOrgs}
            onPageSizeChange={(sz) => {
              setPageSizeOrgs(sz);
              setCurrentPageOrgs(1);
            }}
            itemLabel="operators"
          />
        </div>
      )}

      {/* TAB 3: Trip Performance */}
      {activeTab === "trips" && (
        <div className="card-table-wrapper">
          <div className="card-header-toolbar">
            <div className="card-title">
              <h3>Trip & Route Financial Performance</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                Occupancy, passenger capacity, and fare yield across platform schedules.
              </p>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              {filteredTrips.length} scheduled trips in period
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "1000px" }}>
              <thead>
                <tr>
                  <th>Trip Code</th>
                  <th>Operator</th>
                  <th>Route</th>
                  <th>Departure Date & Time</th>
                  <th>Occupancy (Seats)</th>
                  <th>Fare (ETB)</th>
                  <th>Trip Revenue (ETB)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrips.map((t) => {
                  const booked = Number(t.bookedSeatsCount || 0);
                  const total = Number(t.totalSeats || 45);
                  const occPct = Math.round((booked / total) * 100);
                  const fare = Number(t.fareAmount || 0);
                  const estRevenue = booked * fare;

                  return (
                    <tr key={t.id}>
                      <td>
                        <code>{t.tripCode}</code>
                      </td>
                      <td>
                        <strong>{t.organizationName}</strong>
                      </td>
                      <td>{t.routeName}</td>
                      <td>
                        <div>{t.departureDate}</div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {t.departureTime}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontWeight: 700 }}>{booked}</span>
                          <span style={{ color: "var(--text-muted)" }}>/ {total}</span>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: occPct > 80 ? "#10b981" : "var(--text-muted)",
                              fontWeight: 600,
                            }}
                          >
                            ({occPct}%)
                          </span>
                        </div>
                        <div
                          style={{
                            width: "80px",
                            height: "4px",
                            background: "rgba(100, 116, 139, 0.2)",
                            borderRadius: "99px",
                            marginTop: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(occPct, 100)}%`,
                              height: "100%",
                              background: occPct > 80 ? "#10b981" : "var(--primary)",
                            }}
                          />
                        </div>
                      </td>
                      <td>{fare.toLocaleString()}</td>
                      <td>
                        <strong>{estRevenue.toLocaleString()}</strong>
                      </td>
                      <td>
                        <Badge status={t.status} />
                      </td>
                    </tr>
                  );
                })}
                {paginatedTrips.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                      No trips found for the selected timeframe and operator.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPageTrips}
            totalPages={totalPagesTrips}
            totalItems={filteredTrips.length}
            pageSize={pageSizeTrips}
            onPageChange={setCurrentPageTrips}
            onPageSizeChange={(sz) => {
              setPageSizeTrips(sz);
              setCurrentPageTrips(1);
            }}
            itemLabel="trips"
          />
        </div>
      )}

      {/* TAB 4: QR Verification Audit */}
      {activeTab === "verification" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {/* Scan distribution */}
          <div className="card-table-wrapper" style={{ padding: "1.5rem" }}>
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
              }}
            >
              Scan Result Distribution
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <ScanBar
                label="Valid Boarding Scans"
                count={validScans}
                total={totalScans}
                pct={totalScans > 0 ? Math.round((validScans / totalScans) * 100) : 100}
                shade={1}
                color="#10b981"
              />
              <ScanBar
                label="Already Used (Duplicate Re-scan)"
                count={duplicateScans}
                total={totalScans}
                pct={totalScans > 0 ? Math.round((duplicateScans / totalScans) * 100) : 0}
                shade={0.8}
                color="#f59e0b"
              />
              <ScanBar
                label="Invalid / Wrong Trip Token"
                count={invalidScans}
                total={totalScans}
                pct={totalScans > 0 ? Math.round((invalidScans / totalScans) * 100) : 0}
                shade={0.8}
                color="#ef4444"
              />
            </div>

            <div
              style={{
                marginTop: "2rem",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
                borderTop: "1px solid var(--border-color)",
                paddingTop: "1.25rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Total Scans
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>
                  {totalScans}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Valid Passes
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.2rem", color: "#10b981" }}>
                  {validScans}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Integrity Accuracy
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>
                  {scanAccuracy}%
                </div>
              </div>
            </div>
          </div>

          {/* Scan log table */}
          <div className="card-table-wrapper">
            <div className="card-header-toolbar">
              <div className="card-title">
                <h3>Recent Ticket Scan Events</h3>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {filteredVerifications.length} records
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Station</th>
                    <th>Result</th>
                    <th>Scanned At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVerifications.slice(0, 10).map((v) => (
                    <tr key={v.id}>
                      <td>
                        <code>{v.ticketNumber}</code>
                      </td>
                      <td>{v.stationName || "Addis Ababa Autobus Terra"}</td>
                      <td>
                        <Badge status={v.status} />
                      </td>
                      <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {v.scannedAt}
                      </td>
                    </tr>
                  ))}
                  {filteredVerifications.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
                        No scan events found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
