import { useState } from "react";
import { Star, Send, LoaderCircle } from "lucide-react";

import { createReview, getReviewError } from "../api/reviewService";

export default function ReviewForm({
  targetType,
  targetId,
  bookings = [],
  onSuccess,
}) {
  const [bookingId, setBookingId] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const targetKey = targetType === "photographer" ? "photographer" : "service";

  const eligibleBookings = bookings.filter((booking) => {
    if (booking.status !== "completed") return false;

    if (targetKey === "photographer") {
      const id =
        typeof booking.photographer === "object"
          ? booking.photographer?.id
          : booking.photographer;

      return String(id) === String(targetId);
    }

    const id =
      typeof booking.service_reference === "object"
        ? booking.service_reference?.id
        : booking.service_reference;

    return String(id) === String(targetId);
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!bookingId) {
      setError("Please select a completed booking.");
      return;
    }

    if (!comment.trim()) {
      setError("Please write your review.");
      return;
    }

    setSubmitting(true);

    try {
      await createReview({
        booking: Number(bookingId),
        [targetKey]: Number(targetId),
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });

      setMessage("Review submitted successfully. Awaiting admin approval.");
      setBookingId("");
      setRating(5);
      setTitle("");
      setComment("");

      onSuccess?.();
    } catch (err) {
      setError(getReviewError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <div className="review-form-heading">
        <span>SHARE YOUR EXPERIENCE</span>
        <h3>Leave a Review</h3>
        <p>Your feedback helps us create better experiences.</p>
      </div>

      {error && (
        <div className="review-form-error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="review-form-success" role="status">
          {message}
        </div>
      )}

      <label htmlFor="review-booking">Completed booking</label>
      <select
        id="review-booking"
        value={bookingId}
        onChange={(event) => setBookingId(event.target.value)}
        required
      >
        <option value="">Select your booking</option>

        {eligibleBookings.map((booking) => (
          <option key={booking.id} value={booking.id}>
            Booking #{booking.id} — {booking.event_date}
          </option>
        ))}
      </select>

      <label>Your rating</label>
      <div className="review-rating-picker" role="group" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onFocus={() => setHoverRating(star)}
            onBlur={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            aria-pressed={rating === star}
          >
            <Star
              size={27}
              fill={star <= (hoverRating || rating) ? "currentColor" : "none"}
            />
          </button>
        ))}
      </div>

      <label htmlFor="review-title">Review title</label>
      <input
        id="review-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="A wonderful experience"
        maxLength={150}
      />

      <label htmlFor="review-comment">Your review</label>
      <textarea
        id="review-comment"
        rows={5}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Tell us about your experience..."
        required
      />

      <button
        type="submit"
        className="review-submit-btn"
        disabled={submitting || eligibleBookings.length === 0}
      >
        {submitting ? (
          <LoaderCircle size={18} className="review-spin" />
        ) : (
          <Send size={17} />
        )}
        {submitting ? "Submitting..." : "Submit Review"}
      </button>

      {eligibleBookings.length === 0 && (
        <p className="review-form-hint">
          You need a completed booking for this service or photographer before
          leaving a review.
        </p>
      )}
    </form>
  );
}
