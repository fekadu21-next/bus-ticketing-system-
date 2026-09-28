import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { CalendarDays, Search } from "lucide-react";

export const AdminTripsPage = () => {
  const { trips, organizations } = useApp();
  const [filterOrg, setFilterOrg] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTrips = trips.filter((t) => {
    const matchesOrg = filterOrg === "ALL" || t.organizationId === filterOrg;
    const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
    const matchesSearch =
      t.tripCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.routeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesOrg && matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Trips Monitor</h1>
          <p>Monitor scheduled departures created and operated by companies nationwide.</p>
        </div>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div className="header-search" style={{ width: "240px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Search trip code or route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
            >
              <option value="ALL">All Operators</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Trip Code</th>
              <th>Operator</th>
              <th>Route</th>
              <th>Bus Plate</th>
              <th>Assigned Driver</th>
              <th>Schedule</th>
              <th>Fare</th>
              <th>Seat Occupancy</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrips.map((t) => (
              <tr key={t.id}>
                <td><code>{t.tripCode}</code></td>
                <td><strong>{t.organizationName}</strong></td>
                <td>{t.routeName}</td>
                <td><code>{t.busPlateNumber}</code></td>
                <td>{t.driverName}</td>
                <td>
                  <div>{t.departureDate}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{t.departureTime}</div>
                </td>
                <td><strong>{t.fareAmount} ETB</strong></td>
                <td>
                  <span style={{ fontWeight: 700, color: t.bookedSeatsCount === t.totalSeats ? "var(--danger)" : "var(--text-main)" }}>
                    {t.bookedSeatsCount} / {t.totalSeats}
                  </span>
                </td>
                <td><Badge status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
