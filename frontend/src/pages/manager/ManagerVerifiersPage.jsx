import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { QrCode, Plus, Search, ShieldCheck, RefreshCw, Eye, Pencil, Trash2, AlertCircle, AlertTriangle } from "lucide-react";
import { OrgApprovalBanner } from "../../components/common/OrgApprovalBanner";

export const ManagerVerifiersPage = () => {
  const { t } = useTranslation();
  const {
    activeOrg,
    verifiers,
    stations,
    tickets,
    verifications,
    selectedOrgId,
    addVerifier,
    updateVerifier,
    deleteVerifier,
    toggleStaffStatus,
    verifyTicket,
    fetchCoordinatorData,
    isLoadingData,
    showToast,
  } = useApp();

  const isApproved = activeOrg?.status === "APPROVED" && activeOrg?.isActive !== false && activeOrg?.is_active !== false;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Add Verifier Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+251911000000");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Verifier@123456");
  const [assignedStation, setAssignedStation] = useState(stations[0]?.name || "Addis Ababa Autobus Terra");

  // View Verifier Modal State
  const [viewingVerifier, setViewingVerifier] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Edit Verifier Modal State
  const [editingVerifier, setEditingVerifier] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAssignedStation, setEditAssignedStation] = useState("");
  const [editError, setEditError] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Verifier Modal State
  const [deletingVerifier, setDeletingVerifier] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const resetForm = () => {
    setName("");
    setPhone("+251911000000");
    setEmail("");
    setPassword("Verifier@123456");
    setAssignedStation(stations[0]?.name || "Addis Ababa Autobus Terra");
    setAddError("");
  };

  const orgVerifiers = React.useMemo(() => {
    if (!selectedOrgId || selectedOrgId === "ALL") return verifiers;
    const filtered = verifiers.filter((v) => v.organizationId === selectedOrgId);
    return filtered.length > 0 ? filtered : verifiers;
  }, [verifiers, selectedOrgId]);

  const filteredVerifiers = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orgVerifiers.filter((v) => {
      const matchesStatus = filterStatus === "ALL" || v.status === filterStatus;
      const matchesSearch =
        !q ||
        (v.name && v.name.toLowerCase().includes(q)) ||
        (v.email && v.email.toLowerCase().includes(q)) ||
        (v.assignedStation && v.assignedStation.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [orgVerifiers, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filteredVerifiers.length / pageSize) || 1;
  const paginatedVerifiers = React.useMemo(() => {
    return filteredVerifiers.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [filteredVerifiers, currentPage, pageSize]);

  const handleAddVerifier = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setAddError("Verifier name is required.");
      return;
    }
    setAddError("");
    setIsSubmitting(true);
    try {
      const verifierEmail = email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, ".")}@operator.et`;
      const verifierPassword = password.trim() || "Verifier@123456";

      await addVerifier({
        name: name.trim(),
        phone: phone.trim(),
        email: verifierEmail,
        password: verifierPassword,
        assignedStation,
        organizationId: selectedOrgId
      });
      resetForm();
      setShowAddModal(false);
    } catch (err) {
      setAddError(err.response?.data?.message || err.message || "Failed to register ticket verifier.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenView = (verifier) => {
    setViewingVerifier(verifier);
    setShowViewModal(true);
  };

  const handleOpenEdit = (verifier) => {
    setEditingVerifier(verifier);
    setEditName(verifier.name || "");
    setEditPhone(verifier.phone || "");
    setEditAssignedStation(verifier.assignedStation || stations[0]?.name || "Addis Ababa Central Terminal");
    setEditError("");
    setShowEditModal(true);
  };

  const handleUpdateVerifier = async (e) => {
    if (e) e.preventDefault();
    if (!editName.trim()) {
      setEditError("Ticket verifier name is required.");
      return;
    }
    setEditError("");
    setIsSubmittingEdit(true);
    try {
      await updateVerifier(editingVerifier.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        assignedStation: editAssignedStation,
      });
      setShowEditModal(false);
      setEditingVerifier(null);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || "Failed to update ticket verifier.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenDelete = (verifier) => {
    setDeletingVerifier(verifier);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingVerifier) return;
    setDeleteError("");
    setIsSubmittingDelete(true);
    try {
      await deleteVerifier(deletingVerifier.id);
      setShowDeleteModal(false);
      setDeletingVerifier(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || "Failed to remove ticket verifier.");
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
    <div>
      <OrgApprovalBanner />

      <div className="page-header">
        <div className="page-title">
          <h1>{t("managerVerifiers.title", "Ticket Verifiers")}</h1>
          <p>{t("managerVerifiers.subtitle", "Station and mobile QR code verification officers authorized for ticket validation.")}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchCoordinatorData(selectedOrgId)}
            disabled={isLoadingData}
          >
            <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> {t("common.refresh", "Refresh")}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { resetForm(); setShowAddModal(true); }}
            disabled={!isApproved}
            title={!isApproved ? "Organization approval required to register ticket verifiers" : ""}
          >
            <Plus size={16} /> {t("managerVerifiers.registerBtn", "Register Ticket Verifier")}
          </button>
        </div>
      </div>

      <div className="card-table-wrapper">
        <div className="card-header-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div className="header-search" style={{ width: "260px" }}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                className="form-control"
                placeholder={t("managerVerifiers.searchPlaceholder", "Search verifier name, email, terminal...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">{t("managerVerifiers.allStatuses", "All Statuses")}</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {t("managerVerifiers.totalVerifiers", "Total Verifiers")}: <strong>{orgVerifiers.length}</strong>
          </div>
        </div>

        {filteredVerifiers.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <QrCode size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>{t("managerVerifiers.noVerifiers", "No registered ticket verifiers matching your filter.")}</div>
            {orgVerifiers.length === 0 && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={() => { resetForm(); setShowAddModal(true); }}
              >
                <Plus size={14} /> {t("managerVerifiers.registerFirst", "Register First Verifier")}
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "900px" }}>
              <thead>
                <tr>
                  <th>{t("managerVerifiers.tableName", "Verifier Name")}</th>
                  <th>{t("managerVerifiers.tablePhone", "Phone Number")}</th>
                  <th>{t("managerVerifiers.tableEmail", "Email")}</th>
                  <th>{t("managerVerifiers.tableStation", "Assigned Station")}</th>
                  <th>{t("managerVerifiers.tableStatus", "Status")}</th>
                  <th style={{ textAlign: "right" }}>{t("common.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVerifiers.map((v) => {
                  const isActive = v.status === "ACTIVE";
                  return (
                    <tr key={v.id}>
                      <td>
                        <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <QrCode size={14} color="var(--primary)" /> {v.name}
                        </strong>
                      </td>
                      <td>{v.phone || "—"}</td>
                      <td><code>{v.email}</code></td>
                      <td>{v.assignedStation || "Addis Ababa Central Terminal"}</td>
                      <td><Badge status={v.status} /></td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenView(v)}
                            title="View verifier details"
                          >
                            <Eye size={13} /> {t("common.view", "View")}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEdit(v)}
                            title="Edit verifier"
                          >
                            <Pencil size={13} /> {t("common.edit", "Edit")}
                          </button>
                          <button
                            className={`btn btn-sm ${isActive ? "btn-secondary" : "btn-success"}`}
                            onClick={() => toggleStaffStatus(v.id, !isActive)}
                            title={isActive ? t("managerVerifiers.deactivate", "Deactivate") : t("managerVerifiers.activate", "Activate")}
                          >
                            {isActive ? t("managerVerifiers.deactivate", "Deactivate") : t("managerVerifiers.activate", "Activate")}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleOpenDelete(v)}
                            title="Delete verifier"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredVerifiers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          itemLabel="verifiers"
        />
      </div>

      {/* View Verifier Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingVerifier(null); }}
        title="Ticket Verifier Profile & Assignment"
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowViewModal(false); setViewingVerifier(null); }}
            >
              {t("common.close", "Close")}
            </button>
            {viewingVerifier && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  const verifier = viewingVerifier;
                  setShowViewModal(false);
                  setViewingVerifier(null);
                  handleOpenEdit(verifier);
                }}
              >
                <Pencil size={14} /> {t("common.edit", "Edit Verifier")}
              </button>
            )}
          </div>
        }
      >
        {viewingVerifier && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Staff Member Name</span>
                <strong style={{ fontSize: "1.1rem", color: "var(--text-main)" }}>{viewingVerifier.name}</strong>
              </div>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Operational Status</span>
                <div style={{ marginTop: "0.25rem" }}>
                  <Badge status={viewingVerifier.status} />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Contact Phone</span>
                <span style={{ fontWeight: 600 }}>{viewingVerifier.phone || "—"}</span>
              </div>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Account Email</span>
                <code>{viewingVerifier.email || "—"}</code>
              </div>
            </div>

            <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Assigned Terminal Station</span>
              <strong style={{ color: "var(--primary)" }}>{viewingVerifier.assignedStation || "Addis Ababa Central Terminal"}</strong>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Verifier Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingVerifier(null); }}
        title="Edit Ticket Verifier"
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowEditModal(false); setEditingVerifier(null); }}
              disabled={isSubmittingEdit}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpdateVerifier}
              disabled={isSubmittingEdit || !editName.trim()}
            >
              {isSubmittingEdit ? t("common.saving", "Saving...") : t("common.saveChanges", "Save Changes")}
            </button>
          </div>
        }
      >
        <form onSubmit={handleUpdateVerifier} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {editError && (
            <div style={{
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "0.5rem",
              color: "#ef4444",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{editError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t("managerVerifiers.nameLabel", "Full Name")} *</label>
            <input
              type="text"
              className="form-control"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("managerVerifiers.phoneLabel", "Phone Number")}</label>
            <input
              type="text"
              className="form-control"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("managerVerifiers.stationLabel", "Assigned Station")} *</label>
            <select
              className="form-control"
              value={editAssignedStation}
              onChange={(e) => setEditAssignedStation(e.target.value)}
            >
              {stations.map((s) => (
                <option key={s.id} value={s.name}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      

      {/* Delete Verifier Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletingVerifier(null); }}
        title="Confirm Ticket Verifier Removal"
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowDeleteModal(false); setDeletingVerifier(null); }}
              disabled={isSubmittingDelete}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleConfirmDelete}
              disabled={isSubmittingDelete}
            >
              {isSubmittingDelete ? t("common.deleting", "Removing...") : "Remove Verifier"}
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {deleteError && (
            <div style={{
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "0.5rem",
              color: "#ef4444",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{deleteError}</span>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <AlertTriangle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: "var(--text-main)" }}>
                Are you sure you want to remove ticket verifier <strong>{deletingVerifier?.name}</strong> from your organization?
              </p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Ticket verifiers assigned to upcoming scheduled or boarding trips cannot be deleted until those trips are reassigned or completed.
              </p>
            </div>
          </div>

          {deletingVerifier && (
            <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)", fontSize: "0.85rem" }}>
              <div><strong>Email:</strong> {deletingVerifier.email}</div>
              <div><strong>Assigned Station:</strong> {deletingVerifier.assignedStation}</div>
              <div><strong>Status:</strong> {deletingVerifier.status}</div>
            </div>
          )}
        </div>
      </Modal>

      {/* Add Verifier Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t("managerVerifiers.modalRegisterTitle", "Register Ticket Verifier")}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowAddModal(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddVerifier}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? t("managerVerifiers.saving", "Saving...") : t("managerVerifiers.saveBtn", "Save Verifier")}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddVerifier} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {addError && (
            <div style={{
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "0.5rem",
              color: "#ef4444",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{addError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t("managerVerifiers.nameLabel", "Full Name")} *</label>
            <input
              type="text"
              className="form-control"
              placeholder={t("managerVerifiers.namePlaceholder", "e.g. Almaz Bekele")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("managerVerifiers.phoneLabel", "Phone Number")} *</label>
            <input
              type="text"
              className="form-control"
              placeholder={t("managerVerifiers.phonePlaceholder", "+251911000000")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("managerVerifiers.stationLabel", "Assigned Station")} *</label>
            <select
              className="form-control"
              value={assignedStation}
              onChange={(e) => setAssignedStation(e.target.value)}
            >
              {stations.map((s) => (
                <option key={s.id} value={s.name}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>

          <div className="form-divider" />

          <div className="form-group">
            <label className="form-label">{t("managerVerifiers.emailLabel", "Email Address")}</label>
            <input
              type="email"
              className="form-control"
              placeholder={t("managerVerifiers.emailPlaceholder", "almaz@operator.et")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {t("managerVerifiers.emailHelp", "Leave empty to auto-generate from name.")}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t("managerVerifiers.passwordLabel", "Temporary Password")}</label>
            <input
              type="password"
              className="form-control"
              placeholder={t("managerVerifiers.passwordPlaceholder", "Verifier@123456")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {t("managerVerifiers.passwordHelp", "Ticket verifier will use this to sign in to the validation portal.")}
            </div>
          </div>
        </form>
      </Modal>

      {/* Interactive Ticket Verification & QR Scanning Terminal Modal */}
      <Modal
        isOpen={showTestVerifyModal}
        onClose={() => { setShowTestVerifyModal(false); setVerificationResult(null); }}
        title="Live Ticket Verification & QR Inspection Terminal"
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Terminal Officer: <strong>{testVerifierName || orgVerifiers[0]?.name || "Station Verifier"}</strong>
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn btn-secondary"
                onClick={() => { setShowTestVerifyModal(false); setVerificationResult(null); }}
              >
                Close Terminal
              </button>
              <button
                className="btn btn-primary"
                style={{ background: "#059669", borderColor: "#059669" }}
                onClick={() => handleTestVerifyAction()}
                disabled={isVerifying || !testTicketInput.trim()}
              >
                {isVerifying ? "Verifying Token..." : "Verify & Check-in Ticket"}
              </button>
            </div>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ background: "rgba(5, 150, 105, 0.08)", border: "1px solid rgba(5, 150, 105, 0.2)", borderRadius: "8px", padding: "0.85rem", fontSize: "0.85rem", color: "var(--text-main)" }}>
            <strong>Operational Verifier Scanner:</strong> Test barcode and QR code payloads against issued passenger tickets in real time. Validate passenger boarding, detect duplicates, and record verifiable verification audits.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Select Active Station / Terminal</label>
              <select
                className="form-control"
                value={testStationName}
                onChange={(e) => setTestStationName(e.target.value)}
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.name}>{st.name} ({st.city})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Authorized Verifier Officer</label>
              <select
                className="form-control"
                value={testVerifierName}
                onChange={(e) => setTestVerifierName(e.target.value)}
              >
                {orgVerifiers.map((v) => (
                  <option key={v.id} value={v.name}>{v.name} ({v.status})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Ticket Selector Bar */}
          <div>
            <label className="form-label" style={{ fontWeight: 700, marginBottom: "0.4rem" }}>
              Quick Select Sample Ticket to Test:
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {tickets.slice(0, 4).map((tk) => (
                <button
                  key={tk.id}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: "0.75rem",
                    borderColor: testTicketInput === tk.ticketNumber ? "var(--primary)" : undefined,
                    background: testTicketInput === tk.ticketNumber ? "rgba(37, 99, 235, 0.1)" : undefined
                  }}
                  onClick={() => {
                    setTestTicketInput(tk.ticketNumber);
                    handleTestVerifyAction(tk.ticketNumber);
                  }}
                >
                  <code>{tk.ticketNumber}</code> ({tk.passengerName?.split(" ")[0]} - {tk.status})
                </button>
              ))}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: "0.75rem", color: "#ef4444", borderColor: "#fca5a5" }}
                onClick={() => {
                  setTestTicketInput("ET-INVALID-9999");
                  handleTestVerifyAction("ET-INVALID-9999");
                }}
              >
                <code>ET-INVALID-9999</code> (Test Invalid)
              </button>
            </div>
          </div>

          {/* Manual Input */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>Or Enter Ticket Code / Scan Payload:</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. ET-TKT-9001 or booking reference"
                value={testTicketInput}
                onChange={(e) => setTestTicketInput(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: "#059669", borderColor: "#059669" }}
                onClick={() => handleTestVerifyAction()}
                disabled={isVerifying}
              >
                <QrCode size={16} /> Verify
              </button>
            </div>
          </div>

          {/* Verification Result Banner */}
          {verificationResult && (
            <div
              style={{
                borderRadius: "10px",
                padding: "1rem",
                border: "1px solid",
                borderColor:
                  verificationResult.status === "VALID"
                    ? "#10b981"
                    : verificationResult.status === "ALREADY_USED"
                    ? "#f59e0b"
                    : "#ef4444",
                background:
                  verificationResult.status === "VALID"
                    ? "rgba(16, 185, 129, 0.08)"
                    : verificationResult.status === "ALREADY_USED"
                    ? "rgba(245, 158, 11, 0.08)"
                    : "rgba(239, 68, 68, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    padding: "0.25rem 0.65rem",
                    borderRadius: "6px",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    color: "#ffffff",
                    background:
                      verificationResult.status === "VALID"
                        ? "#10b981"
                        : verificationResult.status === "ALREADY_USED"
                        ? "#f59e0b"
                        : "#ef4444",
                  }}
                >
                  {verificationResult.status}
                </span>
                <strong style={{ fontSize: "0.95rem" }}>{verificationResult.message}</strong>
              </div>

              {verificationResult.ticket && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.75rem", fontSize: "0.82rem", background: "var(--bg-card, #ffffff)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                  <div><strong>Passenger:</strong> {verificationResult.ticket.passengerName}</div>
                  <div><strong>Seat Number:</strong> Seat #{verificationResult.ticket.seatNumber}</div>
                  <div><strong>Trip Code:</strong> {verificationResult.ticket.tripCode}</div>
                  <div><strong>Ticket Code:</strong> <code>{verificationResult.ticket.ticketNumber}</code></div>
                  <div><strong>Route:</strong> {verificationResult.ticket.departureStation} → {verificationResult.ticket.arrivalStation}</div>
                  <div><strong>Boarding Status:</strong> <span style={{ color: "#10b981", fontWeight: 700 }}>BOARDED / CLEARED</span></div>
                </div>
              )}
            </div>
          )}

          {/* Recent Verifications Log preview */}
          <div>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", fontWeight: 700 }}>Recent Terminal Verifications ({verifications.length}):</h4>
            <div style={{ maxHeight: "160px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
              <table className="data-table" style={{ fontSize: "0.78rem" }}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Ticket #</th>
                    <th>Passenger</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.slice(0, 5).map((v) => (
                    <tr key={v.id}>
                      <td>{v.scannedAt}</td>
                      <td><code>{v.ticketNumber}</code></td>
                      <td>{v.passengerName}</td>
                      <td><Badge status={v.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManagerVerifiersPage;
