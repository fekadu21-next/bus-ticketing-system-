import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MessageSquareQuote,
  Star,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Loader2,
  History,
  Shield,
  Ticket,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  submitPlatformFeedbackApi,
  getMyPlatformFeedbacksApi,
} from "@/api/feedback.api";

export const FeedbackPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  const [activeTab, setActiveTab] = useState("submit"); // "submit" | "history"

  // Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // History state
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingHistory(true);
      const res = await getMyPlatformFeedbacksApi();
      if (res && res.success && res.data) {
        setMyFeedbacks(res.data.feedbacks || []);
      }
    } catch (err) {
      console.error("Failed to load user platform feedback history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getRatingLabel = (val) => {
    switch (val) {
      case 1:
        return t("feedback.rate1", "1 - Poor Experience");
      case 2:
        return t("feedback.rate2", "2 - Below Expectations");
      case 3:
        return t("feedback.rate3", "3 - Average / Satisfactory");
      case 4:
        return t("feedback.rate4", "4 - Good & Convenient");
      case 5:
        return t("feedback.rate5", "5 - Outstanding Platform");
      default:
        return "";
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!isAuthenticated) {
      setErrorMsg(t("feedback.errorAuth", "Please sign in to submit platform feedback."));
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      setErrorMsg(t("feedback.errorRating", "Please select a rating between 1 and 5 stars."));
      return;
    }
    if (!comment || !comment.trim()) {
      setErrorMsg(t("feedback.errorComment", "Please provide your feedback comments so we can understand your perspective."));
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      await submitPlatformFeedbackApi({
        rating,
        comment: comment.trim(),
      });

      setSuccessMsg(t("feedback.successSubmit", "Thank you for your feedback! It helps us continuously improve the platform."));
      setComment("");
      setRating(5);
      fetchHistory();
      setTimeout(() => {
        setSuccessMsg("");
        setActiveTab("history");
      }, 1500);
    } catch (err) {
      console.error("Failed to submit platform feedback:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Failed to submit your feedback. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock size={10} />
            {t("feedback.open", "Open")}
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock size={10} />
            {t("feedback.inReview", "In Review")}
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={10} />
            {t("feedback.resolved", "Resolved")}
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {t("feedback.closed", "Closed")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#f4f7fb] dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 pb-16 transition-colors">
      {/* Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/crops/detail_banner.jpg" alt="" className="w-full h-full object-cover object-[75%_center]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071833]/90 via-[#0b2a4a]/75 to-[#071833]/90" />
        </div>
        <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-6 pt-8 pb-16 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Link to="/my-bookings" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/90 hover:text-white">
              <Ticket size={14} />
              {t("nav.myBookings", "My Bookings")}
            </Link>
            <span className="text-white/40">•</span>
            <Link to="/" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/90 hover:text-white">
              {t("nav.home", "Home")}
            </Link>
          </div>
          <h1 className="mt-2 text-[32px] sm:text-[40px] font-black text-white tracking-tight">
            {t("feedback.pageTitle", "Platform Feedback & Support")}
          </h1>
          <p className="mt-1 text-[13px] text-white/80 max-w-lg mx-auto">
            {t("feedback.pageSubtitle", "Your voice shapes our platform. Rate your experience, report technical issues, or suggest new features.")}
          </p>
        </div>
      </section>

      {/* Main Centered Container */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-5 sm:p-8 space-y-6">
          {/* Centered Icon & Title */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 border border-blue-100 dark:border-blue-900/60 shadow-xs">
              <MessageSquareQuote size={28} />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t("feedback.shareTitle", "Share Your Platform Experience")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {t("feedback.shareSubtitle", "Tell platform administrators about your booking, travel, and general system experience.")}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 max-w-md mx-auto w-full">
            <button
              type="button"
              onClick={() => setActiveTab("submit")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "submit"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Send size={13} />
              <span>{t("feedback.submitTab", "Submit Feedback")}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "history"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <History size={13} />
              <span>{t("feedback.historyTab", "My Submitted Tickets")}</span>
              {myFeedbacks.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {myFeedbacks.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: Submit Form */}
          {activeTab === "submit" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Star Rating Section */}
              <div className="text-center py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {t("feedback.rateExperience", "Rate Your Overall Platform Experience")}
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeVal = hoverRating || rating;
                    const isFilled = star <= activeVal;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 rounded-xl transition-all cursor-pointer hover:scale-115 active:scale-95"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          size={32}
                          className={`${
                            isFilled
                              ? "text-amber-400 fill-amber-400 filter drop-shadow-[0_2px_4px_rgba(251,191,36,0.35)]"
                              : "text-slate-200 dark:text-slate-700 hover:text-amber-200"
                          } transition-colors`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-2 h-4">
                  {getRatingLabel(hoverRating || rating)}
                </p>
              </div>

              {/* Comments Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("feedback.comments", "Feedback Comments")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("feedback.commentsPlaceholder", "Share details about what worked well or what can be improved...")}
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={1000}
                  required
                />
                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                  <span>{t("feedback.commentsHint", "Reviewed directly by system administrators")}</span>
                  <span>{comment.length}/1000</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || Boolean(successMsg)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>{t("feedback.sendingBtn", "Submitting Feedback...")}</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>{t("feedback.sendBtn", "Send Feedback")}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Tab 2: History */}
          {activeTab === "history" && (
            <div className="space-y-3">
              {loadingHistory ? (
                <div className="py-12 text-center">
                  <Loader2 size={32} className="mx-auto text-blue-600 animate-spin mb-2" />
                  <p className="text-xs text-slate-500">{t("common.loading", "Loading...")}</p>
                </div>
              ) : myFeedbacks.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <MessageSquare size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t("feedback.noHistory", "No feedback submitted yet")}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    {t("feedback.noHistoryDesc", "When you submit feedback or platform ratings, you can track their status and administrator responses here.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("submit")}
                    className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    {t("feedback.submitTab", "Submit Feedback")}
                  </button>
                </div>
              ) : (
                myFeedbacks.map((fb) => {
                  const dateStr = fb.created_at
                    ? new Date(fb.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : t("feedback.recent", "Recent");

                  return (
                    <div
                      key={fb.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={13}
                                className={
                                  star <= fb.rating
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-300 dark:text-slate-600"
                                }
                              />
                            ))}
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {fb.rating}.0
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">{dateStr}</span>
                          {getStatusBadge(fb.status)}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                        "{fb.comment}"
                      </p>

                      {fb.admin_response ? (
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-xs">
                          <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold mb-1">
                            <Shield size={13} />
                            <span>{t("feedback.adminResponse", "Administrator Response")}</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-[11px]">
                            {fb.admin_response}
                          </p>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock size={11} />
                          <span>{t("feedback.awaitingReview", "Awaiting administrative review")}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;