import React from "react";

export const Badge = ({ status }) => {
  const normalized = (status || "").toUpperCase();

  let type = "badge-neutral";
  if (["APPROVED", "ACTIVE", "SUCCESS", "VALID", "CONFIRMED", "PUBLISHED"].includes(normalized)) {
    type = "badge-success";
  } else if (["PENDING", "HELD", "DRAFT", "MAINTENANCE", "ALREADY_USED"].includes(normalized)) {
    type = "badge-warning";
  } else if (["REJECTED", "SUSPENDED", "CANCELLED", "FAILED", "INVALID", "WRONG_TRIP", "BLOCKED"].includes(normalized)) {
    type = "badge-danger";
  } else if (["REFUNDED", "USED", "COMPLETED", "INACTIVE"].includes(normalized)) {
    type = "badge-info";
  }

  return <span className={`badge ${type}`}>{status}</span>;
};
