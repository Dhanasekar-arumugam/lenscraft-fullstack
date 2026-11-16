import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  CalendarDays,
  Clock,
  MapPin,
  Camera,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
  BellRing,
  ShieldCheck,
  LoaderCircle,
  Sparkles,
  Star,
} from "lucide-react";

import { getMyBookings, cancelBooking } from "../api/bookingService";
import { getMyReviews } from "../api/reviewService";
import ReviewForm from "../components/ReviewForm";

import "../styles/MyBookings.css";
import "../styles/Reviews.css";

// ============================================================
// HELPERS
// ============================================================

function getRelatedId(value) {
  if (value && typeof value === "object") {
    return value.id ?? null;
  }

  return value ?? null;
}

function getReviewTargets(booking) {
  const targets = [];

  const serviceId = getRelatedId(booking.service_reference);
  const photographerId = getRelatedId(booking.photographer);

  if (serviceId != null && serviceId !== "") {
    targets.push({
      type: "service",
      id: serviceId,
      label:
        booking.service_name ||
        (typeof booking.service === "string" ? booking.service : "") ||
        "Photography Service",
    });
  }

  if (photographerId != null && photographerId !== "") {
    targets.push({
      type: "photographer",
      id: photographerId,
      label: booking.photographer_name || "Photographer",
    });
  }

  return targets;
}

function formatDate(date) {
  if (!date) return "Not available";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "Not available";

  const [hours, minutes] = time.split(":");
  const date = new Date();

  date.setHours(Number(hours), Number(minutes), 0, 0);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function canCancelBooking(booking) {
  if (!["pending", "confirmed"].includes(booking.status)) {
    return false;
  }

  if (!booking.event_date) return false;

  const eventDateTime = new Date(
    `${booking.event_date}T${booking.event_time || "00:00:00"}`,
  );

  return !Number.isNaN(eventDateTime.getTime()) && eventDateTime > new Date();
}

function getBookingName(booking) {
  const service =
    booking.service_name ||
    (typeof booking.service === "string"
      ? booking.service
      : booking.service?.title);

  const photographer =
    booking.photographer_name ||
    (typeof booking.photographer === "object"
      ? booking.photographer?.name
      : "");

  if (service && photographer) {
    return `${service} + ${photographer}`;
  }

  return service || photographer || "Photography Booking";
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cancellation
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState("");

  // Notifications
  const [notification, setNotification] = useState(null);

  // Reviews
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewTarget, setReviewTarget] = useState("service");
  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  // ============================================================
  // NOTIFICATION
  // ============================================================

  const showNotification = (type, title, message) => {
    setNotification({
      id: Date.now(),
      type,
      title,
      message,
    });
  };

  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      setNotification(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification]);

  // ============================================================
  // FETCH BOOKINGS AND REVIEWS
  // ============================================================

  useEffect(() => {
    document.title = "My Bookings | Lenscraft Studio";

    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const bookingData = await getMyBookings();

        if (!active) return;

        setBookings(
          Array.isArray(bookingData) ? bookingData : bookingData?.results || [],
        );
      } catch (err) {
        console.error("Failed to fetch bookings:", err);

        if (active) {
          setError("Unable to load your bookings.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }

      try {
        const reviewData = await getMyReviews();

        if (!active) return;

        setMyReviews(
          Array.isArray(reviewData) ? reviewData : reviewData?.results || [],
        );
        setReviewsLoaded(true);
      } catch (err) {
        console.error("Failed to fetch customer reviews:", err);

        if (active) {
          setReviewsLoaded(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  // ============================================================
  // CANCEL BOOKING
  // ============================================================

  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setCancelError("");
  };

  const closeCancelModal = () => {
    if (cancellingId !== null) return;

    setSelectedBooking(null);
    setCancelError("");
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || cancellingId !== null) return;

    const bookingId = selectedBooking.id;

    setCancellingId(bookingId);
    setCancelError("");

    try {
      const response = await cancelBooking(bookingId);

      setBookings((previous) =>
        previous.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                status: response?.booking?.status || "cancelled",
              }
            : booking,
        ),
      );

      setSelectedBooking(null);

      showNotification(
        "success",
        "Booking Cancelled",
        `Your booking #${bookingId} has been cancelled successfully.`,
      );
    } catch (err) {
      console.error("Cancellation failed:", err);

      const detail = err.response?.data?.detail;

      const message =
        typeof detail === "string"
          ? detail
          : "Unable to cancel your booking. Please try again.";

      setCancelError(message);

      showNotification("error", "Cancellation Failed", message);
    } finally {
      setCancellingId(null);
    }
  };

  // ============================================================
  // REVIEW MANAGEMENT
  // ============================================================

  const hasReviewed = (bookingId, target) => {
    return myReviews.some((review) => {
      const reviewBookingId = getRelatedId(review.booking);
      const reviewTargetId = getRelatedId(review[target.type]);

      return (
        String(reviewBookingId) === String(bookingId) &&
        String(reviewTargetId) === String(target.id)
      );
    });
  };

  const openReviewModal = (booking) => {
    if (booking.status !== "completed") return;

    const targets = getReviewTargets(booking);

    if (targets.length === 0) {
      showNotification(
        "error",
        "Review Unavailable",
        "This booking does not have a linked service or photographer.",
      );
      return;
    }

    const availableTarget = targets.find(
      (target) => !hasReviewed(booking.id, target),
    );

    if (!availableTarget && reviewsLoaded) {
      showNotification(
        "success",
        "Already Reviewed",
        "You have already submitted reviews for this booking.",
      );
      return;
    }

    setReviewBooking(booking);
    setReviewTarget((availableTarget || targets[0]).type);
  };

  const closeReviewModal = () => {
    setReviewBooking(null);
  };

  const handleReviewSuccess = async () => {
    showNotification(
      "success",
      "Review Submitted",
      "Thank you! Your review has been submitted for admin approval.",
    );

    try {
      const data = await getMyReviews();

      setMyReviews(Array.isArray(data) ? data : data?.results || []);

      setReviewsLoaded(true);
    } catch (err) {
      console.error("Unable to update review status:", err);
      setReviewsLoaded(false);
    }

    setReviewBooking(null);
  };

  // ============================================================
  // MODAL SCROLL LOCK
  // ============================================================

  useEffect(() => {
    if (!selectedBooking && !reviewBooking) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedBooking, reviewBooking]);

  // ============================================================
  // ESCAPE KEY
  // ============================================================

  useEffect(() => {
    if (!selectedBooking && !reviewBooking) return;

    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      if (cancellingId !== null) return;

      setSelectedBooking(null);
      setReviewBooking(null);
      setCancelError("");
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [selectedBooking, reviewBooking, cancellingId]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="my-bookings-page">
      {/* ======================================================
          FLOATING NOTIFICATION
      ====================================================== */}

      {notification && (
        <div
          key={notification.id}
          className={`lens-toast lens-toast-${notification.type}`}
          role={notification.type === "error" ? "alert" : "status"}
        >
          <div className="lens-toast-content">
            <div className="lens-toast-icon">
              {notification.type === "success" ? (
                <CheckCircle2 size={25} />
              ) : (
                <AlertTriangle size={25} />
              )}
            </div>

            <div className="lens-toast-text">
              <span className="lens-toast-label">LENSCRAFT NOTIFICATION</span>

              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
            </div>

            <button
              type="button"
              className="lens-toast-close"
              onClick={() => setNotification(null)}
              aria-label="Close notification"
            >
              <X size={18} />
            </button>
          </div>

          <div className="lens-toast-progress" />
        </div>
      )}

      <div className="my-bookings-container">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="my-bookings-header">
          <div className="mb-hero-main">
            <div className="mb-hero-copy">
              <p className="eyebrow">
                <Sparkles size={15} />
                THE PERSONAL ATELIER / 02
              </p>

              <h1>
                Your moments.
                <br />
                <em>Your memories.</em>
              </h1>

              <p className="mb-hero-description">
                A personal collection of the moments you've chosen to preserve.
                Follow your photography reservations, revisit the details, and
                manage your upcoming sessions.
              </p>
            </div>

            <div className="mb-hero-art" aria-hidden="true">
              <Camera size={100} strokeWidth={0.7} />
              <span>EVERY FRAME TELLS A STORY</span>
            </div>
          </div>

          <div className="mb-hero-bottom">
            <span>YOUR RESERVATIONS / LENSCRAFT</span>
            <span>THE ART OF REMEMBERING</span>
          </div>
        </div>

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (
          <div className="my-bookings-loading">
            <LoaderCircle size={38} className="lens-spin" />
            <p>Preparing your bookings...</p>
          </div>
        )}

        {/* ====================================================
            ERROR
        ==================================================== */}

        {!loading && error && (
          <div className="my-bookings-alert error" role="alert">
            <AlertTriangle size={21} />
            <span>{error}</span>
          </div>
        )}

        {/* ====================================================
            EMPTY STATE
        ==================================================== */}

        {!loading && !error && bookings.length === 0 && (
          <div className="my-bookings-empty">
            <div className="my-bookings-empty-icon">
              <Camera size={36} />
            </div>

            <h2>Your story starts here</h2>

            <p>
              You haven't made any bookings yet. Explore our photography
              services and capture your next unforgettable moment.
            </p>

            <Link to="/services">
              Explore Services
              <ArrowRight size={18} />
            </Link>
          </div>
        )}

        {/* ====================================================
            BOOKING CARDS
        ==================================================== */}

        {!loading && !error && bookings.length > 0 && (
          <div className="my-bookings-grid">
            {bookings.map((booking) => {
              const targets = getReviewTargets(booking);

              const allReviewed =
                reviewsLoaded &&
                targets.length > 0 &&
                targets.every((target) => hasReviewed(booking.id, target));

              return (
                <article className="my-booking-card" key={booking.id}>
                  {/* TOP */}

                  <div className="my-booking-top">
                    <span className="my-booking-id">BOOKING #{booking.id}</span>

                    <span className={`booking-status ${booking.status}`}>
                      <span className="status-dot" />
                      {booking.status}
                    </span>
                  </div>

                  {/* SERVICE */}

                  <div className="my-booking-service">
                    <div className="my-booking-service-icon">
                      <Camera size={23} />
                    </div>

                    <div>
                      <span>YOUR PHOTOGRAPHY EXPERIENCE</span>

                      <h2>{getBookingName(booking)}</h2>
                    </div>
                  </div>

                  {/* DETAILS */}

                  <div className="my-booking-details">
                    <p>
                      <CalendarDays size={18} />
                      <span>{formatDate(booking.event_date)}</span>
                    </p>

                    <p>
                      <Clock size={18} />
                      <span>{formatTime(booking.event_time)}</span>
                    </p>

                    <p>
                      <MapPin size={18} />
                      <span>{booking.event_location}</span>
                    </p>
                  </div>

                  {/* SPECIAL REQUIREMENTS */}

                  {booking.special_requirements && (
                    <div className="my-booking-notes">
                      <strong>Special Requirements</strong>

                      <p>{booking.special_requirements}</p>
                    </div>
                  )}

                  {/* FOOTER */}

                  <div className="my-booking-footer">
                    <div className="my-booking-status-info">
                      {booking.status === "pending" && (
                        <p>
                          <Clock size={15} />
                          Awaiting confirmation from our team.
                        </p>
                      )}

                      {booking.status === "confirmed" && (
                        <p className="confirmed-text">
                          <ShieldCheck size={16} />
                          Your session is confirmed!
                        </p>
                      )}

                      {booking.status === "completed" && (
                        <p>
                          <CheckCircle2 size={16} />
                          Your photography session is completed.
                        </p>
                      )}

                      {booking.status === "cancelled" && (
                        <p className="cancelled-text">
                          <XCircle size={16} />
                          This booking has been cancelled.
                        </p>
                      )}
                    </div>

                    {/* CANCEL BUTTON */}

                    {canCancelBooking(booking) && (
                      <button
                        type="button"
                        className="my-booking-cancel-btn"
                        onClick={() => openCancelModal(booking)}
                      >
                        <XCircle size={17} />
                        Cancel Booking
                      </button>
                    )}

                    {/* REVIEW BUTTON */}

                    {booking.status === "completed" && targets.length > 0 && (
                      <button
                        type="button"
                        className="my-booking-review-btn"
                        onClick={() => openReviewModal(booking)}
                      >
                        {allReviewed ? (
                          <>
                            <CheckCircle2 size={17} />
                            Reviewed
                          </>
                        ) : (
                          <>
                            <Star size={17} />
                            Write a Review
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================
          CANCELLATION MODAL
      ====================================================== */}

      {selectedBooking && (
        <div
          className="booking-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCancelModal();
            }
          }}
        >
          <div
            className="booking-cancel-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-title"
            aria-describedby="cancel-booking-description"
          >
            <button
              type="button"
              className="booking-modal-close"
              onClick={closeCancelModal}
              disabled={cancellingId !== null}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <div className="booking-modal-icon">
              <AlertTriangle size={32} />
            </div>

            <span className="booking-modal-eyebrow">BOOKING MANAGEMENT</span>

            <h2 id="cancel-booking-title">Cancel Your Booking?</h2>

            <p
              id="cancel-booking-description"
              className="booking-modal-description"
            >
              Are you sure you want to cancel this photography reservation? This
              action cannot be undone from your account.
            </p>

            <div className="booking-modal-summary">
              <div>
                <span>BOOKING REFERENCE</span>
                <strong>#{selectedBooking.id}</strong>
              </div>

              <div>
                <span>PHOTOGRAPHY SERVICE</span>
                <strong>{getBookingName(selectedBooking)}</strong>
              </div>

              <div>
                <span>EVENT DATE</span>
                <strong>{formatDate(selectedBooking.event_date)}</strong>
              </div>
            </div>

            <div className="booking-modal-warning">
              <BellRing size={18} />

              <p>
                Your booking will be marked as cancelled, and an email
                notification will be attempted.
              </p>
            </div>

            {cancelError && (
              <div className="booking-modal-error" role="alert">
                <AlertTriangle size={17} />
                <span>{cancelError}</span>
              </div>
            )}

            <div className="booking-modal-actions">
              <button
                type="button"
                className="booking-modal-keep"
                onClick={closeCancelModal}
                disabled={cancellingId !== null}
              >
                Keep My Booking
              </button>

              <button
                type="button"
                className="booking-modal-confirm"
                onClick={handleCancelBooking}
                disabled={cancellingId !== null}
              >
                {cancellingId !== null ? (
                  <>
                    <LoaderCircle size={18} className="lens-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle size={18} />
                    Yes, Cancel Booking
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          CUSTOMER REVIEW MODAL
      ====================================================== */}

      {reviewBooking && (
        <div
          className="booking-review-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReviewModal();
            }
          }}
        >
          <div
            className="booking-review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-review-title"
          >
            <button
              type="button"
              className="booking-review-close"
              onClick={closeReviewModal}
              aria-label="Close review form"
            >
              <X size={20} />
            </button>

            <div className="booking-review-header">
              <span className="booking-review-eyebrow">
                <Sparkles size={15} />
                YOUR LENSCRAFT EXPERIENCE
              </span>

              <h2 id="booking-review-title">
                Share Your <em>Experience.</em>
              </h2>

              <p>
                Booking #{reviewBooking.id}
                {" — "}
                {getBookingName(reviewBooking)}
              </p>
            </div>

            {/* SERVICE / PHOTOGRAPHER TABS */}

            {getReviewTargets(reviewBooking).length > 1 && (
              <div className="booking-review-targets">
                {getReviewTargets(reviewBooking).map((target) => (
                  <button
                    type="button"
                    key={target.type}
                    className={reviewTarget === target.type ? "active" : ""}
                    onClick={() => setReviewTarget(target.type)}
                  >
                    {target.type === "service"
                      ? "Review Service"
                      : "Review Photographer"}

                    {hasReviewed(reviewBooking.id, target) && (
                      <CheckCircle2 size={15} />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* SELECTED REVIEW FORM */}

            {getReviewTargets(reviewBooking)
              .filter((target) => target.type === reviewTarget)
              .map((target) => (
                <div key={`${reviewBooking.id}-${target.type}`}>
                  {reviewsLoaded && hasReviewed(reviewBooking.id, target) ? (
                    <div className="booking-review-completed">
                      <CheckCircle2 size={35} />

                      <h3>Review Already Submitted</h3>

                      <p>
                        You have already reviewed this
                        {target.type === "service"
                          ? " service."
                          : " photographer."}
                      </p>
                    </div>
                  ) : (
                    <ReviewForm
                      targetType={target.type}
                      targetId={target.id}
                      bookings={[reviewBooking]}
                      onSuccess={handleReviewSuccess}
                    />
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </main>
  );
}
