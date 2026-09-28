import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Bus,
  ShieldCheck,
  Edit2,
  RefreshCw,
  Users,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export const ManagerOrganizationPage = () => {
  const {
    activeOrg,
    selectedOrgId,
    buses,
    trips,
    drivers,
    verifiers,
    updateOrganizationProfile,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: activeOrg?.name || "",
    type: activeOrg?.type || "COMPANY",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orgBuses = buses.filter((b) => b.organizationId === selectedOrgId);
  const orgTrips = trips.filter((t) => t.organizationId === selectedOrgId);
  const orgDrivers = drivers.filter((d) => d.organizationId === selectedOrgId);
  const orgVerifiers = verifiers.filter((v) => v.organizationId === selectedOrgId);

  const handleOpenEdit = () => {
    setFormData({
      name: activeOrg?.name || "",
      type: activeOrg?.type || "COMPANY",
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      await updateOrganizationProfile(formData);
      setShowEditModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = activeOrg?.status || "APPROVED";

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Organization Profile & Identity</h1>
          <p>Official registration credentials, operational capacity, and platform status.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchCoordinatorData(selectedOrgId)}
            disabled={isLoadingData}
          >
            <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenEdit}>
            <Edit2 size={15} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Approval Status Banner if not APPROVED */}
      {status === "PENDING" && (
        <div
          className="card-table-wrapper"
          style={{
            borderLeft: "4px solid var(--warning)",
            padding: "1rem 1.25rem",
            marginBottom: "1.25rem",
            background: "var(--warning-bg)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <AlertCircle size={20} color="var(--warning-text)" />
          <div>
            <strong style={{ color: "var(--warning-text)", display: "block" }}>
              Pending Platform Approval
            </strong>
            <span style={{ fontSize: "0.82rem", color: "var(--warning-text)" }}>
              Your organization account is undergoing administrative compliance review. Fleet scheduling features are restricted until full activation.
            </span>
          </div>
        </div>
      )}

      {status === "SUSPENDED" && (
        <div
          className="card-table-wrapper"
          style={{
            borderLeft: "4px solid var(--danger)",
            padding: "1rem 1.25rem",
            marginBottom: "1.25rem",
            background: "var(--danger-bg)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <AlertCircle size={20} color="var(--danger-text)" />
          <div>
            <strong style={{ color: "var(--danger-text)", display: "block" }}>
              Organization Account Suspended
            </strong>
            <span style={{ fontSize: "0.82rem", color: "var(--danger-text)" }}>
              Ticket sales and schedule departures are currently suspended by platform oversight. Contact administration.
            </span>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "850px" }}>
        {/* Main Profile Card */}
        <div className="card-table-wrapper" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: "var(--primary-light)",
                  color: "var(--primary)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Building2 size={30} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0 }}>
                  {activeOrg?.name || "Organization"}
                </h2>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Operating Category: <strong>{activeOrg?.type || "COMPANY"}</strong>
                </div>
              </div>
            </div>
            <Badge status={status} />
          </div>

          <div className="form-row" style={{ marginBottom: "1rem" }}>
            <div
              style={{
                background: "#f8fafc",
                padding: "0.85rem",
                borderRadius: "6px",
                border: "1px solid var(--border-color)",
              }}
            >
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                License / Registration ID
              </span>
              <strong style={{ fontSize: "0.9rem" }}>
                <code>{activeOrg?.licenseNumber || activeOrg?.registrationNumber || `LIC-${activeOrg?.id?.slice(0, 8)}`}</code>
              </strong>
            </div>
            <div
              style={{
                background: "#f8fafc",
                padding: "0.85rem",
                borderRadius: "6px",
                border: "1px solid var(--border-color)",
              }}
            >
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                Platform Onboarding Date
              </span>
              <strong style={{ fontSize: "0.9rem" }}>{activeOrg?.createdAt || "2024-01-15"}</strong>
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: "1rem" }}>
            <div
              style={{
                background: "#f8fafc",
                padding: "0.85rem",
                borderRadius: "6px",
                border: "1px solid var(--border-color)",
              }}
            >
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                Primary Contact Information
              </span>
              <strong style={{ fontSize: "0.9rem" }}>{activeOrg?.contactName || "Operations Lead"}</strong>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                {activeOrg?.contactPhone || activeOrg?.phone || "+251911000000"} | {activeOrg?.contactEmail || activeOrg?.email || "ops@busticket.et"}
              </div>
            </div>
            <div
              style={{
                background: "#f8fafc",
                padding: "0.85rem",
                borderRadius: "6px",
                border: "1px solid var(--border-color)",
              }}
            >
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                Headquarters Address
              </span>
              <strong style={{ fontSize: "0.9rem" }}>{activeOrg?.address || "Addis Ababa, Ethiopia"}</strong>
            </div>
          </div>

          <div
            style={{
              background: "#f8fafc",
              padding: "0.85rem",
              borderRadius: "6px",
              border: "1px solid var(--border-color)",
            }}
          >
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
              Operational Status Note
            </span>
            <div style={{ fontSize: "0.82rem", fontStyle: "italic", marginTop: "0.2rem" }}>
              {status === "APPROVED"
                ? "Organization is fully accredited and active for intercity passenger transport operations."
                : (activeOrg?.notes || "Compliance review in progress.")}
            </div>
          </div>
        </div>

        {/* Capacity Overview Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "1.2rem", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)" }}>{orgBuses.length}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Fleet Buses</div>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "1.2rem", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--success-text)" }}>{orgDrivers.length}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Active Drivers</div>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "1.2rem", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#8b5cf6" }}>{orgVerifiers.length}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Ticket Verifiers</div>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "1.2rem", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--info-text)" }}>{orgTrips.length}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Scheduled Trips</div>
          </div>
        </div>

        {/* Organization Members List if available */}
        {activeOrg?.members && activeOrg.members.length > 0 && (
          <div className="card-table-wrapper" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Users size={18} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600 }}>Assigned Key Personnel</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeOrg.members.map((m, idx) => (
                  <tr key={m.id || idx}>
                    <td><strong>{[m.firstName, m.lastName].filter(Boolean).join(" ") || "Member"}</strong></td>
                    <td><code>{m.role || "STAFF"}</code></td>
                    <td>{m.email}</td>
                    <td>{m.phone || "—"}</td>
                    <td><Badge status={m.isActive !== false ? "ACTIVE" : "INACTIVE"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Organization Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Organization Profile"
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowEditModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveProfile}
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>
              Organization Official Name
            </label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Selam Bus Transport Share Company"
              style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem", display: "block" }}>
              Organization Entity Type
            </label>
            <select
              className="form-control"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}
            >
              <option value="COMPANY">Private Commercial Operator (Share Co / PLC)</option>
              <option value="PUBLIC_ENTERPRISE">Public Enterprise / Regional Line</option>
              <option value="COOPERATIVE">Transport Association / Cooperative</option>
              <option value="GOVERNMENT">Municipal / State Transit Authority</option>
            </select>
          </div>

          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", background: "#f8fafc", padding: "0.75rem", borderRadius: "6px" }}>
            Note: License number and accreditation status are platform-governed and can only be modified by Platform Administrators upon official regulatory review.
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManagerOrganizationPage;
