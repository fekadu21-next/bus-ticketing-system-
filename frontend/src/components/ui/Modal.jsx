import React, { useEffect } from "react";
import { X } from "lucide-react";

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "550px",
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-[2px] transition-opacity duration-200" />
      <div
        className="relative bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] w-full max-h-[92vh] overflow-hidden flex flex-col z-10 transition-colors"
        style={{
          maxWidth: `min(100%, ${maxWidth})`,
          margin: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#131d33]">
          {title && <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate pr-2">{title}</h3>}
          <button
            type="button"
            className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body flex-1 overflow-y-auto px-5 py-5 bg-white dark:bg-[#131d33] text-slate-900 dark:text-[#f8fafc]">{children}</div>
        {footer && <div className="modal-footer px-5 py-4 border-t border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#0c1424] flex items-center justify-end gap-2.5 flex-wrap">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
