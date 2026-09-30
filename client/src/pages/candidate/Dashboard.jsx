import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationsApi } from '../../api/applicationsApi';
import { notificationsApi } from '../../api/notificationsApi';
import KpiCard from '../../components/analytics/KpiCard';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import PageLoading from '../../components/ui/PageLoading';
import PageError from '../../components/ui/PageError';
import { STATUS_LABELS, STATUS_VARIANT } from '../../validators/applicationStatus';

const INTERVIEW_STAGE_STATUSES = ['interview_scheduled', 'interview_completed'];

export default function CandidateDashboard() {
  const [state, setState] = useState({ status: 'loading', applications: [], notifications: [] });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const [applicationsRes, notificationsRes] = await Promise.all([
        applicationsApi.list({ limit: 100, sort: 'newest' }),
        notificationsApi.list({ limit: 5 }),
      ]);
      setState({
        status: 'success',
        applications: applicationsRes.data.data,
        notifications: notificationsRes.data.data.notifications,
      });
    } catch {
      setState((s) => ({ ...s, status: 'error' }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === 'loading') {
    return <PageLoading />;
  }

  if (state.status === 'error') {
    return <PageError message="Unable to load your dashboard." onRetry={load} />;
  }

  const { applications, notifications } = state;
  const active = applications.filter((a) => a.status !== 'selected' && a.status !== 'rejected').length;
  const inInterview = applications.filter((a) => INTERVIEW_STAGE_STATUSES.includes(a.status)).length;
  const selected = applications.filter((a) => a.status === 'selected').length;

  const columns = [
    {
      key: 'job',
      header: 'Job',
      render: (row) => (
        <Link to={`/candidate/applications/${row._id}`} className="link-accent">
          {row.jobId?.title || 'Job no longer available'}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANT[row.status]}>{STATUS_LABELS[row.status]}</Badge>,
    },
    {
      key: 'appliedAt',
      header: 'Applied',
      render: (row) => new Date(row.appliedAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <h1 className="dashboard-page__title">Candidate dashboard</h1>
        <Link to="/candidate/applications" className="link-accent">
          View all applications
        </Link>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Total applications" value={applications.length} />
        <KpiCard label="Active" value={active} />
        <KpiCard label="In interview" value={inInterview} />
        <KpiCard label="Selected" value={selected} />
      </div>

      <div className="card">
        <h2 className="chart-card__title">Recent applications</h2>
        <DataTable
          columns={columns}
          rows={applications.slice(0, 5)}
          rowKey="_id"
          emptyMessage="You have not applied to any jobs yet."
        />
      </div>

      <div className="card">
        <div className="dashboard-page__header">
          <h2 className="chart-card__title">Recent notifications</h2>
          <Link to="/candidate/notifications" className="link-accent">
            View all
          </Link>
        </div>
        {notifications.length === 0 ? (
          <p className="notification-bell__empty">You have no notifications yet.</p>
        ) : (
          notifications.map((notification) => (
            <div key={notification._id} className={`notification-item ${notification.isRead ? '' : 'notification-item--unread'}`.trim()}>
              <div className="notification-item__title">{notification.title}</div>
              <div className="notification-item__message">{notification.message}</div>
              <div className="notification-item__time">{new Date(notification.createdAt).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
