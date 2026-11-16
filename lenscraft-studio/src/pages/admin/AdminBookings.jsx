import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  Camera,
  Search,
  RefreshCw,
  MapPin,
  Mail,
  Phone,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  ClipboardList,
  ChevronDown,
  LoaderCircle,
} from "lucide-react";

import {
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
} from "../../api/adminBookingService";

import "../../styles/AdminBookings.css";

const STATUS_OPTIONS = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

const STATUS_ACTIONS = {
  pending: [
    { label: "Confirm Booking", status: "confirmed" },
    { label: "Cancel Booking", status: "cancelled" },
  ],
  confirmed: [
    { label: "Mark Completed", status: "completed" },
    { label: "Cancel Booking", status: "cancelled" },
  ],
  completed: [],
  cancelled: [],
};

function formatDate(date) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "—";

  const [hours, minutes] = time.split(":");

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getErrorMessage(error) {
  const data = error.response?.data;

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([key, value]) => {
        const message = Array.isArray(value) ? value.join(", ") : String(value);

        return `${key.replaceAll("_", " ")}: ${message}`;
      })
      .join(" | ");
  }

  return error.message || "Something went wrong.";
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    document.title = "Admin Bookings | Lenscraft Studio";
  }, []);

  const loadBookings = async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const data = await getAllBookings();

      const results = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setBookings(results);
    } catch (err) {
      console.error("Failed to load admin bookings:", err);

      const status = err.response?.status;

      if (status === 401) {
        setError("Please log in with your administrator account.");
      } else if (status === 403) {
        setError("You do not have permission to access this dashboard.");
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;

      const searchableText = [
        booking.id,
        booking.customer_name,
        booking.email,
        booking.phone,
        booking.service,
        booking.event_location,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [bookings, search, statusFilter]);

  const openActionModal = (booking, action) => {
    setConfirmAction({
      booking,
      ...action,
    });

    setError("");
    setNotice("");
  };

  const closeActionModal = () => {
    if (processingId !== null) return;

    setConfirmAction(null);
  };

  const handleStatusUpdate = async () => {
    if (!confirmAction || processingId !== null) return;

    const { booking, status } = confirmAction;

    setProcessingId(booking.id);
    setError("");
    setNotice("");

    try {
      const updatedBooking = await updateBookingStatus(booking.id, status);

      setBookings((previous) =>
        previous.map((item) =>
          item.id === booking.id ? updatedBooking : item,
        ),
      );

      setSelectedBooking((current) =>
        current?.id === booking.id ? updatedBooking : current,
      );

      setNotice(`Booking #${booking.id} updated to ${status} successfully.`);

      setConfirmAction(null);
    } catch (err) {
      setError(getErrorMessage(err));
      setConfirmAction(null);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteBooking = async () => {
    if (!confirmAction || processingId !== null) return;

    const { booking } = confirmAction;

    setProcessingId(booking.id);
    setError("");
    setNotice("");

    try {
      await deleteBooking(booking.id);

      setBookings((previous) =>
        previous.filter((item) => item.id !== booking.id),
      );

      setSelectedBooking(null);
      setConfirmAction(null);

      setNotice(`Booking #${booking.id} deleted successfully.`);
    } catch (err) {
      setError(getErrorMessage(err));
      setConfirmAction(null);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction?.status === "delete") {
      handleDeleteBooking();
    } else {
      handleStatusUpdate();
    }
  };

  const statCards = [
    {
      key: "total",
      label: "Total Bookings",
      icon: ClipboardList,
      value: stats.total,
    },
    {
      key: "pending",
      label: "Pending",
      icon: Clock3,
      value: stats.pending,
    },
    {
      key: "confirmed",
      label: "Confirmed",
      icon: CheckCircle2,
      value: stats.confirmed,
    },
    {
      key: "completed",
      label: "Completed",
      icon: Camera,
      value: stats.completed,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      icon: XCircle,
      value: stats.cancelled,
    },
  ];

  return (
    <main className="admin-bookings-page">
      <div className="admin-bookings-container">
        <header className="admin-bookings-header">
          <div>
            <p className="admin-eyebrow">LENSCRAFT STUDIO</p>
            <h1>
              Booking <span>Management</span>
            </h1>
            <p>
              Review customer reservations and manage photography sessions from
              one place.
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh-btn"
            onClick={() => loadBookings(false)}
            disabled={loading || refreshing || processingId !== null}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "admin-spinning" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {notice && (
          <div className="admin-alert admin-alert-success" role="status">
            <CheckCircle2 size={19} />
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss success message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {error && (
          <div className="admin-alert admin-alert-error" role="alert">
            <AlertTriangle size={19} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="admin-stats-grid" aria-label="Booking statistics">
          {statCards.map(({ key, label, icon: Icon, value }) => (
            <div className={`admin-stat-card admin-stat-${key}`} key={key}>
              <div className="admin-stat-top">
                <span>{label}</span>
                <div className="admin-stat-icon">
                  <Icon size={21} />
                </div>
              </div>

              <strong>{loading ? "—" : value}</strong>

              <span className="admin-stat-caption">
                {key === "total" ? "All reservations" : `${label} reservations`}
              </span>
            </div>
          ))}
        </section>

        <section className="admin-bookings-panel">
          <div className="admin-panel-header">
            <div>
              <p className="admin-eyebrow">CUSTOMER RESERVATIONS</p>
              <h2>All Bookings</h2>
            </div>

            <span className="admin-results-count">
              {filteredBookings.length} results
            </span>
          </div>

          <div className="admin-bookings-toolbar">
            <div className="admin-search-box">
              <Search size={19} />

              <input
                type="search"
                placeholder="Search name, booking ID, service..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search bookings"
              />
            </div>

            <div className="admin-filter-box">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter bookings by status"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === "all"
                      ? "All Statuses"
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>

              <ChevronDown size={17} />
            </div>
          </div>

          {loading ? (
            <div className="admin-state">
              <LoaderCircle className="admin-spinning" size={35} />
              <p>Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="admin-state">
              <Camera size={42} />
              <h3>No bookings found</h3>
              <p>
                {search || statusFilter !== "all"
                  ? "Try adjusting your search or status filter."
                  : "Customer bookings will appear here."}
              </p>
            </div>
          ) : (
            <div className="admin-table-scroll">
              <table className="admin-bookings-table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Event</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <span className="admin-booking-number">
                          #{booking.id}
                        </span>
                      </td>

                      <td>
                        <div className="admin-customer-cell">
                          <strong>{booking.customer_name}</strong>
                          <span>{booking.email}</span>
                        </div>
                      </td>

                      <td>
                        <span className="admin-service-name">
                          {booking.service}
                        </span>
                      </td>

                      <td>
                        <div className="admin-event-cell">
                          <strong>{formatDate(booking.event_date)}</strong>
                          <span>{formatTime(booking.event_time)}</span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-status admin-status-${booking.status}`}
                        >
                          <span className="admin-status-dot" />
                          {booking.status}
                        </span>
                      </td>

                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-icon-btn"
                            onClick={() => setSelectedBooking(booking)}
                            title="View booking details"
                            aria-label={`View booking ${booking.id}`}
                          >
                            <Eye size={18} />
                          </button>

                          {booking.status === "pending" && (
                            <button
                              type="button"
                              className="admin-icon-btn admin-confirm-icon"
                              onClick={() =>
                                openActionModal(booking, {
                                  label: "Confirm Booking",
                                  status: "confirmed",
                                })
                              }
                              title="Confirm booking"
                              aria-label={`Confirm booking ${booking.id}`}
                            >
                              <CheckCircle2 size={18} />
                            </button>
                          )}

                          <button
                            type="button"
                            className="admin-icon-btn admin-delete-icon"
                            onClick={() =>
                              openActionModal(booking, {
                                label: "Delete Booking",
                                status: "delete",
                              })
                            }
                            title="Delete booking"
                            aria-label={`Delete booking ${booking.id}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* BOOKING DETAILS MODAL */}
      {selectedBooking && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && processingId === null) {
              setSelectedBooking(null);
            }
          }}
        >
          <section
            className="admin-modal admin-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-details-title"
          >
            <button
              type="button"
              className="admin-modal-close"
              onClick={() => setSelectedBooking(null)}
              aria-label="Close booking details"
            >
              <X size={20} />
            </button>

            <p className="admin-eyebrow">BOOKING #{selectedBooking.id}</p>

            <h2 id="admin-details-title">Booking Details</h2>

            <span
              className={`admin-status admin-status-${selectedBooking.status}`}
            >
              <span className="admin-status-dot" />
              {selectedBooking.status}
            </span>

            <div className="admin-detail-list">
              <div>
                <span>Customer</span>
                <strong>{selectedBooking.customer_name}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>
                  <Mail size={15} />
                  {selectedBooking.email}
                </strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>
                  <Phone size={15} />
                  {selectedBooking.phone}
                </strong>
              </div>

              <div>
                <span>Photography Service</span>
                <strong>{selectedBooking.service}</strong>
              </div>

              <div>
                <span>Event Date</span>
                <strong>
                  <CalendarDays size={15} />
                  {formatDate(selectedBooking.event_date)}
                </strong>
              </div>

              <div>
                <span>Event Time</span>
                <strong>
                  <Clock3 size={15} />
                  {formatTime(selectedBooking.event_time)}
                </strong>
              </div>

              <div>
                <span>Location</span>
                <strong>
                  <MapPin size={15} />
                  {selectedBooking.event_location}
                </strong>
              </div>

              <div>
                <span>Special Requirements</span>
                <strong>
                  {selectedBooking.special_requirements || "None"}
                </strong>
              </div>
            </div>

            <div className="admin-details-actions">
              {(STATUS_ACTIONS[selectedBooking.status] || []).map((action) => (
                <button
                  type="button"
                  key={action.status}
                  className={
                    action.status === "cancelled"
                      ? "admin-action-danger"
                      : "admin-action-primary"
                  }
                  onClick={() => {
                    openActionModal(selectedBooking, action);
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* CONFIRM ACTION MODAL */}
      {confirmAction && (
        <div className="admin-modal-overlay admin-confirm-overlay">
          <section
            className="admin-modal admin-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
          >
            <div className="admin-warning-icon">
              <AlertTriangle size={30} />
            </div>

            <h2 id="admin-confirm-title">{confirmAction.label}?</h2>

            <p>
              Are you sure you want to{" "}
              {confirmAction.status === "delete"
                ? "permanently delete"
                : `mark as ${confirmAction.status}`}{" "}
              booking #{confirmAction.booking.id}?
            </p>

            <div className="admin-confirm-summary">
              <strong>{confirmAction.booking.customer_name}</strong>
              <span>{confirmAction.booking.service}</span>
              <span>{formatDate(confirmAction.booking.event_date)}</span>
            </div>

            <div className="admin-confirm-buttons">
              <button
                type="button"
                className="admin-action-secondary"
                onClick={closeActionModal}
                disabled={processingId !== null}
              >
                Go Back
              </button>

              <button
                type="button"
                className={
                  ["delete", "cancelled"].includes(confirmAction.status)
                    ? "admin-action-danger"
                    : "admin-action-primary"
                }
                onClick={handleConfirmAction}
                disabled={processingId !== null}
              >
                {processingId !== null ? "Processing..." : confirmAction.label}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
