import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../api/notificationsApi';
import { useAuth } from '../../hooks/useAuth';
import { getNotificationLink } from '../../utils/notificationLink';

const POLL_INTERVAL_MS = 30000;

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await notificationsApi.list({ limit: 10 });
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch {
      // Silently ignore — the bell just won't update this tick.
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => setOpen((prev) => !prev);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      setNotifications((prev) => prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)));
      setUnreadCount((count) => Math.max(0, count - 1));
      try {
        await notificationsApi.markAsRead(notification._id);
      } catch {
        load();
      }
    }

    const link = getNotificationLink(notification, user?.role);
    if (link) {
      setOpen(false);
      navigate(link);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationsApi.markAllAsRead();
    } catch {
      load();
    }
  };

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        type="button"
        className="notification-bell__trigger"
        onClick={handleOpen}
        aria-label="Notifications"
      >
        &#128276;
        {unreadCount > 0 && <span className="notification-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-bell__panel">
          <div className="notification-bell__header">
            <span className="notification-bell__title">Notifications</span>
            {unreadCount > 0 && (
              <button type="button" className="notification-bell__mark-all" onClick={handleMarkAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="notification-bell__empty">You're all caught up.</p>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification._id}
                type="button"
                className={`notification-item ${notification.isRead ? '' : 'notification-item--unread'}`.trim()}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-item__title">{notification.title}</div>
                <div className="notification-item__message">{notification.message}</div>
                <div className="notification-item__time">{timeAgo(notification.createdAt)}</div>
              </button>
            ))
          )}

          {user?.role === 'candidate' && (
            <div className="notification-bell__footer">
              <Link to="/candidate/notifications" className="link-accent" onClick={() => setOpen(false)}>
                View all
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
