import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  itemLabel = "items",
}) => {
  if (totalItems <= 0 && totalPages <= 1) return null;

  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) pages.push("...");

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className="pagination-container"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
        padding: "0.85rem 1.25rem",
        borderTop: "1px solid var(--border-color, #e2e8f0)",
        background: "var(--bg-card, #ffffff)",
        fontSize: "0.82rem",
        color: "var(--text-muted, #64748b)",
      }}
    >
      {/* Left: Summary and Page Size */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <span>
          Showing <strong style={{ color: "var(--text-main, #0f172a)" }}>{startItem}</strong> to{" "}
          <strong style={{ color: "var(--text-main, #0f172a)" }}>{endItem}</strong> of{" "}
          <strong style={{ color: "var(--text-main, #0f172a)" }}>{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                if (onPageChange) onPageChange(1);
              }}
              className="org-selector-select"
              style={{
                fontSize: "0.78rem",
                padding: "2px 6px",
                borderRadius: "6px",
                border: "1px solid var(--border-color, #cbd5e1)",
                background: "var(--bg-card, #fff)",
                color: "var(--text-main, #0f172a)",
                cursor: "pointer",
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Controls */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          {/* First Page */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            title="First Page"
            style={{
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              opacity: currentPage <= 1 ? 0.45 : 1,
            }}
          >
            <ChevronsLeft size={14} />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            title="Previous Page"
            style={{
              padding: "4px 10px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              opacity: currentPage <= 1 ? 0.45 : 1,
            }}
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Page numbers */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            {getPageNumbers().map((p, idx) =>
              p === "..." ? (
                <span key={`ellipsis-${idx}`} style={{ padding: "0 4px", color: "var(--text-muted)" }}>
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`btn btn-sm ${currentPage === p ? "btn-primary" : "btn-secondary"}`}
                  style={{
                    minWidth: "28px",
                    height: "28px",
                    padding: "0 6px",
                    fontSize: "0.78rem",
                    fontWeight: currentPage === p ? 700 : 500,
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {p}
                </button>
              )
            )}
          </div>

          {/* Next Page */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            title="Next Page"
            style={{
              padding: "4px 10px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              opacity: currentPage >= totalPages ? 0.45 : 1,
            }}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={14} />
          </button>

          {/* Last Page */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            title="Last Page"
            style={{
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              opacity: currentPage >= totalPages ? 0.45 : 1,
            }}
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
