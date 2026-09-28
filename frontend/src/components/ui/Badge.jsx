import React from "react";

export const Badge = ({
  status,
  children,
  variant,
  className = "",
}) => {
  let computedVariant = variant || "neutral";

  if (status) {
    const normalized = (status || "").toUpperCase();
    if (["APPROVED", "ACTIVE", "SUCCESS", "VALID", "CONFIRMED", "PUBLISHED"].includes(normalized)) {
      computedVariant = "success";
    } else if (["PENDING", "HELD", "DRAFT", "MAINTENANCE", "ALREADY_USED"].includes(normalized)) {
      computedVariant = "warning";
    } else if (["REJECTED", "SUSPENDED", "CANCELLED", "FAILED", "INVALID", "WRONG_TRIP", "BLOCKED"].includes(normalized)) {
      computedVariant = "danger";
    } else if (["REFUNDED", "USED", "COMPLETED", "INACTIVE"].includes(normalized)) {
      computedVariant = "info";
    }
  }

  const badgeContent = children || status;

  return (
    <span className={`badge badge-${computedVariant} ${className}`}>
      {badgeContent}
    </span>
  );
};

export default Badge;
