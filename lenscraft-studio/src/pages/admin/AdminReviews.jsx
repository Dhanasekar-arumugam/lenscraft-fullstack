import { useCallback, useEffect, useState } from "react";
import { Check, X, RefreshCw, MessageSquare, ShieldCheck } from "lucide-react";

import ReviewCard from "../../components/ReviewCard";

import {
  getModerationReviews,
  approveReview,
  rejectReview,
  getReviewError,
} from "../../api/reviewService";

import "../../styles/Reviews.css";
import "../../styles/AdminReviews.css";

const FILTERS = ["all", "pending", "approved", "rejected"];

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = filter === "all" ? {} : { status: filter };
      const data = await getModerationReviews(params);

      setReviews(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(getReviewError(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleModeration = async (id, action) => {
    setProcessingId(id);
    setError("");
    setMessage("");

    try {
      if (action === "approve") {
        await approveReview(id);
        setMessage("Review approved successfully.");
      } else {
        await rejectReview(id);
        setMessage("Review rejected successfully.");
      }

      await loadReviews();
    } catch (err) {
      setError(getReviewError(err));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="admin-reviews-page">
      <div className="admin-reviews-container">
        <header className="admin-reviews-header">
          <div>
            <span className="admin-reviews-eyebrow">
              <ShieldCheck size={15} />
              LENSCRAFT ADMINISTRATION
            </span>

            <h1>
              Review <em>Management.</em>
            </h1>

            <p>Moderate customer experiences and maintain quality.</p>
          </div>

          <button
            type="button"
            className="admin-reviews-refresh"
            onClick={loadReviews}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </header>

        <div className="admin-reviews-toolbar">
          <div className="admin-review-filters">
            {FILTERS.map((item) => (
              <button
                type="button"
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>

          <span className="admin-review-count">{reviews.length} reviews</span>
        </div>

        {error && (
          <div className="admin-review-error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="admin-review-success" role="status">
            {message}
          </div>
        )}

        {loading ? (
          <div className="admin-reviews-state">Loading customer reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="admin-reviews-empty">
            <MessageSquare size={34} />
            <h3>No reviews found</h3>
            <p>There are no reviews in this category.</p>
          </div>
        ) : (
          <div className="admin-reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="admin-review-item">
                <div className="admin-review-meta">
                  <span>
                    {review.service
                      ? `Service #${review.service}`
                      : `Photographer #${review.photographer}`}
                  </span>

                  <span>Booking #{review.booking}</span>
                </div>

                <ReviewCard review={review} showStatus />

                {review.status === "pending" && (
                  <div className="admin-review-actions">
                    <button
                      type="button"
                      className="admin-approve-btn"
                      disabled={processingId === review.id}
                      onClick={() => handleModeration(review.id, "approve")}
                    >
                      <Check size={17} />
                      Approve
                    </button>

                    <button
                      type="button"
                      className="admin-reject-btn"
                      disabled={processingId === review.id}
                      onClick={() => handleModeration(review.id, "reject")}
                    >
                      <X size={17} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
