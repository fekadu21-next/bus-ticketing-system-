import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Bus, Search, RefreshCw, Eye, Wrench, CheckCircle2, Power, Building2 } from "lucide-react";

export const AdminBusesPage = () => {
  const { buses = [], organizations = [], updateBusStatus, isLoadingData, fetchAdminData, showToast } = useApp();
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBus, setSelectedBus] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterOrg, filterStatus, searchQuery]);

  const filteredBuses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return buses.filter((b) => {
      const matchesOrg = filterOrg === "ALL" || b.organizationId === filterOrg;
      const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
      const matchesSearch =
        !q ||
        (b.plateNumber || "").toLowerCase().includes(q) ||
        (b.busNumber || "").toLowerCase().includes(q) ||
        (b.model || "").toLowerCase().includes(q) ||
        (b.organizationName || "").toLowerCase().includes(q);
      return matchesOrg && matchesStatus && matchesSearch;
    });
  }, [buses, filterOrg, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filteredBuses.length / pageSize) || 1;
  const paginatedBuses = useMemo(() => {
    return filteredBuses.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredBuses, currentPage, pageSize]);

  const handleManualRefresh = async () => {
    if (!fetchAdminData) return;
    try {
      setIsRefreshing(true);
      await fetchAdminData();
      if (showToast) showToast("Fleet buses synchronized from backend.");
    } catch {
      if (showToast) showToast("Failed to refresh buses.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = (busId, newStatus) => {
    if (updateBusStatus) {
      updateBusStatus(busId, newStatus);
    }
    if (selectedBus && selectedBus.id === busId) {
      setSelectedBus((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Fleet Buses Monitor</h1>
          <p>Supervise vehicle fleet registers, licensing compliance, maintenance status, and passenger capacity across operating companies.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleManualRefresh}
          disabled={isRefreshing || isLoadingData}
          title="Refresh Fleet"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          <RefreshCw size={14} className={isRefreshing || isLoadingData ? "spin animate-spin" : ""} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
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
              <option value="ALL">🏢 All Organizations</option>
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

        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: "950px" }}>
            <thead>
              <tr>
                <th>Bus #</th>
                <th>Plate Number</th>
                <th>Operator Company</th>
                <th>Vehicle Model</th>
                <th>Capacity</th>
                <th>Fleet Status</th>
                <th>Last Maintenance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData && buses.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem" }}>
                    <LoadingSpinner label="Loading fleet monitor..." />
                  </td>
                </tr>
              ) : filteredBuses.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No buses found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedBuses.map((b) => {
                  const currentStatus = b.status || "ACTIVE";
                  return (
                    <tr key={b.id}>
                      <td>
                        <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Bus size={14} color="var(--primary)" /> {b.busNumber}
                        </strong>
                      </td>
                      <td><code>{b.plateNumber}</code></td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                          <Building2 size={13} color="var(--primary)" />
                          {b.organizationName}
                        </span>
                      </td>
                      <td>{b.model}</td>
                      <td><span style={{ fontWeight: 700 }}>{b.capacity} Seats</span></td>
                      <td>
                        <Badge status={currentStatus} />
                      </td>
                      <td>{b.lastMaintenance || "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedBus(b)}
                            title="Inspect vehicle profile"
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
          totalItems={filteredBuses.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="buses"
        />
      </div>

      {/* Bus Details Modal */}
      <Modal
        isOpen={Boolean(selectedBus)}
        onClose={() => setSelectedBus(null)}
        title={`Fleet Vehicle: ${selectedBus?.plateNumber || ""}`}
        footer={
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button className="btn btn-secondary" onClick={() => setSelectedBus(null)}>
              Close
            </button>
            </div>
        }
      >
        {selectedBus && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>{selectedBus.plateNumber}</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{selectedBus.busNumber} • {selectedBus.model}</span>
              </div>
              <Badge status={selectedBus.status || "ACTIVE"} />
            </div>

            <div className="form-row" style={{ marginBottom: "1rem" }}>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Operating Company</span>
                <div style={{ fontWeight: 700, marginTop: "2px" }}>{selectedBus.organizationName}</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Passenger Capacity</span>
                <div style={{ fontWeight: 700, marginTop: "2px" }}>{selectedBus.capacity} Total Passenger Seats</div>
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: "1rem" }}>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Manufacture Year</span>
                <div style={{ fontWeight: 600, marginTop: "2px" }}>{selectedBus.manufactureYear || "2023"}</div>
              </div>
              <div style={{ background: "var(--bg-main, #f8fafc)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Last Service / Inspection</span>
                <div style={{ fontWeight: 600, marginTop: "2px" }}>{selectedBus.lastMaintenance || "Recent Inspection"}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default AdminBusesPage;
