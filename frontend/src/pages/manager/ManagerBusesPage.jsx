import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { Bus, Plus, Search, AlertCircle, RefreshCw } from "lucide-react";

export const ManagerBusesPage = () => {
  const { t } = useTranslation();
  const {
    buses,
    selectedOrgId,
    addBus,
    updateBusStatus,
    fetchCoordinatorData,
    isLoadingData
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery]);

  const [busNumber, setBusNumber] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [capacity, setCapacity] = useState(45);
  const [model, setModel] = useState("");
  const [manufactureYear, setManufactureYear] = useState("2023");

  const orgBuses = buses.filter((b) => b.organizationId === selectedOrgId);
  const filteredBuses = orgBuses.filter((b) => {
    const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
    const matchesSearch =
      (b.plateNumber && b.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.busNumber && b.busNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.model && b.model.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredBuses.length / pageSize) || 1;
  const paginatedBuses = filteredBuses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleAddBus = async (e) => {
    if (e) e.preventDefault();
    setFormError("");
    const trimmedPlate = plateNumber.trim();
    if (!trimmedPlate) {
      setFormError("Plate number is required.");
      return;
    }
    if (Number(capacity) <= 0 || isNaN(capacity)) {
      setFormError("Please enter a valid passenger seat capacity.");
      return;
    }

    const localDuplicate = orgBuses.find(
      (b) => b.plateNumber && b.plateNumber.trim().toLowerCase() === trimmedPlate.toLowerCase()
    );
    if (localDuplicate) {
      setFormError(`A bus with plate number '${trimmedPlate}' is already registered in your fleet.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addBus({
        busNumber: busNumber.trim() || trimmedPlate,
        plateNumber: trimmedPlate,
        capacity: Number(capacity),
        model: model.trim() || "Standard Coach",
        manufactureYear,
        organizationId: selectedOrgId
      });
      setBusNumber("");
      setPlateNumber("");
      setCapacity(45);
      setModel("");
      setFormError("");
      setShowAddModal(false);
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        err.message ||
        `Failed to add bus with plate '${trimmedPlate}'. A vehicle with this plate may already be registered.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>{t("managerBuses.title", "Fleet & Buses")}</h1>
          <p>{t("managerBuses.subtitle", "Manage vehicle inventory and operational statuses for your organization fleet.")}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchCoordinatorData(selectedOrgId)}
            disabled={isLoadingData}
          >
            <RefreshCw size={15} className={isLoadingData ? "spin" : ""} /> {t("common.refresh", "Refresh")}
          </button>
          <button className="btn btn-primary" onClick={() => { setFormError(""); setShowAddModal(true); }}>
            <Plus size={16} /> {t("managerBuses.registerBtn", "Register New Bus")}
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
                placeholder={t("managerBuses.searchPlaceholder", "Search bus #, plate, model...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="org-selector-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">{t("managerBuses.allStatuses", "All Statuses")}</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {t("managerBuses.totalBuses", "Total Company Buses")}: <strong>{orgBuses.length}</strong>
          </div>
        </div>

        {filteredBuses.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <Bus size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
            <div>{t("managerBuses.noVehicles", "No vehicles matching your filter.")}</div>
            {orgBuses.length === 0 && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={() => { setFormError(""); setShowAddModal(true); }}
              >
                <Plus size={14} /> {t("managerBuses.registerFirst", "Register First Bus")}
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "900px" }}>
            <thead>
              <tr>
                <th>{t("managerBuses.tableBusCode", "Bus Code")}</th>
                <th>{t("managerBuses.tablePlateNumber", "Plate Number")}</th>
                <th>{t("managerBuses.tableModel", "Vehicle Model")}</th>
                <th>{t("managerBuses.tableCapacity", "Passenger Capacity")}</th>
                <th>{t("managerBuses.tableYear", "Year")}</th>
                <th>{t("managerBuses.tableStatus", "Status")}</th>
                <th>{t("managerBuses.tableLastUpdate", "Last Update")}</th>
                <th>{t("managerBuses.tableAction", "Status Action")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBuses.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Bus size={14} color="var(--primary)" /> {b.busNumber}
                    </strong>
                  </td>
                  <td><code>{b.plateNumber}</code></td>
                  <td>{b.model}</td>
                  <td><span style={{ fontWeight: 700 }}>{b.capacity} {t("managerBuses.seatsSuffix", "Seats")}</span></td>
                  <td>{b.manufactureYear}</td>
                  <td><Badge status={b.status} /></td>
                  <td>{b.lastMaintenance}</td>
                  <td>
                    <select
                      className="org-selector-select"
                      value={b.status}
                      onChange={(e) => updateBusStatus(b.id, e.target.value)}
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBuses.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel={t("managerBuses.title", "fleet buses")}
        />
      </div>

      {/* Add Bus Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t("managerBuses.modalTitle", "Register New Fleet Vehicle")}
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
              onClick={handleAddBus}
              disabled={isSubmitting || !plateNumber.trim()}
            >
              {isSubmitting ? t("managerBuses.saving", "Saving...") : t("managerBuses.saveBtn", "Save Vehicle")}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddBus} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {formError && (
            <div style={{
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "0.5rem",
              color: "#ef4444",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem"
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t("managerBuses.busNumberLabel", "Bus Number / Operational Code")}</label>
              <input
                type="text"
                className="form-control"
                placeholder={t("managerBuses.busNumberPlaceholder", "e.g. SLM-104")}
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("managerBuses.plateNumberLabel", "Plate Number")} *</label>
              <input
                type="text"
                className="form-control"
                placeholder={t("managerBuses.plateNumberPlaceholder", "e.g. ET-3-55109")}
                value={plateNumber}
                onChange={(e) => {
                  setPlateNumber(e.target.value);
                  if (formError) setFormError("");
                }}
                required
              />
              <span className="help-text">
                {t("managerBuses.plateHint", "Must be unique within your organization.")}
              </span>
            </div>
          </div>

          <div className="form-divider" />

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t("managerBuses.capacityLabel", "Passenger Seat Capacity")} *</label>
              <input
                type="number"
                className="form-control"
                min="10"
                max="80"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("managerBuses.yearLabel", "Manufacture Year")}</label>
              <input
                type="text"
                className="form-control"
                value={manufactureYear}
                onChange={(e) => setManufactureYear(e.target.value)}
              />
            </div>
          </div>

          <div className="form-divider" />

          <div className="form-group">
            <label className="form-label">{t("managerBuses.modelLabel", "Bus Make & Model Specification")}</label>
            <input
              type="text"
              className="form-control"
              placeholder={t("managerBuses.modelPlaceholder", "e.g. Yutong ZK6129 Luxury Coach")}
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManagerBusesPage;
