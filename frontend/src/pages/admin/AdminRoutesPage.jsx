import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Route as RouteIcon, Search, RefreshCw, Building2, Eye, Power, MapPin, Clock } from "lucide-react";

export const AdminRoutesPage = () => {
  const { routes = [], organizations = [], updateRouteStatus, isLoadingData, fetchAdminData, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterOrg, filterStatus, searchQuery]);

  const filteredRoutes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return routes.filter((r) => {
      const matchesOrg =
        filterOrg === "ALL" ||
        r.organizationId === filterOrg ||
        (organizations.find((o) => o.id === filterOrg)?.name &&
          r.organizationName?.toLowerCase() === organizations.find((o) => o.id === filterOrg)?.name?.toLowerCase());

      const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;
      const matchesSearch =
        !q ||
        (r.name || "").toLowerCase().includes(q) ||
        (r.originStationName || "").toLowerCase().includes(q) ||
        (r.destinationStationName || "").toLowerCase().includes(q) ||
        (r.organizationName || "").toLowerCase().includes(q);

      return matchesOrg && matchesStatus && matchesSearch;
    });
  }, [routes, organizations, filterOrg, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filteredRoutes.length / pageSize) || 1;
  const paginatedRoutes = useMemo(() => {
    return filteredRoutes.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredRoutes, currentPage, pageSize]);

  const handleManualRefresh = async () => {
    if (!fetchAdminData) return;
    try {
      setIsRefreshing(true);
      await fetchAdminData();
      if (showToast) showToast("Routes registry refreshed successfully.");
    } catch {
      if (showToast) showToast("Failed to refresh routes.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = (routeId, newStatus) => {
    if (updateRouteStatus) {
      updateRouteStatus(routeId, newStatus);
    }
    if (selectedRoute && selectedRoute.id === routeId) {
      setSelectedRoute((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Routes Registry</h1>
          <p>Supervise standardized intercity origin and destination route pairs, corridor distance, and assigned transport companies across Ethiopia.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleManualRefresh}
          disabled={isRefreshing || isLoadingData}
          title="Refresh Routes"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          <RefreshCw size={14} className={isRefreshing || isLoadingData ? "spin animate-spin" : ""} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <div className="header-search" style={{ width: "260px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search route corridor, origin, dest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter by Organization */}
            <select
              className="org-selector-select"
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
              title="Filter corridors by operating company"
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

        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: "950px" }}>
            <thead>
              <tr>
                <th>Route Name</th>
                <th>Origin Terminal</th>
                <th>Destination Terminal</th>
                <th>Distance</th>
                <th>Est. Duration</th>
                <th>Assigned Operator</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData && routes.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem" }}>
                    <LoadingSpinner label="Loading route corridors..." />
                  </td>
                </tr>
              ) : filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No route corridors found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedRoutes.map((r) => {
                  const currentStatus = r.status || "ACTIVE";
                  const isActive = currentStatus === "ACTIVE";
                  return (
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
                      <td>
                        <span style={{ fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Building2 size={13} color="var(--primary)" />
                          {r.organizationName || `${r.assignedOrganizationsCount || 1} Operator`}
                        </span>
                      </td>
                      <td>
                        <Badge status={currentStatus} />
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedRoute(r)}
                            title="Inspect route corridor details"
                          >
                            <Eye size={13} /> View
                          </button>
                          
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRoutes.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="routes"
        />
      </div>

      {/* Route Details Modal */}
      <Modal
        isOpen={Boolean(selectedRoute)}
        onClose={() => setSelectedRoute(null)}
        title={`Route Corridor: ${selectedRoute?.name || ""}`}
        footer={
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button className="btn btn-secondary" onClick={() => setSelectedRoute(null)}>
              Close
            </button>
            
          </div>
        }
      >
        {selectedRoute && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>{selectedRoute.name}</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Intercity Transit Corridor</span>
              </div>
              <Badge status={selectedRoute.status || "ACTIVE"} />
            </div>

            <div className="form-row" style={{ marginBottom: "1rem" }}>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Origin Terminal</span>
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "2px" }}>
                  <MapPin size={14} color="var(--primary)" /> {selectedRoute.originStationName}
                </div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Destination Terminal</span>
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "2px" }}>
                  <MapPin size={14} color="#10b981" /> {selectedRoute.destinationStationName}
                </div>
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: "1rem" }}>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Corridor Distance</span>
                <div style={{ fontWeight: 700, marginTop: "2px" }}>{selectedRoute.distanceKm} Kilometers</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Estimated Travel Duration</span>
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "2px" }}>
                  <Clock size={14} color="var(--primary)" /> {selectedRoute.estimatedDuration}
                </div>
              </div>
            </div>

            <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Assigned Operating Company</span>
              <div style={{ fontWeight: 700, marginTop: "2px" }}>{selectedRoute.organizationName || "Multi-operator corridor"}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default AdminRoutesPage;
