import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { applicationsApi } from '../../api/applicationsApi';
import { useDebounce } from '../../hooks/useDebounce';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import FloatingInput from '../../components/ui/FloatingInput';
import FloatingSelect from '../../components/ui/FloatingSelect';
import PageError from '../../components/ui/PageError';
import { STATUS_LABELS, STATUS_VARIANT } from '../../validators/applicationStatus';

const STATUS_OPTIONS = [{ value: '', label: 'All statuses' }, ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name_asc', label: 'Candidate name (A-Z)' },
  { value: 'name_desc', label: 'Candidate name (Z-A)' },
];

export default function RecruiterApplications() {
  const [state, setState] = useState({ status: 'loading', applications: [], pagination: null });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const res = await applicationsApi.list({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
        sort,
      });
      setState({ status: 'success', applications: res.data.data, pagination: res.data.pagination });
    } catch {
      setState({ status: 'error', applications: [], pagination: null });
    }
  }, [page, statusFilter, debouncedSearch, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    {
      key: 'candidate',
      header: 'Candidate',
      render: (row) => (
        <Link to={`/recruiter/applications/${row._id}`} className="link-accent">
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
    <div className="dashboard-page">
      <h1 className="dashboard-page__title">Applications</h1>

      <div className="filter-row">
        <div className="filter-field--wide">
          <FloatingInput
            id="candidateSearch"
            label="Search by candidate name or email"
            type="search"
            icon={Search}
            labelBg="muted"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
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
        <div className="filter-field">
          <FloatingSelect
            id="sort"
            label="Sort"
            labelBg="muted"
            value={sort}
            onChange={(e) => {
              setPage(1);
              setSort(e.target.value);
            }}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      <div className="card">
        {state.status === 'error' ? (
          <PageError message="Unable to load applications." onRetry={load} />
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
