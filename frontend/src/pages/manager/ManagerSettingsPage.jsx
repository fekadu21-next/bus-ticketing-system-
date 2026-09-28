import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Settings, Save, Lock, UserCheck } from "lucide-react";

export const ManagerSettingsPage = () => {
  const { activeOrg, showToast } = useApp();
  const [managerName, setManagerName] = useState("Dawit Haile");
  const [managerPhone, setManagerPhone] = useState(activeOrg?.phone || "+251 11 551 2233");
  const [managerEmail, setManagerEmail] = useState(activeOrg?.email || "ops@selambus.et");

  const handleSaveProfile = (e) => {
    e.preventDefault();
    showToast("Manager profile preferences updated successfully!");
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Manager Account & Security Settings</h1>
          <p>Update manager identity credentials, notification alerts, and security preferences.</p>
        </div>
      </div>

      <div style={{ maxWidth: "680px" }}>
        <form onSubmit={handleSaveProfile} className="card-table-wrapper" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UserCheck size={18} color="var(--primary)" /> Operational Manager Identity
          </h3>

          <div className="form-group">
            <label>Full Manager Name</label>
            <input
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Official Contact Phone</label>
              <input
                type="text"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Work Email</label>
              <input
                type="email"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <hr style={{ margin: "1.5rem 0", borderColor: "var(--border-color)" }} />

          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Lock size={18} color="var(--warning-text)" /> Update Account Password
          </h3>

          <div className="form-group">
            <label>Current Password</label>
            <input type="password" placeholder="••••••••••••" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>New Password</label>
              <input type="password" placeholder="••••••••••••" />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" placeholder="••••••••••••" />
            </div>
          </div>

          <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Update Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
