import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Settings, ShieldCheck, Lock, Save } from "lucide-react";

export const AdminSettingsPage = () => {
  const { settings, updateSystemSettings } = useApp();
  const [fee, setFee] = useState(settings?.platformFeePercent ?? 5.0);
  const [holdTime, setHoldTime] = useState(settings?.holdDurationMinutes ?? 15);
  const [requireDriver, setRequireDriver] = useState(settings?.requireDriverAssignmentBeforePublish ?? true);

  // Sync state if settings change externally
  React.useEffect(() => {
    if (settings?.platformFeePercent !== undefined) {
      setFee(settings.platformFeePercent);
    }
    if (settings?.holdDurationMinutes !== undefined) {
      setHoldTime(settings.holdDurationMinutes);
    }
    if (settings?.requireDriverAssignmentBeforePublish !== undefined) {
      setRequireDriver(settings.requireDriverAssignmentBeforePublish);
    }
  }, [settings]);

  const handleSave = (e) => {
    e.preventDefault();
    const feeVal = Math.max(0, Math.min(100, Number(fee) || 5.0));
    updateSystemSettings({
      platformFeePercent: feeVal,
      holdDurationMinutes: Number(holdTime) || 15,
      requireDriverAssignmentBeforePublish: requireDriver
    });
  };

  const currentFeeNum = Number(fee) || 0;
  const sampleFare = 1000;
  const platformTakes = ((sampleFare * currentFeeNum) / 100).toFixed(2);
  const operatorGets = (sampleFare - platformTakes).toFixed(2);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>System Settings</h1>
          <p>Global platform configurations, fees, and integration references.</p>
        </div>
      </div>

      <div style={{ maxWidth: "680px" }}>
        <form onSubmit={handleSave} className="card-table-wrapper" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Settings size={18} color="var(--primary)" /> Financial & Business Rules
          </h3>

          <div className="form-group">
            <label>Platform Commission Fee (%)</label>
            <input
              type="number"
              step="0.1"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              required
            />
            <span className="help-text">Deducted automatically from total booking fare prior to operator payout.</span>
            <div style={{ marginTop: "0.6rem", padding: "0.75rem 1rem", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "6px", fontSize: "0.82rem" }}>
              <div style={{ fontWeight: 600, color: "var(--primary)", marginBottom: "0.25rem" }}>
                💡 Live Commission Split Example (1,000 ETB Passenger Booking):
              </div>
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                <div>Platform Revenue ({currentFeeNum}%): <strong style={{ color: "var(--primary)" }}>{platformTakes} ETB</strong></div>
                <div>Operator Net Share ({(100 - currentFeeNum).toFixed(1)}%): <strong style={{ color: "#10b981" }}>{operatorGets} ETB</strong></div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Passenger Seat Hold Timeout (Minutes)</label>
            <input
              type="number"
              value={holdTime}
              onChange={(e) => setHoldTime(e.target.value)}
              required
            />
            <span className="help-text">Time window allowed for passenger payment before held seats expire automatically.</span>
          </div>

          <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "1rem" }}>
            <input
              type="checkbox"
              id="requireDriverCheck"
              checked={requireDriver}
              onChange={(e) => setRequireDriver(e.target.checked)}
              style={{ width: "auto" }}
            />
            <label htmlFor="requireDriverCheck" style={{ margin: 0, cursor: "pointer" }}>
              Enforce Driver Assignment before publishing operational trips
            </label>
          </div>

          <hr style={{ margin: "1.5rem 0", borderColor: "var(--border-color)" }} />

          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Lock size={18} color="var(--warning-text)" /> Payment Gateway Integration References
          </h3>

          <div className="form-group">
            <label>Telebirr Merchant ID Reference</label>
            <input type="text" value={settings.telebirrMerchantId} disabled style={{ background: "#f1f5f9" }} />
          </div>

          <div className="form-group">
            <label>Chapa Public Key Reference</label>
            <input type="text" value={settings.chapaPublicKey} disabled style={{ background: "#f1f5f9" }} />
            <span className="help-text">
              API keys are encrypted and stored on the server.
            </span>
          </div>

          <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save Platform Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
