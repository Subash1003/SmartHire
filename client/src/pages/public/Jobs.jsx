import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../../api/jobsApi';
import { useDebounce } from '../../hooks/useDebounce';
import { EMPLOYMENT_TYPE_OPTIONS, WORK_MODE_OPTIONS } from '../../validators/job.schema';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';

const EMPLOYMENT_FILTER_OPTIONS = [{ value: '', label: 'All types' }, ...EMPLOYMENT_TYPE_OPTIONS];
const WORK_MODE_FILTER_OPTIONS = [{ value: '', label: 'All work modes' }, ...WORK_MODE_OPTIONS];

export default function Jobs() {
  const [search, setSearch] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ status: 'loading', jobs: [], pagination: null });

  const debouncedSearch = useDebounce(search);

  const loadJobs = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const res = await jobsApi.list({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        employmentType: employmentType || undefined,
        workMode: workMode || undefined,
      });
      setState({ status: 'success', jobs: res.data.data, pagination: res.data.pagination });
    } catch {
      setState({ status: 'error', jobs: [], pagination: null });
    }
  }, [page, debouncedSearch, employmentType, workMode]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Open positions</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search jobs by title or skill"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="min-w-64 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <Select
          id="employmentType"
          value={employmentType}
          onChange={(e) => {
            setPage(1);
            setEmploymentType(e.target.value);
          }}
          options={EMPLOYMENT_FILTER_OPTIONS}
        />
        <Select
          id="workMode"
          value={workMode}
          onChange={(e) => {
            setPage(1);
            setWorkMode(e.target.value);
          }}
          options={WORK_MODE_FILTER_OPTIONS}
        />
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white">
        {state.status === 'loading' && (
          <div className="animate-pulse space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded bg-gray-100" />
            ))}
          </div>
        )}

        {state.status === 'error' && (
          <p className="p-8 text-center text-sm text-red-600">Unable to load jobs. Please try again.</p>
        )}

        {state.status === 'success' && state.jobs.length === 0 && (
          <EmptyState title="No jobs found" description="Try adjusting your search or filters." />
        )}

        {state.status === 'success' && state.jobs.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {state.jobs.map((job) => (
              <li key={job._id} className="p-4 hover:bg-gray-50">
                <Link to={`/jobs/${job._id}`} className="flex flex-col gap-1">
                  <span className="font-medium text-gray-900">{job.title}</span>
                  <span className="text-sm text-gray-600">
                    {job.location || 'Location not specified'} &middot; <span className="capitalize">{job.workMode}</span> &middot;{' '}
                    <span className="capitalize">{job.employmentType.replace('-', ' ')}</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(job.requiredSkills || []).slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="brand">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {state.pagination && <Pagination page={state.pagination.page} totalPages={state.pagination.totalPages} onPageChange={setPage} />}
      </div>
    </div>
  );
}
