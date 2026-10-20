import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { QrCode, Plus, Search, ShieldCheck, RefreshCw } from "lucide-react";

export const ManagerVerifiersPage = () => {
  const { t } = useTranslation();
  const {
    verifiers,
    stations,
    selectedOrgId,
    addVerifier,
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
  const [password, setPassword] = useState("Verifier@123456");
  const [assignedStation, setAssignedStation] = useState(stations[0]?.name || "Addis Ababa Autobus Terra");

  const orgVerifiers = verifiers.filter((v) => v.organizationId === selectedOrgId);
  const filteredVerifiers = orgVerifiers.filter((v) => {
    const matchesStatus = filterStatus === "ALL" || v.status === filterStatus;
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.email && v.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.assignedStation && v.assignedStation.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredVerifiers.length / pageSize) || 1;
  const paginatedVerifiers = filteredVerifiers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleAddVerifier = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
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
      setName("");
      setPhone("+251911000000");
      setEmail("");
      setPassword("Verifier@123456");
      setShowAddModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>{t("managerVerifiers.title")}</h1>
          <p>{t("managerVerifiers.subtitle")}</p>
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
            <Plus size={16} /> {t("managerVerifiers.registerBtn")}
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
                placeholder={t("managerVerifiers.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">{t("managerVerifiers.allStatuses")}</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {t("managerVerifiers.totalVerifiers")}: <strong>{orgVerifiers.length}</strong>
          </div>
        </div>

        {filteredVerifiers.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <QrCode size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>{t("managerVerifiers.noVerifiers")}</div>
            {orgVerifiers.length === 0 && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={14} /> {t("managerVerifiers.registerFirst")}
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "800px" }}>
            <thead>
              <tr>
                <th>{t("managerVerifiers.tableName")}</th>
                <th>{t("managerVerifiers.tablePhone")}</th>
                <th>{t("managerVerifiers.tableEmail")}</th>
                <th>{t("managerVerifiers.tableStation")}</th>
                <th>{t("managerVerifiers.tableStatus")}</th>
                <th>{t("managerVerifiers.tableAction")}</th>
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
                    <td>
                      <button
                        className={`btn btn-sm ${isActive ? "btn-secondary" : "btn-success"}`}
                        onClick={() => toggleStaffStatus(v.id, !isActive)}
                        title={isActive ? t("managerVerifiers.deactivate") : t("managerVerifiers.activate")}
                      >
                        {isActive ? t("managerVerifiers.deactivate") : t("managerVerifiers.activate")}
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

      {/* Add Verifier Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t("managerVerifiers.modalRegisterTitle")}
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
              {isSubmitting ? t("managerVerifiers.saving") : t("managerVerifiers.saveBtn")}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddVerifier} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div className="form-group">
            <label className="form-label">
              {t("managerVerifiers.nameLabel")}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={t("managerVerifiers.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("managerVerifiers.phoneLabel")}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={t("managerVerifiers.phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-divider" />

          <div className="form-group">
            <label className="form-label">
              {t("managerVerifiers.emailLabel")}
            </label>
            <input
              type="email"
              className="form-control"
              placeholder={t("managerVerifiers.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {t("managerVerifiers.emailHelp")}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("managerVerifiers.passwordLabel")}
            </label>
            <input
              type="password"
              className="form-control"
              placeholder={t("managerVerifiers.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {t("managerVerifiers.passwordHelp")}
            </div>
          </div>

          <div className="form-divider" />

          <div className="form-group">
            <label className="form-label">
              {t("managerVerifiers.stationLabel")}
            </label>
            <select
              className="form-control"
              value={assignedStation}
              onChange={(e) => setAssignedStation(e.target.value)}
            >
              {stations.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManagerVerifiersPage;
