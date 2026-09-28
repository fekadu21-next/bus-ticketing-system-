import React from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Building2, Phone, Mail, MapPin, Bus, ShieldCheck } from "lucide-react";

export const ManagerOrganizationPage = () => {
  const { activeOrg, buses, trips, drivers } = useApp();

  const orgBuses = buses.filter((b) => b.organizationId === activeOrg?.id);
  const orgTrips = trips.filter((t) => t.organizationId === activeOrg?.id);
  const orgDrivers = drivers.filter((d) => d.organizationId === activeOrg?.id);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Organization Profile & Identity</h1>
          <p>Official registration credentials, operational capacity, and platform status.</p>
        </div>
      </div>

      <div style={{ maxWidth: "800px" }}>
        <div className="card-table-wrapper" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  background: "var(--primary-light)",
                  color: "var(--primary)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Building2 size={28} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{activeOrg?.name}</h2>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Organization Type: <strong>{activeOrg?.type}</strong>
                </div>
              </div>
            </div>
            <Badge status={activeOrg?.status || "APPROVED"} />
          </div>

          <div className="form-row" style={{ marginBottom: "1rem" }}>
            <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Registration Number</span>
              <strong style={{ fontSize: "0.9rem" }}><code>{activeOrg?.registrationNumber}</code></strong>
            </div>
            <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Platform Onboarding Date</span>
              <strong style={{ fontSize: "0.9rem" }}>{activeOrg?.createdAt}</strong>
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: "1rem" }}>
            <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Primary Contact Person</span>
              <strong style={{ fontSize: "0.9rem" }}>{activeOrg?.contactName}</strong>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                {activeOrg?.phone} | {activeOrg?.email}
              </div>
            </div>
            <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Physical Address</span>
              <strong style={{ fontSize: "0.9rem" }}>{activeOrg?.address}</strong>
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>Operational Notes</span>
            <div style={{ fontSize: "0.82rem", fontStyle: "italic" }}>"{activeOrg?.notes}"</div>
          </div>
        </div>

        {/* Capacity Overview Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>{orgBuses.length}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Registered Fleet Buses</div>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--success-text)" }}>{orgDrivers.length}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Licensed Drivers</div>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--info-text)" }}>{orgTrips.length}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Scheduled Departure Trips</div>
          </div>
        </div>
      </div>
    </div>
  );
};
