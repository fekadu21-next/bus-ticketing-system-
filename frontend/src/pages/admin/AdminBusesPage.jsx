import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Bus, Search, RefreshCw } from "lucide-react";

export const AdminBusesPage = () => {
  const { buses, organizations, isLoadingData, fetchAdminData } = useApp();
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBuses = buses.filter((b) => {
    const matchesOrg = filterOrg === "ALL" || b.organizationId === filterOrg;
    const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (b.plateNumber || "").toLowerCase().includes(q) ||
      (b.busNumber || "").toLowerCase().includes(q) ||
      (b.model || "").toLowerCase().includes(q) ||
      (b.organizationName || "").toLowerCase().includes(q);
    return matchesOrg && matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Buses Monitor</h1>
          <p>Platform-wide visibility into fleet vehicles registered by all operating companies.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchAdminData()}
          title="Refresh Fleet"
        >
          <RefreshCw size={14} className={isLoadingData ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div className="header-search" style={{ width: "240px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search plate or bus #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
            >
              <option value="ALL">All Organizations</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Fleet Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing <strong>{filteredBuses.length}</strong> of <strong>{buses.length}</strong> buses
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Bus #</th>
              <th>Plate Number</th>
              <th>Operator Company</th>
              <th>Vehicle Model</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Last Maintenance</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingData && buses.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "2.5rem" }}>
                  <LoadingSpinner label="Loading fleet monitor..." />
                </td>
              </tr>
            ) : filteredBuses.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                  No buses found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredBuses.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Bus size={14} color="var(--primary)" /> {b.busNumber}
                    </strong>
                  </td>
                  <td><code>{b.plateNumber}</code></td>
                  <td>{b.organizationName}</td>
                  <td>{b.model}</td>
                  <td><span style={{ fontWeight: 700 }}>{b.capacity} Seats</span></td>
                  <td><Badge status={b.status} /></td>
                  <td>{b.lastMaintenance}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
