import React from "react";

export const Badge = ({
  status,
  children,
  variant,
  className = "",
  style = {},
}) => {
  // Determine display label - never leave blank/missing
  const rawValue =
    children !== undefined && children !== null && children !== ""
      ? children
      : status !== undefined && status !== null && status !== ""
      ? status
      : "ACTIVE";

  const label = typeof rawValue === "string" ? rawValue.replace(/_/g, " ").toUpperCase() : rawValue;

  // Determine variant based on variant prop or status value
  const resolvedVariant = (() => {
    if (variant) return variant;
    const val = String(status || children || "").toUpperCase().trim();

    if (
      [
        "ACTIVE",
        "APPROVED",
        "CONFIRMED",
        "PUBLISHED",
        "SUCCESS",
        "COMPLETED",
        "VALID",
        "VERIFIED",
      ].includes(val)
    ) {
      return "success";
    }

    if (
      [
        "PENDING",
        "MAINTENANCE",
        "DRAFT",
        "BOARDING",
        "LOCKED",
        "ON_HOLD",
        "REVIEW",
      ].includes(val)
    ) {
      return "warning";
    }

    if (
      [
        "INACTIVE",
        "SUSPENDED",
        "REJECTED",
        "CANCELLED",
        "FAILED",
        "INVALID",
        "ALREADY_USED",
        "EXPIRED",
        "DEACTIVATED",
      ].includes(val)
    ) {
      return "danger";
    }

    if (["SCHEDULED", "IN_TRANSIT", "PROCESSING"].includes(val)) {
      return "info";
    }

    return "neutral";
  })();

  const colorStyles = {
    success: {
      background: "rgba(16, 185, 129, 0.12)",
      color: "#059669",
      borderColor: "rgba(16, 185, 129, 0.25)",
      dotColor: "#10b981",
    },
    warning: {
      background: "rgba(245, 158, 11, 0.14)",
      color: "#d97706",
      borderColor: "rgba(245, 158, 11, 0.3)",
      dotColor: "#f59e0b",
    },
    danger: {
      background: "rgba(239, 68, 68, 0.12)",
      color: "#dc2626",
      borderColor: "rgba(239, 68, 68, 0.25)",
      dotColor: "#ef4444",
    },
    info: {
      background: "rgba(37, 99, 235, 0.12)",
      color: "#2563eb",
      borderColor: "rgba(37, 99, 235, 0.25)",
      dotColor: "#3b82f6",
    },
    primary: {
      background: "rgba(37, 99, 235, 0.12)",
      color: "#2563eb",
      borderColor: "rgba(37, 99, 235, 0.25)",
      dotColor: "#3b82f6",
    },
    neutral: {
      background: "rgba(100, 116, 139, 0.12)",
      color: "var(--text-muted, #64748b)",
      borderColor: "rgba(100, 116, 139, 0.25)",
      dotColor: "#94a3b8",
    },
  }[resolvedVariant] || {
    background: "rgba(100, 116, 139, 0.12)",
    color: "var(--text-muted, #64748b)",
    borderColor: "rgba(100, 116, 139, 0.25)",
    dotColor: "#94a3b8",
  };

  return (
    <span
      className={`badge badge-${resolvedVariant} ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 9px",
        borderRadius: "99px",
        fontSize: "0.72rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
        backgroundColor: colorStyles.background,
        color: colorStyles.color,
        border: `1px solid ${colorStyles.borderColor}`,
        ...style,
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: colorStyles.dotColor,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
};

export default Badge;
