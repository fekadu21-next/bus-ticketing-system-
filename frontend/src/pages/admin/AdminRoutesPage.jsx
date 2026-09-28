import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Route as RouteIcon, Search, RefreshCw } from "lucide-react";

export const AdminRoutesPage = () => {
  const { routes, isLoadingData, fetchAdminData } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const filteredRoutes = routes.filter((r) => {
    const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (r.name || "").toLowerCase().includes(q) ||
      (r.originStationName || "").toLowerCase().includes(q) ||
      (r.destinationStationName || "").toLowerCase().includes(q) ||
      (r.organizationName || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Routes Registry</h1>
          <p>Monitor standardized intercity origin and destination route pairs across Ethiopia.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchAdminData()}
          title="Refresh Routes"
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
                placeholder="Search route corridor, origin, dest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Route Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Showing <strong>{filteredRoutes.length}</strong> of <strong>{routes.length}</strong> corridors
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Route Name</th>
              <th>Origin Terminal</th>
              <th>Destination Terminal</th>
              <th>Distance</th>
              <th>Est. Duration</th>
              <th>Assigned Operator</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingData && routes.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "2.5rem" }}>
                  <LoadingSpinner label="Loading route corridors..." />
                </td>
              </tr>
            ) : filteredRoutes.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                  No route corridors found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredRoutes.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <RouteIcon size={14} color="var(--primary)" /> {r.name}
                    </strong>
                  </td>
                  <td>{r.originStationName}</td>
                  <td>{r.destinationStationName}</td>
                  <td><strong>{r.distanceKm} km</strong></td>
                  <td>{r.estimatedDuration}</td>
                  <td><span style={{ fontWeight: 600 }}>{r.organizationName || `${r.assignedOrganizationsCount} Operators`}</span></td>
                  <td><Badge status={r.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
