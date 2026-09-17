import { useCallback, useEffect, useState } from 'react';
import { applicationsApi } from '../../api/applicationsApi';
import { STATUS_LABELS } from '../../validators/applicationStatus';
import KanbanColumn from './KanbanColumn';

const COLUMN_ORDER = [
  'applied',
  'under_review',
  'shortlisted',
  'interview_scheduled',
  'interview_completed',
  'selected',
  'rejected',
  'on_hold',
];

export default function KanbanBoard() {
  const [state, setState] = useState({ status: 'loading', applications: [] });
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const res = await applicationsApi.list({ limit: 100, sort: 'newest' });
      setState({ status: 'success', applications: res.data.data });
    } catch {
      setState({ status: 'error', applications: [] });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDropCard = async (applicationId, newStatus) => {
    setActionError('');
    const previousApplications = state.applications;
    const target = previousApplications.find((a) => a._id === applicationId);
    if (!target || target.status === newStatus) return;

    setState((s) => ({
      ...s,
      applications: s.applications.map((a) => (a._id === applicationId ? { ...a, status: newStatus } : a)),
    }));

    try {
      if (newStatus === 'selected' || newStatus === 'rejected') {
        await applicationsApi.makeDecision(applicationId, newStatus, '');
      } else {
        await applicationsApi.updateStatus(applicationId, newStatus);
      }
    } catch {
      setState((s) => ({ ...s, applications: previousApplications }));
      setActionError('Unable to update this candidate’s status. Please try again.');
    }
  };

  if (state.status === 'loading') {
    return <p className="text-muted">Loading pipeline...</p>;
  }

  if (state.status === 'error') {
    return <p className="text-error">Unable to load the pipeline. Please try again.</p>;
  }

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page__title">Candidate pipeline</h1>
      {actionError && <p className="text-error">{actionError}</p>}

      <div className="kanban-board">
        {COLUMN_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            label={STATUS_LABELS[status]}
            applications={state.applications.filter((a) => a.status === status)}
            onDropCard={handleDropCard}
          />
        ))}
      </div>
    </div>
  );
}
