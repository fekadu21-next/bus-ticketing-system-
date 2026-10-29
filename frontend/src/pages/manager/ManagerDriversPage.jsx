import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { UserCheck, Plus, Search, Award, RefreshCw, UserX, Eye, Pencil, Trash2, AlertCircle, AlertTriangle } from "lucide-react";

export const ManagerDriversPage = () => {
  const { t } = useTranslation();
  const {
    drivers,
    trips,
    selectedOrgId,
    addDriver,
    updateDriver,
    deleteDriver,
    toggleStaffStatus,
    fetchCoordinatorData,
    isLoadingData,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Add Driver Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+251911000000");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Driver@123456");
  const [licenseNumber, setLicenseNumber] = useState("");

  // View Driver Modal State
  const [viewingDriver, setViewingDriver] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Edit Driver Modal State
  const [editingDriver, setEditingDriver] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLicenseNumber, setEditLicenseNumber] = useState("");
  const [editError, setEditError] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Driver Modal State
  const [deletingDriver, setDeletingDriver] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [assignedTripsForDeleting, setAssignedTripsForDeleting] = useState([]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const resetForm = () => {
    setName("");
    setPhone("+251911000000");
    setEmail("");
    setPassword("Driver@123456");
    setLicenseNumber("");
    setAddError("");
  };

  const orgDrivers = React.useMemo(() => {
    if (!selectedOrgId || selectedOrgId === "ALL") return drivers;
    const filtered = drivers.filter((d) => d.organizationId === selectedOrgId);
    return filtered.length > 0 ? filtered : drivers;
  }, [drivers, selectedOrgId]);

  const filteredDrivers = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orgDrivers.filter((d) => {
      const matchesStatus = filterStatus === "ALL" || d.status === filterStatus;
      const matchesSearch =
        !q ||
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.phone && d.phone.toLowerCase().includes(q)) ||
        (d.licenseNumber && d.licenseNumber.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [orgDrivers, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filteredDrivers.length / pageSize) || 1;
  const paginatedDrivers = React.useMemo(() => {
    return filteredDrivers.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [filteredDrivers, currentPage, pageSize]);

  const handleQuickTestAdd = async () => {
    const testNames = ["Kiros Gebre", "Henok Asfaw", "Nebiyu Tesfaye", "Marta Mengistu", "Ephrem Zewdu", "Alula Yohannes"];
    const randomName = testNames[Math.floor(Math.random() * testNames.length)] + ` (${Math.floor(10 + Math.random() * 90)})`;
    try {
      await addDriver({
        name: randomName,
        phone: "+25191" + Math.floor(1000000 + Math.random() * 9000000),
        email: `${randomName.toLowerCase().replace(/[^a-z]/g, "")}@operator.et`,
        password: "Driver@123456",
        licenseNumber: `DL-ETH-${Math.floor(10000 + Math.random() * 90000)}-CAT-4`,
      });
    } catch {
      // toast handled
    }
  };

  const handleAddDriver = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setAddError("Driver name is required.");
      return;
    }
    setAddError("");
    setIsSubmitting(true);
    try {
      const driverEmail = email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, ".")}@operator.et`;
      const driverPassword = password.trim() || "Driver@123456";

      await addDriver({
        name: name.trim(),
        phone: phone.trim(),
        email: driverEmail,
        password: driverPassword,
        licenseNumber: licenseNumber.trim() || undefined,
      });
      resetForm();
      setShowAddModal(false);
    } catch (err) {
      setAddError(err.response?.data?.message || err.message || "Failed to register driver.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenView = (driver) => {
    setViewingDriver(driver);
    setShowViewModal(true);
  };

  const handleOpenEdit = (driver) => {
    setEditingDriver(driver);
    setEditName(driver.name || "");
    setEditPhone(driver.phone || "");
    setEditLicenseNumber(driver.licenseNumber || "");
    setEditError("");
    setShowEditModal(true);
  };

  const handleUpdateDriver = async (e) => {
    if (e) e.preventDefault();
    if (!editName.trim()) {
      setEditError("Driver name is required.");
      return;
    }
    setEditError("");
    setIsSubmittingEdit(true);
    try {
      await updateDriver(editingDriver.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        licenseNumber: editLicenseNumber.trim() || undefined,
      });
      setShowEditModal(false);
      setEditingDriver(null);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || "Failed to update driver.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenDelete = (driver) => {
    setDeletingDriver(driver);
    setDeleteError("");
    const activeAssigned = (trips || []).filter(
      (t) =>
        (t.driverId === driver.id || t.driverName?.toLowerCase() === driver.name?.toLowerCase()) &&
        (t.status === "SCHEDULED" || t.status === "PUBLISHED" || t.status === "IN_TRANSIT")
    );
    setAssignedTripsForDeleting(activeAssigned);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDriver) return;
    setDeleteError("");
    setIsSubmittingDelete(true);
    try {
      await deleteDriver(deletingDriver.id);
      setShowDeleteModal(false);
      setDeletingDriver(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || "Failed to remove driver.");
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>{t("managerDrivers.title", "Drivers")}</h1>
          <p>{t("managerDrivers.subtitle", "Registered and authorized commercial drivers assigned to your fleet.")}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchCoordinatorData(selectedOrgId)}
            disabled={isLoadingData}
          >
            <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> {t("common.refresh", "Refresh")}
          </button>
          <button
            className="btn btn-secondary"
            style={{ borderColor: "var(--primary)", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            onClick={handleQuickTestAdd}
            title="Quickly register a test commercial driver"
          >
            <UserCheck size={15} /> Test Add Driver
          </button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} /> {t("managerDrivers.registerBtn", "Register Driver")}
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
                placeholder={t("managerDrivers.searchPlaceholder", "Search driver name, phone, license...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">{t("managerDrivers.allStatuses", "All Statuses")}</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {t("managerDrivers.totalDrivers", "Total Drivers")}: <strong>{orgDrivers.length}</strong>
          </div>
        </div>

        {filteredDrivers.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <UserCheck size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>{t("managerDrivers.noDrivers", "No registered drivers matching your filter.")}</div>
            {orgDrivers.length === 0 && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={() => { resetForm(); setShowAddModal(true); }}
              >
                <Plus size={14} /> {t("managerDrivers.registerFirst", "Register First Driver")}
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "900px" }}>
              <thead>
                <tr>
                  <th>{t("managerDrivers.tableName", "Driver Name")}</th>
                  <th>{t("managerDrivers.tablePhone", "Phone Number")}</th>
                  <th>{t("managerDrivers.tableEmail", "Email")}</th>
                  <th>License Number</th>
                  <th>{t("managerDrivers.tableTrips", "Completed Trips")}</th>
                  <th>{t("managerDrivers.tableStatus", "Status")}</th>
                  <th style={{ textAlign: "right" }}>{t("common.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDrivers.map((d) => {
                  const isActive = d.status === "ACTIVE";
                  return (
                    <tr key={d.id}>
                      <td>
                        <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <UserCheck size={14} color="var(--primary)" /> {d.name}
                        </strong>
                      </td>
                      <td>{d.phone || "—"}</td>
                      <td><code>{d.email || "—"}</code></td>
                      <td>{d.licenseNumber ? <code>{d.licenseNumber}</code> : "—"}</td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{d.totalTripsCompleted || 0}</span>
                      </td>
                      <td><Badge status={d.status} /></td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenView(d)}
                            title="View driver details"
                          >
                            <Eye size={13} /> {t("common.view", "View")}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEdit(d)}
                            title="Edit driver"
                          >
                            <Pencil size={13} /> {t("common.edit", "Edit")}
                          </button>
                          <button
                            className={`btn btn-sm ${isActive ? "btn-secondary" : "btn-success"}`}
                            onClick={() => toggleStaffStatus(d.id, !isActive)}
                            title={isActive ? t("managerDrivers.deactivate", "Deactivate") : t("managerDrivers.activate", "Activate")}
                          >
                            {isActive ? t("managerDrivers.deactivate", "Deactivate") : t("managerDrivers.activate", "Activate")}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleOpenDelete(d)}
                            title="Delete driver"
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
          totalItems={filteredDrivers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          itemLabel="drivers"
        />
      </div>

      {/* View Driver Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingDriver(null); }}
        title="Driver Profile & Operational Record"
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowViewModal(false); setViewingDriver(null); }}
            >
              {t("common.close", "Close")}
            </button>
            {viewingDriver && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  const driver = viewingDriver;
                  setShowViewModal(false);
                  setViewingDriver(null);
                  handleOpenEdit(driver);
                }}
              >
                <Pencil size={14} /> {t("common.edit", "Edit Driver")}
              </button>
            )}
          </div>
        }
      >
        {viewingDriver && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Full Name</span>
                <strong style={{ fontSize: "1.1rem", color: "var(--text-main)" }}>{viewingDriver.name}</strong>
              </div>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Operational Status</span>
                <div style={{ marginTop: "0.25rem" }}>
                  <Badge status={viewingDriver.status} />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Contact Phone</span>
                <span style={{ fontWeight: 600 }}>{viewingDriver.phone || "—"}</span>
              </div>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Account Email</span>
                <code>{viewingDriver.email || "—"}</code>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Driver License Number</span>
                <code>{viewingDriver.licenseNumber || "Standard Commercial License"}</code>
              </div>
              <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Completed Trips</span>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>{viewingDriver.totalTripsCompleted || 0} Trips</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Driver Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingDriver(null); }}
        title="Edit Driver Profile"
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowEditModal(false); setEditingDriver(null); }}
              disabled={isSubmittingEdit}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpdateDriver}
              disabled={isSubmittingEdit || !editName.trim()}
            >
              {isSubmittingEdit ? t("common.saving", "Saving...") : t("common.saveChanges", "Save Changes")}
            </button>
          </div>
        }
      >
        <form onSubmit={handleUpdateDriver} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
            <label className="form-label">{t("managerDrivers.nameLabel", "Full Name")} *</label>
            <input
              type="text"
              className="form-control"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("managerDrivers.phoneLabel", "Phone Number")}</label>
            <input
              type="text"
              className="form-control"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Commercial License Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. DL-ETH-9824"
              value={editLicenseNumber}
              onChange={(e) => setEditLicenseNumber(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Driver Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletingDriver(null); }}
        title="Confirm Driver Removal"
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowDeleteModal(false); setDeletingDriver(null); }}
              disabled={isSubmittingDelete}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleConfirmDelete}
              disabled={isSubmittingDelete}
            >
              {isSubmittingDelete ? t("common.deleting", "Removing...") : "Remove Driver"}
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
                Are you sure you want to remove driver <strong>{deletingDriver?.name}</strong> from your organization?
              </p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Drivers assigned to upcoming scheduled or in-transit trips cannot be deleted until those trips are reassigned or cancelled.
              </p>
            </div>
          </div>

          {assignedTripsForDeleting.length > 0 && (
            <div style={{
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              borderRadius: "0.5rem",
              color: "#d97706",
              fontSize: "0.85rem",
            }}>
              <strong>Notice:</strong> This driver is currently assigned to {assignedTripsForDeleting.length} upcoming trip(s) (e.g. {assignedTripsForDeleting.map(t => t.tripCode || t.id.slice(0, 8)).join(", ")}). Reassign or cancel those trips before removing to prevent dispatch conflicts.
            </div>
          )}

          {deletingDriver && (
            <div style={{ background: "var(--bg-card, #f8fafc)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)", fontSize: "0.85rem" }}>
              <div><strong>Email:</strong> {deletingDriver.email}</div>
              <div><strong>Phone:</strong> {deletingDriver.phone || "—"}</div>
              <div><strong>Status:</strong> {deletingDriver.status}</div>
              <div><strong>Assigned Trips:</strong> {assignedTripsForDeleting.length} active</div>
            </div>
          )}
        </div>
      </Modal>

      {/* Add Driver Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t("managerDrivers.modalRegisterTitle", "Register Commercial Driver")}
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
              onClick={handleAddDriver}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? t("managerDrivers.saving", "Saving...") : t("managerDrivers.saveBtn", "Save Driver")}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddDriver} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
            <label className="form-label">{t("managerDrivers.nameLabel", "Full Name")} *</label>
            <input
              type="text"
              className="form-control"
              placeholder={t("managerDrivers.namePlaceholder", "e.g. Dawit Tadesse")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("managerDrivers.phoneLabel", "Phone Number")} *</label>
            <input
              type="text"
              className="form-control"
              placeholder={t("managerDrivers.phonePlaceholder", "+251911000000")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Commercial License Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. DL-ETH-5542"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
            />
          </div>

          <div className="form-divider" />

          <div className="form-group">
            <label className="form-label">{t("managerDrivers.emailLabel", "Email Address")}</label>
            <input
              type="email"
              className="form-control"
              placeholder={t("managerDrivers.emailPlaceholder", "dawit@operator.et")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {t("managerDrivers.emailHelp", "Leave empty to auto-generate from name.")}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t("managerDrivers.passwordLabel", "Temporary Password")}</label>
            <input
              type="password"
              className="form-control"
              placeholder={t("managerDrivers.passwordPlaceholder", "Driver@123456")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {t("managerDrivers.passwordHelp", "Driver will use this to sign in to the driver portal.")}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManagerDriversPage;
