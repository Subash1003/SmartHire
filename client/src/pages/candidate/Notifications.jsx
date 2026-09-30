import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../api/notificationsApi';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import PageError from '../../components/ui/PageError';
import { getNotificationLink } from '../../utils/notificationLink';

export default function CandidateNotifications() {
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', notifications: [], pagination: null, unreadCount: 0 });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const res = await notificationsApi.list({ page, limit: 20 });
      setState({
        status: 'success',
        notifications: res.data.data.notifications,
        pagination: res.data.pagination,
        unreadCount: res.data.data.unreadCount,
      });
    } catch {
      setState((s) => ({ ...s, status: 'error' }));
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)),
      }));
      try {
        await notificationsApi.markAsRead(notification._id);
      } catch {
        load();
      }
    }

    const link = getNotificationLink(notification, 'candidate');
    if (link) navigate(link);
  };

  const handleMarkAllAsRead = async () => {
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, isRead: true })), unreadCount: 0 }));
    try {
      await notificationsApi.markAllAsRead();
    } catch {
      load();
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <h1 className="dashboard-page__title">Notifications</h1>
        {state.unreadCount > 0 && (
          <Button variant="secondary" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="card">
        {state.status === 'error' && <PageError message="Unable to load notifications." onRetry={load} />}

        {state.status !== 'error' && state.notifications.length === 0 && state.status === 'success' && (
          <p className="notification-bell__empty">You have no notifications yet.</p>
        )}

        {state.notifications.map((notification) => (
          <button
            key={notification._id}
            type="button"
            className={`notification-item ${notification.isRead ? '' : 'notification-item--unread'}`.trim()}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="notification-item__title">{notification.title}</div>
            <div className="notification-item__message">{notification.message}</div>
            <div className="notification-item__time">{new Date(notification.createdAt).toLocaleString()}</div>
          </button>
        ))}

        {state.pagination && (
          <Pagination page={state.pagination.page} totalPages={state.pagination.totalPages} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
