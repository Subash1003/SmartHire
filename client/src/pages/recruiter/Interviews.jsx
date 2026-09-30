import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { interviewsApi } from '../../api/interviewsApi';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import FloatingSelect from '../../components/ui/FloatingSelect';
import PageError from '../../components/ui/PageError';
import { INTERVIEW_STATUS_LABELS, INTERVIEW_STATUS_VARIANT } from '../../validators/interviewStatus';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.entries(INTERVIEW_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export default function RecruiterInterviews() {
  const [state, setState] = useState({ status: 'loading', interviews: [], pagination: null });
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const res = await interviewsApi.list({ page, limit: 20, status: statusFilter || undefined });
      setState({ status: 'success', interviews: res.data.data, pagination: res.data.pagination });
    } catch {
      setState({ status: 'error', interviews: [], pagination: null });
    }
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (interview) => {
    setActionError('');
    try {
      await interviewsApi.updateStatus(interview._id, 'cancelled');
      load();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Unable to cancel this interview.'));
    }
  };

  const columns = [
    { key: 'candidate', header: 'Candidate', render: (row) => row.candidateId?.name },
    { key: 'job', header: 'Job', render: (row) => row.jobId?.title },
    { key: 'interviewer', header: 'Interviewer', render: (row) => row.interviewerId?.name },
    { key: 'type', header: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
    { key: 'when', header: 'When', render: (row) => new Date(row.startTime).toLocaleString() },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={INTERVIEW_STATUS_VARIANT[row.status]}>{INTERVIEW_STATUS_LABELS[row.status]}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        row.status === 'scheduled' && (
          <div className="cluster cluster--gap-2">
            <Link to={`/recruiter/interviews/${row._id}/edit`}>
              <Button variant="secondary">Reschedule</Button>
            </Link>
            <Button variant="danger" onClick={() => handleCancel(row)}>
              Cancel
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page__title">Interviews</h1>

      <div className="filter-field">
        <FloatingSelect
          id="statusFilter"
          label="Status"
          labelBg="muted"
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          options={STATUS_OPTIONS}
        />
      </div>

      {actionError && (
        <p className="text-error" role="alert">
          {actionError}
        </p>
      )}

      <div className="card">
        {state.status === 'error' ? (
          <PageError message="Unable to load interviews." onRetry={load} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={state.interviews}
              rowKey="_id"
              loading={state.status === 'loading'}
              emptyMessage="No interviews scheduled yet."
            />
            {state.pagination && (
              <Pagination page={state.pagination.page} totalPages={state.pagination.totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
