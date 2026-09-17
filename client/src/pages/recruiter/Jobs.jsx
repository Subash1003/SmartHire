import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../../api/jobsApi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';

const STATUS_VARIANT = {
  draft: 'neutral',
  published: 'success',
  closed: 'danger',
  expired: 'warning',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'closed', label: 'Closed' },
  { value: 'expired', label: 'Expired' },
];

export default function RecruiterJobs() {
  const [state, setState] = useState({ status: 'loading', jobs: [], pagination: null });
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const loadJobs = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const res = await jobsApi.list({ page, limit: 20, status: statusFilter || undefined });
      setState({ status: 'success', jobs: res.data.data, pagination: res.data.pagination });
    } catch {
      setState({ status: 'error', jobs: [], pagination: null });
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const columns = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <Link to={`/recruiter/jobs/${row._id}`} className="font-medium text-brand-600 hover:underline">
          {row.title}
        </Link>
      ),
    },
    { key: 'department', header: 'Department' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Jobs</h1>
        <Link to="/recruiter/jobs/create">
          <Button>Create job</Button>
        </Link>
      </div>

      <Select
        id="statusFilter"
        value={statusFilter}
        onChange={(e) => {
          setPage(1);
          setStatusFilter(e.target.value);
        }}
        options={STATUS_OPTIONS}
        className="w-48"
      />

      <div className="rounded-lg border border-gray-200 bg-white">
        {state.status === 'error' ? (
          <p className="p-8 text-center text-sm text-red-600">Unable to load jobs. Please try again.</p>
        ) : (
          <>
            <DataTable columns={columns} rows={state.jobs} rowKey="_id" loading={state.status === 'loading'} emptyMessage="No jobs yet." />
            {state.pagination && (
              <Pagination page={state.pagination.page} totalPages={state.pagination.totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
