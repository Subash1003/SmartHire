import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jobsApi } from '../../api/jobsApi';
import { applicationsApi } from '../../api/applicationsApi';
import { candidateProfileApi } from '../../api/candidateProfileApi';
import { applyFormSchema } from '../../validators/application.schema';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import FloatingInput from '../../components/ui/FloatingInput';
import FloatingTextarea from '../../components/ui/FloatingTextarea';
import Button from '../../components/ui/Button';
import PageLoading from '../../components/ui/PageLoading';
import PageError from '../../components/ui/PageError';

export default function JobApply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', job: null, hasResume: false });
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(applyFormSchema) });

  const load = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading' }));
    Promise.all([jobsApi.get(id), candidateProfileApi.getMine()])
      .then(([jobRes, profileRes]) => {
        setState({
          status: 'success',
          job: jobRes.data.data.job,
          hasResume: Boolean(profileRes.data.data.profile.resume?.url),
        });
      })
      .catch(() => setState({ status: 'error', job: null, hasResume: false }));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await applicationsApi.create({ jobId: id, ...values });
      navigate('/candidate/applications', { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Unable to submit your application.'));
    }
  };

  if (state.status === 'loading') {
    return <PageLoading />;
  }

  if (state.status === 'error') {
    return <PageError message="Unable to load this job." onRetry={load} />;
  }

  if (!state.hasResume) {
    return (
      <div className="job-apply__no-resume">
        <p className="text-muted">You need to upload a resume before applying to jobs.</p>
        <Link to="/candidate/profile" className="text-muted link-accent job-apply__no-resume-link">
          Go to your profile to upload one
        </Link>
      </div>
    );
  }

  return (
    <div className="job-apply">
      <h1 className="dashboard-page__title">Apply to {state.job.title}</h1>

      <div className="card card--padded card--shadow form-page__card">
        <form onSubmit={handleSubmit(onSubmit)} className="stack stack--gap-4" noValidate>
          <FloatingTextarea
            id="coverLetter"
            label="Cover letter (optional)"
            rows={6}
            error={errors.coverLetter?.message}
            {...register('coverLetter')}
          />
          <FloatingInput
            id="expectedSalary"
            label="Expected salary (optional)"
            type="number"
            error={errors.expectedSalary?.message}
            {...register('expectedSalary')}
          />
          <FloatingInput
            id="availability"
            label="Availability (optional)"
            placeholder="e.g. Immediate, 2 weeks notice"
            error={errors.availability?.message}
            {...register('availability')}
          />

          {serverError && (
            <p className="text-error" role="alert">
              {serverError}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit application'}
          </Button>
        </form>
      </div>
    </div>
  );
}
