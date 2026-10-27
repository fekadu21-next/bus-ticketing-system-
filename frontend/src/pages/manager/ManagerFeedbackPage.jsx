import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { Pagination } from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { getCoordinatorTripFeedbackApi } from "../../api/feedback.api";
import { PlatformFeedbackModal } from "../../components/feedback/PlatformFeedbackModal";
import {
  Star,
  Search,
  RefreshCw,
  MessageSquare,
  MessageSquareQuote,
  ShieldAlert,
  Calendar,
  Bus,
  MapPin,
  CheckCircle2,
  TrendingUp,
  UserCheck,
  Lock,
  Info,
} from "lucide-react";

export const ManagerFeedbackPage = () => {
  const { t } = useTranslation();
  const { selectedOrgId, activeOrg, showToast } = useApp();

  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    completedTripsRated: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showPlatformFeedbackModal, setShowPlatformFeedbackModal] = useState(false);
  const pageSize = 10;

  const fetchReviews = useCallback(
    async (isBackgroundRefresh = false) => {
      try {
        if (!isBackgroundRefresh) setLoading(true);
        else setIsRefreshing(true);

        const params = {
          page: currentPage,
          limit: pageSize,
        };
        if (ratingFilter !== "ALL") params.rating = ratingFilter;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const res = await getCoordinatorTripFeedbackApi(selectedOrgId, params);
        if (res && res.success && res.data) {
          setFeedbacks(res.data.feedbacks || []);
          if (res.data.stats) {
            setStats(res.data.stats);
          }
          setTotalPages(res.data.totalPages || 1);
          setTotalItems(res.data.total || 0);
        }
      } catch (err) {
        console.error("Failed to load organization trip feedback:", err);
        if (showToast) {
          showToast("Failed to load trip reviews", "error");
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedOrgId, currentPage, ratingFilter, searchQuery, showToast]
  );

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleFilterChange = (setter, val) => {
    setter(val);
    setCurrentPage(1);
  };

  const renderStars = (rating, size = 14) => {
    return (
      <div className="flex items-center gap-0.5" title={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
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

  // Compute 5-star percentage
  const fiveStarPct = useMemo(() => {
    if (!stats.totalReviews || stats.totalReviews === 0) return 0;
    return Math.round(((stats.starCounts?.[5] || 0) / stats.totalReviews) * 100);
  }, [stats]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-title">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Star className="text-amber-500 fill-amber-400" size={26} />
            {t("managerFeedback.title", "Passenger Trip Reviews & Quality Ratings")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("managerFeedback.subtitle", {
              organization: activeOrg?.name || "your organization",
              defaultValue: `Examine passenger feedback and driver service ratings for completed trips operated by ${activeOrg?.name || "your organization"}.`,
            })}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            className="btn btn-secondary inline-flex items-center gap-2"
            onClick={() => fetchReviews(true)}
            disabled={isRefreshing || loading}
          >
            <RefreshCw size={14} className={isRefreshing ? "spin animate-spin" : ""} />
            <span>{isRefreshing ? t("common.loading", "Refreshing...") : t("common.refresh", "Refresh")}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary inline-flex items-center gap-2 shadow-sm"
            onClick={() => setShowPlatformFeedbackModal(true)}
          >
            <MessageSquareQuote size={15} />
            <span>{t("managerFeedback.writeFeedbackBtn", "Write Feedback")}</span>
          </button>
        </div>
      </div>

      {/* Security & Read-Only Notice */}
      <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-3">
        <Info className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" size={18} />
        <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
          <span className="font-bold">Authentic Passenger Governance: </span>
          {t("managerFeedback.noReviewsDesc", "Trip reviews are submitted exclusively by verified passengers who completed their scheduled journey. To protect integrity and passenger trust, reviews cannot be edited or deleted by operational managers.")}
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Rating */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("managerFeedback.avgRating", "Average Rating")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Star size={18} className="fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {stats.averageRating ? stats.averageRating.toFixed(2) : "0.00"}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 5.00</span>
          </div>
          <div className="mt-2">
            {renderStars(Math.round(stats.averageRating || 0), 16)}
          </div>
        </div>

        {/* Total Reviews */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("managerFeedback.totalReviews", "Total Reviews")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {Number(stats.totalReviews || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {t("managerFeedback.totalReviews", "Submitted passenger evaluations")}
          </div>
        </div>

        {/* Completed Trips Rated */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {t("managerFeedback.colRoute", "Completed Trips Rated")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {Number(stats.completedTripsRated || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Distinct scheduled routes reviewed
          </div>
        </div>

        {/* 5-Star Reviews */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {t("managerFeedback.fiveStarRatio", "5-Star Excellence")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {fiveStarPct}%
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {stats.starCounts?.[5] || 0} top-tier ratings
          </div>
        </div>
      </div>

      {/* Star Breakdown Card */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Rating Distribution
        </h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = stats.starCounts?.[stars] || 0;
            const pct = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-14 font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <span>{stars}</span>
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right font-bold text-slate-700 dark:text-slate-300">
                  {pct}%
                </span>
                <span className="w-12 text-right text-slate-400">
                  ({count})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews Table Card */}
      <div className="card-table-wrapper bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="card-header-toolbar p-4 border-b border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {/* Search Input */}
            <div className="header-search relative min-w-[240px] flex-1 max-w-sm">
              <Search className="search-icon absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder={t("managerFeedback.searchPlaceholder", "Search route corridor, comments...")}
                value={searchQuery}
                onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Rating Filter */}
            <select
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={ratingFilter}
              onChange={(e) => handleFilterChange(setRatingFilter, e.target.value)}
            >
              <option value="ALL">{t("managerFeedback.allRatings", "All Star Ratings")}</option>
              <option value="5">5 Stars ★★★★★</option>
              <option value="4">4 Stars ★★★★☆</option>
              <option value="3">3 Stars ★★★☆☆</option>
              <option value="2">2 Stars ★★☆☆☆</option>
              <option value="1">1 Star ★☆☆☆☆</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-semibold text-right">
            Showing {feedbacks.length} of {totalItems} trip reviews
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="py-20 text-center">
            <LoadingSpinner label={t("common.loading", "Loading trip reviews...")} />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="py-20 text-center">
            <Star size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              {t("managerFeedback.noReviewsTitle", "No trip reviews found")}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {t("managerFeedback.noReviewsDesc", "Once passengers complete their journeys and rate your trips, their reviews will appear here.")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">{t("managerFeedback.colRoute", "Trip & Route")}</th>
                  <th className="px-5 py-3.5">{t("managerFeedback.colBus", "Bus Fleet")}</th>
                  <th className="px-5 py-3.5">{t("managerFeedback.colPassenger", "Passenger")}</th>
                  <th className="px-5 py-3.5">{t("managerFeedback.colRating", "Rating")}</th>
                  <th className="px-5 py-3.5">{t("managerFeedback.colReview", "Passenger Review")}</th>
                  <th className="px-5 py-3.5">{t("managerFeedback.colDate", "Reviewed Date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {feedbacks.map((fb) => {
                  const dateStr = fb.createdAt
                    ? new Date(fb.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : t("feedback.recent", "Recent");

                  return (
                    <tr
                      key={fb.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors"
                    >
                      {/* Trip & Route */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <MapPin size={13} className="text-blue-500 shrink-0" />
                          <span>{fb.route}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {fb.tripCode}
                        </div>
                      </td>

                      {/* Bus Fleet */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                          <Bus size={13} className="text-slate-400" />
                          <span>{fb.busPlate}</span>
                        </div>
                      </td>

                      {/* Passenger */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                            ✓
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {fb.passengerName}
                          </span>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          {renderStars(fb.rating)}
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {fb.rating} of 5 Stars
                          </span>
                        </div>
                      </td>

                      {/* Comment */}
                      <td className="px-5 py-4 max-w-sm sm:max-w-md">
                        {fb.comment ? (
                          <p className="text-slate-800 dark:text-slate-200 font-medium italic">
                            "{fb.comment}"
                          </p>
                        ) : (
                          <span className="text-slate-400 italic">{t("managerFeedback.noComment", "No written comment provided")}</span>
                        )}
                      </td>

                      {/* Reviewed Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-medium">
                        {dateStr}
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

      {/* Platform Feedback Modal for Manager */}
      <PlatformFeedbackModal
        isOpen={showPlatformFeedbackModal}
        onClose={() => setShowPlatformFeedbackModal(false)}
      />
    </div>
  );
};

export default ManagerFeedbackPage;

