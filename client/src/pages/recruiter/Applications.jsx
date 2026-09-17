import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationsApi } from '../../api/applicationsApi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import { STATUS_LABELS, STATUS_VARIANT } from '../../validators/applicationStatus';

const STATUS_OPTIONS = [{ value: '', label: 'All statuses' }, ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))];

export default function RecruiterApplications() {
  const [state, setState] = useState({ status: 'loading', applications: [], pagination: null });
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const res = await applicationsApi.list({ page, limit: 20, status: statusFilter || undefined });
      setState({ status: 'success', applications: res.data.data, pagination: res.data.pagination });
    } catch {
      setState({ status: 'error', applications: [], pagination: null });
    }
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    {
      key: 'candidate',
      header: 'Candidate',
      render: (row) => (
        <Link to={`/recruiter/applications/${row._id}`} className="font-medium text-brand-600 hover:underline">
          {row.candidateId?.name}
        </Link>
      ),
    },
    { key: 'email', header: 'Email', render: (row) => row.candidateId?.email },
    { key: 'job', header: 'Job', render: (row) => row.jobId?.title },
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
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-gray-900">Applications</h1>

      <Select
        id="statusFilter"
        value={statusFilter}
        onChange={(e) => {
          setPage(1);
          setStatusFilter(e.target.value);
        }}
        options={STATUS_OPTIONS}
        className="w-56"
      />

      <div className="rounded-lg border border-gray-200 bg-white">
        {state.status === 'error' ? (
          <p className="p-8 text-center text-sm text-red-600">Unable to load applications. Please try again.</p>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={state.applications}
              rowKey="_id"
              loading={state.status === 'loading'}
              emptyMessage="No applications yet."
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
