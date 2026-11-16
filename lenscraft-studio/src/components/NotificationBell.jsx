import { useEffect, useRef, useState } from "react";
import { CheckCheck, X, Inbox, Check } from "lucide-react";

import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/notificationService";

import "../styles/NotificationBell.css";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState([]);

  const containerRef = useRef(null);

  // ==========================================
  // FETCH UNREAD COUNT
  // ==========================================

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.unread_count ?? 0);
    } catch (err) {
      console.error("Unable to fetch unread count:", err);
    }
  };

  // ==========================================
  // FETCH NOTIFICATIONS
  // ==========================================

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getNotifications();

      setNotifications(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) {
      console.error("Unable to fetch notifications:", err);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // POLLING
  // ==========================================

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [open]);

  // ==========================================
  // OUTSIDE CLICK / ESCAPE
  // ==========================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // ==========================================
  // MARK ONE AS READ
  // ==========================================

  const handleMarkRead = async (id) => {
    if (markingIds.includes(id)) return;

    setMarkingIds((prev) => [...prev, id]);

    try {
      setError("");
      await markNotificationRead(id);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification,
        ),
      );

      await fetchUnreadCount();
    } catch (err) {
      console.error("Unable to mark notification as read:", err);
      setError("Could not update notification.");
    } finally {
      setMarkingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // ==========================================
  // MARK ALL AS READ
  // ==========================================

  const handleMarkAllRead = async () => {
    if (markingAll) return;

    setMarkingAll(true);

    try {
      setError("");
      await markAllNotificationsRead();

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("Unable to mark all notifications as read:", err);
      setError("Could not update notifications.");
    } finally {
      setMarkingAll(false);
    }
  };

  // ==========================================
  // NOTIFICATION ICON
  // ==========================================

  const getNotificationIcon = (type) => {
    switch (type) {
      case "booking_created":
        return "bi-camera";

      case "booking_confirmed":
        return "bi-check-circle";

      case "booking_cancelled":
        return "bi-x-circle";

      default:
        return "bi-bell";
    }
  };

  const getNotificationClass = (type) => {
    switch (type) {
      case "booking_created":
        return "type-created";

      case "booking_confirmed":
        return "type-confirmed";

      case "booking_cancelled":
        return "type-cancelled";

      default:
        return "type-default";
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "";

    return parsed.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div
      className={`notification-container ${open ? "notification-is-open" : ""}`}
      ref={containerRef}
    >
      {/* MINIMAL BOOTSTRAP BELL */}

      <button
        type="button"
        className="notification-bell-button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Notifications"
      >
        <i className="bi bi-bell notification-bell-icon" aria-hidden="true" />

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* NOTIFICATION PANEL */}

      {open && (
        <div
          className="notification-dropdown"
          role="dialog"
          aria-label="Notifications"
        >
          {/* HEADER */}

          <div className="notification-header">
            <div className="notification-header-title">
              <span className="notification-header-kicker">
                LENSCRAFT STUDIO
              </span>

              <h3>Notifications</h3>

              <p>
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${
                      unreadCount === 1 ? "" : "s"
                    }`
                  : "You're all caught up"}
              </p>
            </div>

            <button
              type="button"
              className="notification-close"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>

          {/* ACTION BAR */}

          {unreadCount > 0 && (
            <div className="notification-action-bar">
              <span className="notification-section-label">
                RECENT ACTIVITY
              </span>

              <button
                type="button"
                className="notification-mark-all"
                onClick={handleMarkAllRead}
                disabled={markingAll}
              >
                <CheckCheck size={15} />
                {markingAll ? "Updating..." : "Mark all read"}
              </button>
            </div>
          )}

          {/* ERROR MESSAGE */}

          {error && (
            <div className="notification-error" role="alert">
              {error}
            </div>
          )}

          {/* NOTIFICATION LIST */}

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">
                <span className="notification-loader" />
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">
                  <Inbox size={27} strokeWidth={1.5} />
                </div>

                <h4>No notifications yet</h4>
                <p>Updates about your bookings will appear here.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    notification.is_read ? "read" : "unread"
                  }`}
                >
                  <div
                    className={`notification-item-icon ${getNotificationClass(
                      notification.notification_type,
                    )}`}
                  >
                    <i
                      className={`bi ${getNotificationIcon(
                        notification.notification_type,
                      )}`}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="notification-item-content">
                    <div className="notification-item-heading">
                      <h4>{notification.title}</h4>

                      {!notification.is_read && (
                        <span
                          className="notification-unread-dot"
                          aria-label="Unread"
                        />
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <div className="notification-item-footer">
                      <small>{formatDate(notification.created_at)}</small>

                      {!notification.is_read && (
                        <button
                          type="button"
                          className="notification-read-button"
                          onClick={() => handleMarkRead(notification.id)}
                          disabled={markingIds.includes(notification.id)}
                        >
                          <Check size={13} />
                          {markingIds.includes(notification.id)
                            ? "Updating..."
                            : "Mark read"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FOOTER */}

          <div className="notification-footer">
            <span className="notification-footer-dot" />
            Your Lenscraft updates
          </div>
        </div>
      )}
    </div>
  );
}
