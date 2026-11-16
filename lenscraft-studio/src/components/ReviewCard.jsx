import { Star, UserRound, CalendarDays } from "lucide-react";

function Stars({ rating = 0 }) {
  return (
    <div className="review-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          fill={star <= rating ? "currentColor" : "none"}
          className={star <= rating ? "filled" : ""}
        />
      ))}
    </div>
  );
}

export default function ReviewCard({
  review,
  showStatus = false,
  actions = null,
}) {
  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const customer =
    review.customer_name ||
    review.customer_email ||
    review.user_name ||
    "Lenscraft Customer";

  return (
    <article className="review-card">
      <div className="review-card-top">
        <div className="review-customer">
          <div className="review-avatar">
            <UserRound size={21} />
          </div>

          <div>
            <h4>{customer}</h4>
            <span className="review-date">
              <CalendarDays size={13} />
              {date}
            </span>
          </div>
        </div>

        <Stars rating={Number(review.rating) || 0} />
      </div>

      {review.title && <h3 className="review-card-title">{review.title}</h3>}

      <p className="review-card-comment">{review.comment}</p>

      {showStatus && (
        <span className={`review-status ${review.status}`}>
          {review.status}
        </span>
      )}

      {actions && <div className="review-card-actions">{actions}</div>}
    </article>
  );
}
