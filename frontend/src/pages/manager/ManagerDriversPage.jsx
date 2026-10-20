import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { UserCheck, Plus, Search, Award, RefreshCw, UserX } from "lucide-react";

export const ManagerDriversPage = () => {
  const { t } = useTranslation();
  const {
    drivers,
    selectedOrgId,
    addDriver,
    toggleStaffStatus,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+251911000000");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Driver@123456");
  const [licenseNumber, setLicenseNumber] = useState("");

  const resetForm = () => {
    setName("");
    setPhone("+251911000000");
    setEmail("");
    setPassword("Driver@123456");
    setLicenseNumber("");
  };

  const orgDrivers = drivers.filter((d) => d.organizationId === selectedOrgId);
  const filteredDrivers = orgDrivers.filter((d) => {
    const matchesStatus = filterStatus === "ALL" || d.status === filterStatus;
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.phone && d.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.licenseNumber && d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredDrivers.length / pageSize) || 1;
  const paginatedDrivers = filteredDrivers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleAddDriver = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const driverEmail = email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, ".")}@operator.et`;
      const driverPassword = password.trim() || "Driver@123456";

      console.log('Submitting driver data:', {
        name: name.trim(),
        phone: phone.trim(),
        email: driverEmail,
        password: driverPassword,
      });

      await addDriver({
        name: name.trim(),
        phone: phone.trim(),
        email: driverEmail,
        password: driverPassword,
      });
      resetForm();
      setShowAddModal(false);
    } catch (err) {
      console.error('Driver submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>{t("managerDrivers.title")}</h1>
          <p>{t("managerDrivers.subtitle")}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchCoordinatorData(selectedOrgId)}
            disabled={isLoadingData}
          >
            <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> {t("common.refresh", "Refresh")}
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> {t("managerDrivers.registerBtn")}
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
                placeholder={t("managerDrivers.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">{t("managerDrivers.allStatuses")}</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {t("managerDrivers.totalDrivers")}: <strong>{orgDrivers.length}</strong>
          </div>
        </div>

        {filteredDrivers.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <UserCheck size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>{t("managerDrivers.noDrivers")}</div>
            {orgDrivers.length === 0 && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={14} /> {t("managerDrivers.registerFirst")}
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "800px" }}>
            <thead>
              <tr>
                <th>{t("managerDrivers.tableName")}</th>
                <th>{t("managerDrivers.tablePhone")}</th>
                <th>{t("managerDrivers.tableEmail")}</th>
                <th>{t("managerDrivers.tableTrips")}</th>
                <th>{t("managerDrivers.tableStatus")}</th>
                <th>{t("managerDrivers.tableAction")}</th>
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
                    <td>
                      <span style={{ fontWeight: 700 }}>{d.totalTripsCompleted || 0}</span>
                    </td>
                    <td><Badge status={d.status} /></td>
                    <td>
                      <button
                        className={`btn btn-sm ${isActive ? "btn-secondary" : "btn-success"}`}
                        onClick={() => toggleStaffStatus(d.id, !isActive)}
                        title={isActive ? t("managerDrivers.deactivate") : t("managerDrivers.activate")}
                      >
                        {isActive ? t("managerDrivers.deactivate") : t("managerDrivers.activate")}
                      </button>
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

      {/* Add Driver Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t("managerDrivers.modalRegisterTitle")}
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
              {isSubmitting ? t("managerDrivers.saving") : t("managerDrivers.saveBtn")}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddDriver} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div className="form-group">
            <label className="form-label">
              {t("managerDrivers.nameLabel")}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={t("managerDrivers.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("managerDrivers.phoneLabel")}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={t("managerDrivers.phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-divider" />

          <div className="form-group">
            <label className="form-label">
              {t("managerDrivers.emailLabel")}
            </label>
            <input
              type="email"
              className="form-control"
              placeholder={t("managerDrivers.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {t("managerDrivers.emailHelp")}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("managerDrivers.passwordLabel")}
            </label>
            <input
              type="password"
              className="form-control"
              placeholder={t("managerDrivers.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {t("managerDrivers.passwordHelp")}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManagerDriversPage;
