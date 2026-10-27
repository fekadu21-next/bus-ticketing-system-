import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  getAdminPlatformFeedbacksApi,
  respondToPlatformFeedbackApi,
} from "../../api/feedback.api";
import {
  Search,
  RefreshCw,
  Star,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  User,
  Shield,
  MessageSquareQuote,
} from "lucide-react";

export const AdminFeedbackPage = () => {
  const { t } = useTranslation();
  const { showToast } = useApp();

  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unresolved: 0,
    averageRating: 0,
    statusCounts: { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 },
    starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Selected feedback for response modal
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseStatus, setResponseStatus] = useState("IN_PROGRESS");
  const [adminResponseText, setAdminResponseText] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  const fetchFeedbacks = useCallback(async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) setLoading(true);
      else setIsRefreshing(true);

      const params = {
        page: currentPage,
        limit: pageSize,
      };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await getAdminPlatformFeedbacksApi(params);
      if (res && res.success && res.data) {
        setFeedbacks(res.data.feedbacks || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalItems(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load platform feedbacks:", err);
      if (showToast) {
        showToast("Failed to load platform feedback data", "error");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, statusFilter, searchQuery, showToast]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Reset page when filters change
  const handleFilterChange = (setter, val) => {
    setter(val);
    setCurrentPage(1);
  };

  const handleOpenResponseModal = (fb) => {
    setSelectedFeedback(fb);
    setResponseStatus(fb.status === "OPEN" ? "IN_PROGRESS" : fb.status);
    setAdminResponseText(fb.admin_response || "");
  };

  const handleCloseModal = () => {
    setSelectedFeedback(null);
    setAdminResponseText("");
  };

  const handleSubmitResponse = async (e) => {
    e?.preventDefault();
    if (!selectedFeedback) return;

    try {
      setSubmittingResponse(true);
      await respondToPlatformFeedbackApi(selectedFeedback.id, {
        status: responseStatus,
        adminResponse: adminResponseText,
      });

      if (showToast) {
        showToast("Feedback status and response updated successfully.", "success");
      }
      handleCloseModal();
      fetchFeedbacks(true);
    } catch (err) {
      console.error("Error updating feedback response:", err);
      if (showToast) {
        showToast(err.response?.data?.message || "Failed to update feedback response", "error");
      }
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Filter feedbacks client-side for rating filter if set
  const displayedFeedbacks = useMemo(() => {
    if (ratingFilter === "ALL") return feedbacks;
    return feedbacks.filter((fb) => Number(fb.rating) === Number(ratingFilter));
  }, [feedbacks, ratingFilter]);

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5" title={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={
              star <= rating
                ? "text-amber-400 fill-amber-400"
                : "text-slate-300 dark:text-slate-600"
            }
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertCircle size={12} />
            {t("feedback.open", "Open")}
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock size={12} />
            {t("feedback.inReview", "In Progress")}
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={12} />
            {t("feedback.resolved", "Resolved")}
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {t("feedback.closed", "Closed")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-title">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <MessageSquareQuote className="text-blue-600 dark:text-blue-400" size={26} />
            {t("adminFeedback.title", "Platform Feedback & Rating Governance")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("adminFeedback.subtitle", "Supervise user feedback, track reported bugs and feature requests, and respond directly to improve system usability.")}
          </p>
        </div>

        <button
          className="btn btn-secondary inline-flex items-center gap-2 self-start sm:self-auto"
          onClick={() => fetchFeedbacks(true)}
          disabled={isRefreshing || loading}
        >
          <RefreshCw size={14} className={isRefreshing ? "spin animate-spin" : ""} />
          <span>{isRefreshing ? t("common.loading", "Refreshing...") : t("common.refresh", "Refresh")}</span>
        </button>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Feedback */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("adminFeedback.totalSubmissions", "Total Submissions")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {Number(stats.total || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {t("adminFeedback.totalSubmissions", "All user feedback recorded")}
          </div>
        </div>

        {/* Unresolved Issues */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {t("adminFeedback.unresolvedIssues", "Unresolved Issues")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {stats.unresolved || 0}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {stats.statusCounts?.OPEN || 0} Open, {stats.statusCounts?.IN_PROGRESS || 0} In Progress
          </div>
        </div>

        {/* Resolved Issues */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {t("feedback.resolved", "Resolved")} / {t("feedback.closed", "Closed")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {(stats.statusCounts?.RESOLVED || 0) + (stats.statusCounts?.CLOSED || 0)}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {t("feedback.adminResponse", "Addressed by platform administrators")}
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("adminFeedback.averageUserRating", "Average Rating")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Star size={18} className="fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.averageRating ? stats.averageRating.toFixed(1) : "0.0"}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 5.0</span>
          </div>
          <div className="mt-1">
            {renderStars(Math.round(stats.averageRating || 0))}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card-table-wrapper bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="card-header-toolbar p-4 border-b border-slate-200/80 dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {/* Search Input */}
            <div className="header-search relative min-w-[240px] flex-1 max-w-sm">
              <Search className="search-icon absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder={t("adminFeedback.searchPlaceholder", "Search user, email, comment...")}
                value={searchQuery}
                onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
            >
              <option value="ALL">{t("adminFeedback.allStatuses", "All Statuses")}</option>
              <option value="OPEN">{t("feedback.open", "Open")}</option>
              <option value="IN_PROGRESS">{t("feedback.inReview", "In Progress")}</option>
              <option value="RESOLVED">{t("feedback.resolved", "Resolved")}</option>
              <option value="CLOSED">{t("feedback.closed", "Closed")}</option>
            </select>

            {/* Rating Filter */}
            <select
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="ALL">{t("adminFeedback.allRatings", "All Ratings")}</option>
              <option value="5">5 Stars ★★★★★</option>
              <option value="4">4 Stars ★★★★☆</option>
              <option value="3">3 Stars ★★★☆☆</option>
              <option value="2">2 Stars ★★☆☆☆</option>
              <option value="1">1 Star ★☆☆☆☆</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-semibold text-right">
            Showing {displayedFeedbacks.length} of {totalItems} feedback submissions
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="py-20 text-center">
            <LoadingSpinner label={t("common.loading", "Loading platform feedback...")} />
          </div>
        ) : displayedFeedbacks.length === 0 ? (
          <div className="py-20 text-center">
            <MessageSquare size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              {t("adminFeedback.noSubmissionsFound", "No platform feedback found")}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Try clearing your filters or check back later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">{t("adminFeedback.colUser", "User")}</th>
                  <th className="px-5 py-3.5">{t("adminFeedback.colRating", "Rating")}</th>
                  <th className="px-5 py-3.5">{t("adminFeedback.colComment", "Comment")}</th>
                  <th className="px-5 py-3.5">{t("adminFeedback.colStatus", "Status")}</th>
                  <th className="px-5 py-3.5">{t("adminFeedback.colDate", "Date")}</th>
                  <th className="px-5 py-3.5 text-right">{t("adminFeedback.colAction", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {displayedFeedbacks.map((fb) => {
                  const authorName = fb.user
                    ? [fb.user.first_name, fb.user.last_name].filter(Boolean).join(" ")
                    : "Anonymous User";
                  const roleName = fb.user?.user_roles?.[0]?.roles?.name || "USER";
                  const dateStr = fb.created_at
                    ? new Date(fb.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recent";

                  return (
                    <tr
                      key={fb.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors"
                    >
                      {/* User */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white leading-tight">
                              {authorName}
                            </div>
                            <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                              {fb.user?.email || "No email"}
                            </div>
                            <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {roleName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          {renderStars(fb.rating)}
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {fb.rating} of 5
                          </span>
                        </div>
                      </td>

                      {/* Comment */}
                      <td className="px-5 py-4 max-w-xs sm:max-w-md">
                        <p className="text-slate-800 dark:text-slate-200 font-medium line-clamp-2">
                          "{fb.comment}"
                        </p>
                        {fb.admin_response && (
                          <div className="mt-1.5 p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300">
                            <span className="font-bold">Admin Reply: </span>
                            <span className="line-clamp-1">{fb.admin_response}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getStatusBadge(fb.status)}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-medium">
                        {dateStr}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenResponseModal(fb)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Send size={12} />
                          <span>{fb.admin_response ? "Update Reply" : "Respond"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-700 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Admin Response Modal */}
      {selectedFeedback && (
        <Modal
          isOpen={!!selectedFeedback}
          onClose={handleCloseModal}
          title={t("adminFeedback.respondModalTitle", "Review & Respond to Platform Feedback")}
          maxWidth="600px"
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseModal}
                disabled={submittingResponse}
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                className="btn btn-primary inline-flex items-center gap-2"
                onClick={handleSubmitResponse}
                disabled={submittingResponse}
              >
                {submittingResponse ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{t("adminFeedback.submittingBtn", "Saving...")}</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>{t("adminFeedback.submitResponseBtn", "Save Response & Status")}</span>
                  </>
                )}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Feedback Info Header */}
            <div className="bg-slate-50 dark:bg-slate-900/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedFeedback.user
                      ? [selectedFeedback.user.first_name, selectedFeedback.user.last_name]
                          .filter(Boolean)
                          .join(" ")
                      : t("adminFeedback.colUser", "Anonymous")}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({selectedFeedback.user?.email || "No email"})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <div className="flex items-center gap-2">
                  <span>{t("adminFeedback.colRating", "Rating")}:</span>
                  {renderStars(selectedFeedback.rating)}
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {selectedFeedback.rating}/5
                  </span>
                </div>
                <span>
                  {selectedFeedback.created_at
                    ? new Date(selectedFeedback.created_at).toLocaleString()
                    : t("feedback.recent", "Recent")}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 italic">
                "{selectedFeedback.comment}"
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t("adminFeedback.statusLabel", "Feedback Status")}
              </label>
              <select
                value={responseStatus}
                onChange={(e) => setResponseStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="OPEN">{t("feedback.open", "Open")}</option>
                <option value="IN_PROGRESS">{t("feedback.inReview", "In Progress")}</option>
                <option value="RESOLVED">{t("feedback.resolved", "Resolved")}</option>
                <option value="CLOSED">{t("feedback.closed", "Closed")}</option>
              </select>
            </div>

            {/* Admin Response Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t("adminFeedback.responseLabel", "Official Admin Response / Notes to User")}
              </label>
              <textarea
                rows={4}
                value={adminResponseText}
                onChange={(e) => setAdminResponseText(e.target.value)}
                placeholder={t("adminFeedback.responsePlaceholder", "Write a clear response to the user explaining what action has been taken or addressing their feedback...")}
                className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The user will be notified of this response in their feedback tracking view and platform notifications.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminFeedbackPage;

