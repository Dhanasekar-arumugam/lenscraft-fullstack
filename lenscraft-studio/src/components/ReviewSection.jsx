import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Star } from "lucide-react";

import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";

import {
  getReviews,
  getReviewSummary,
  getReviewError,
} from "../api/reviewService";

import "../styles/Reviews.css";

export default function ReviewSection({
  targetType,
  targetId,
  bookings = [],
  isAuthenticated = false,
  showForm = true,
}) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const targetKey = targetType === "photographer" ? "photographer" : "service";

  const loadReviews = useCallback(async () => {
    if (!targetId) return;

    setLoading(true);
    setError("");

    try {
      const params = { [targetKey]: targetId };

      const [reviewData, summaryData] = await Promise.all([
        getReviews(params),
        getReviewSummary(params),
      ]);

      setReviews(
        Array.isArray(reviewData) ? reviewData : reviewData?.results || [],
      );

      setSummary(summaryData);
    } catch (err) {
      setError(getReviewError(err));
    } finally {
      setLoading(false);
    }
  }, [targetId, targetKey]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const average = Number(summary?.average_rating ?? summary?.average ?? 0);

  const total = Number(
    summary?.total_reviews ?? summary?.count ?? reviews.length,
  );

  return (
    <section className="lens-reviews">
      <div className="lens-reviews-container">
        <div className="lens-reviews-heading">
          <span className="lens-reviews-eyebrow">CLIENT EXPERIENCES</span>

          <h2>
            Words That <em>Matter.</em>
          </h2>

          <p>Real stories from people who trusted us with their moments.</p>
        </div>

        <div className="review-summary-panel">
          <div className="review-summary-score">
            <strong>{average.toFixed(1)}</strong>
            <Star size={23} fill="currentColor" />
          </div>

          <div>
            <h3>Customer Reviews</h3>
            <p>
              {total} approved {total === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="review-state">Loading reviews...</div>
        ) : error ? (
          <div className="review-state" role="alert">
            {error}
          </div>
        ) : reviews.length === 0 ? (
          <div className="review-empty">
            <MessageSquare size={30} />
            <h3>No reviews yet</h3>
            <p>Be the first to share your experience.</p>
          </div>
        ) : (
          <div className="review-grid">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        {/* Review Form - Optional */}
        {showForm && isAuthenticated && (
          <div className="review-form-container">
            <ReviewForm
              targetType={targetType}
              targetId={targetId}
              bookings={bookings}
              onSuccess={loadReviews}
            />
          </div>
        )}
      </div>
    </section>
  );
}
