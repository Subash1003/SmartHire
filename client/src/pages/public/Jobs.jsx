import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { jobsApi } from '../../api/jobsApi';
import { useDebounce } from '../../hooks/useDebounce';
import { EMPLOYMENT_TYPE_OPTIONS, WORK_MODE_OPTIONS } from '../../validators/job.schema';
import FloatingInput from '../../components/ui/FloatingInput';
import FloatingSelect from '../../components/ui/FloatingSelect';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import PageError from '../../components/ui/PageError';

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
    <div className="page page--md">
      <h1 className="page__title">Open positions</h1>

      <div className="job-filters">
        <div className="job-filters__search">
          <FloatingInput
            id="jobSearch"
            label="Search jobs by title or skill"
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
        <div className="job-filters__select">
          <FloatingSelect
            id="employmentType"
            label="Employment type"
            labelBg="muted"
            value={employmentType}
            onChange={(e) => {
              setPage(1);
              setEmploymentType(e.target.value);
            }}
            options={EMPLOYMENT_FILTER_OPTIONS}
          />
        </div>
        <div className="job-filters__select">
          <FloatingSelect
            id="workMode"
            label="Work mode"
            labelBg="muted"
            value={workMode}
            onChange={(e) => {
              setPage(1);
              setWorkMode(e.target.value);
            }}
            options={WORK_MODE_FILTER_OPTIONS}
          />
        </div>
      </div>

      <div className="card job-list">
        {state.status === 'loading' && (
          <div className="table-skeleton">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="job-list__skeleton-row" />
            ))}
          </div>
        )}

        {state.status === 'error' && <PageError message="Unable to load jobs." onRetry={loadJobs} />}

        {state.status === 'success' && state.jobs.length === 0 && (
          <EmptyState title="No jobs found" description="Try adjusting your search or filters." />
        )}

        {state.status === 'success' && state.jobs.length > 0 && (
          <ul className="job-list__items">
            {state.jobs.map((job) => (
              <li key={job._id} className="job-list__item">
                <Link to={`/jobs/${job._id}`} className="job-list__item-link">
                  <span className="job-list__item-title">{job.title}</span>
                  <span className="job-list__item-meta">
                    {job.location || 'Location not specified'} &middot; <span className="capitalize">{job.workMode}</span> &middot;{' '}
                    <span className="capitalize">{job.employmentType.replace('-', ' ')}</span>
                  </span>
                  <div className="job-list__item-skills">
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
