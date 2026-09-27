import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useApp } from "../../context/AppContext";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export const DashboardLayout = ({ children }) => {
  const { toast, isSidebarCollapsed, setIsSidebarCollapsed } = useApp();

  return (
    <div className="app-shell">
      {/* Mobile overlay backdrop */}
      {!isSidebarCollapsed && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      <Sidebar />

      <div className="main-wrapper">
        <Header />
        <main className="page-container">{children}</main>
      </div>

      {/* Global Toast Notification */}
      {toast && (
        <div className={`toast-notification toast-${toast.type || "success"}`}>
          {toast.type === "error" ? (
            <AlertCircle size={18} />
          ) : toast.type === "info" ? (
            <Info size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
