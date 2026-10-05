import React from "react";

export const StatCard = ({ title, value, icon: Icon, trend, onClick, subtitle }) => {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="stat-header">
        <span>{title}</span>
        {Icon && (
          <div className="stat-icon">
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-footer">
        {trend && <span className="trend-up">{trend} </span>}
        {subtitle || "Real-time system telemetry"}
      </div>
    </div>
  );
};
