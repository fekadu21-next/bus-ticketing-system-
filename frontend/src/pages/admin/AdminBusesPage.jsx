import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Bus, Search, Filter } from "lucide-react";

export const AdminBusesPage = () => {
  const { buses, organizations } = useApp();
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBuses = buses.filter((b) => {
    const matchesOrg = filterOrg === "ALL" || b.organizationId === filterOrg;
    const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
    const matchesSearch =
      b.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesOrg && matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Buses Monitor</h1>
          <p>Platform-wide visibility into fleet vehicles registered by all operating companies.</p>
        </div>
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
            Buses Count: <strong>{filteredBuses.length}</strong>
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
            {filteredBuses.map((b) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
