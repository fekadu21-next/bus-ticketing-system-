import React from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Route as RouteIcon, MapPin, Search } from "lucide-react";

export const AdminRoutesPage = () => {
  const { routes } = useApp();

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Routes Registry</h1>
          <p>Monitor standardized intercity origin and destination route pairs across Ethiopia.</p>
        </div>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div className="card-title">
            <h3>Registered Transportation Corridors</h3>
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
              <th>Operators Using Route</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
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
                <td><span style={{ fontWeight: 700 }}>{r.assignedOrganizationsCount} Companies</span></td>
                <td><Badge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
