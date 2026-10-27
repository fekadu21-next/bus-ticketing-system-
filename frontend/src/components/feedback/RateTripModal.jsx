import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Star, MapPin, Bus, Calendar, Clock, Ticket, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { submitPassengerTripFeedbackApi } from "../../api/feedback.api";

export const RateTripModal = ({
  isOpen,
  onClose,
  booking,
  existingReview = null,
  onSubmitSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setComment(existingReview.comment || "");
    } else {
      setRating(5);
      setHoverRating(0);
      setComment("");
    }
    setErrorMsg("");
    setSuccessMsg("");
  }, [existingReview, isOpen]);

  if (!booking) return null;

  const tripId = booking.tripId || booking.trip_id || booking.trips?.id;
  const origin = booking.from || booking.origin || booking.trips?.routes?.origin || "Origin";
  const destination = booking.to || booking.destination || booking.trips?.routes?.destination || "Destination";
  const operatorName = booking.operator || booking.operatorName || booking.organizationName || booking.trips?.organizations?.name || "Bus Operator";
  const departureDate = booking.date || booking.departureDate || booking.trips?.departure_time;
  const seats = Array.isArray(booking.seats) ? booking.seats.join(", ") : booking.seatNumber || booking.seat_number || "1";

  const getRatingLabel = (val) => {
    switch (val) {
      case 1:
        return "Poor Service";
      case 2:
        return "Fair / Needs Improvement";
      case 3:
        return "Good Experience";
      case 4:
        return "Very Good Journey";
      case 5:
        return "Excellent Service";
      default:
        return "";
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (existingReview) {
      onClose();
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      setErrorMsg("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (!tripId) {
      setErrorMsg("Trip reference identifier is missing.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      const res = await submitPassengerTripFeedbackApi({
        tripId,
        rating,
        comment: comment.trim(),
      });

      setSuccessMsg("Thank you! Your trip review has been recorded.");
      if (onSubmitSuccess && res?.data?.feedback) {
        onSubmitSuccess(res.data.feedback);
      }
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      console.error("Failed to submit trip rating:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Failed to submit trip rating. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isViewOnly = Boolean(existingReview);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isViewOnly ? "Your Trip Rating & Review" : "Rate Trip & Service Quality"}
      maxWidth="520px"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            onClick={onClose}
            disabled={submitting}
          >
            {isViewOnly ? "Close" : "Cancel"}
          </button>
          {!isViewOnly && (
            <button
              type="button"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-1.5 disabled:opacity-50"
              onClick={handleSubmit}
              disabled={submitting || successMsg}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : successMsg ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Submitted</span>
                </>
              ) : (
                <>
                  <Star size={14} />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Trip Overview Pill */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <MapPin size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-black text-slate-900 dark:text-white text-sm">
              {origin} → {destination}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {operatorName}
            </span>
            <span>Seat: {seats}</span>
          </div>
        </div>

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
        <div className="text-center py-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            {isViewOnly ? "Your Rating" : "How was your trip experience?"}
          </label>
          <div className="flex items-center justify-center gap-2.5">
            {[1, 2, 3, 4, 5].map((star) => {
              const activeVal = hoverRating || rating;
              const isFilled = star <= activeVal;
              return (
                <button
                  key={star}
                  type="button"
                  disabled={isViewOnly}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => !isViewOnly && setHoverRating(star)}
                  onMouseLeave={() => !isViewOnly && setHoverRating(0)}
                  className={`p-1.5 rounded-xl transition-all ${
                    isViewOnly
                      ? "cursor-default"
                      : "cursor-pointer hover:scale-115 active:scale-95"
                  }`}
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    size={32}
                    className={`${
                      isFilled
                        ? "text-amber-400 fill-amber-400 filter drop-shadow-[0_2px_4px_rgba(251,191,36,0.4)]"
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

        {/* Comment Section */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isViewOnly ? "Your Review Comment" : "Write a Review (Optional)"}
          </label>
          {isViewOnly ? (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 italic">
              {existingReview.comment ? `"${existingReview.comment}"` : "No written review comment provided."}
            </div>
          ) : (
            <>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about the driver's driving, bus comfort, cleanliness, AC, punctuality, or customer service..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={500}
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                <span>Your review helps other passengers choose trusted transport operators.</span>
                <span>{comment.length}/500</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default RateTripModal;
