import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationsApi } from '../../api/applicationsApi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import { STATUS_LABELS, STATUS_VARIANT } from '../../validators/applicationStatus';

export default function CandidateApplications() {
  const [state, setState] = useState({ status: 'loading', applications: [], pagination: null });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const res = await applicationsApi.list({ page, limit: 20 });
      setState({ status: 'success', applications: res.data.data, pagination: res.data.pagination });
    } catch {
      setState({ status: 'error', applications: [], pagination: null });
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

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
      <h1 className="dashboard-page__title">Your applications</h1>

      <div className="card">
        {state.status === 'error' ? (
          <p className="table-error">Unable to load applications. Please try again.</p>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={state.applications}
              rowKey="_id"
              loading={state.status === 'loading'}
              emptyMessage="You have not applied to any jobs yet."
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
