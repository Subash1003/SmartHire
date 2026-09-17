import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jobsApi } from '../../api/jobsApi';
import { applicationsApi } from '../../api/applicationsApi';
import { candidateProfileApi } from '../../api/candidateProfileApi';
import { applyFormSchema } from '../../validators/application.schema';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Button from '../../components/ui/Button';

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

  useEffect(() => {
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
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  if (state.status === 'error') {
    return <p className="text-sm text-red-600">Unable to load this job. Please try again.</p>;
  }

  if (!state.hasResume) {
    return (
      <div className="max-w-md">
        <p className="text-sm text-gray-700">
          You need to upload a resume before applying to jobs.
        </p>
        <Link to="/candidate/profile" className="mt-2 inline-block text-sm text-brand-600 hover:underline">
          Go to your profile to upload one
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-gray-900">Apply to {state.job.title}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <TextArea
          id="coverLetter"
          label="Cover letter (optional)"
          rows={6}
          error={errors.coverLetter?.message}
          {...register('coverLetter')}
        />
        <Input
          id="expectedSalary"
          label="Expected salary (optional)"
          type="number"
          error={errors.expectedSalary?.message}
          {...register('expectedSalary')}
        />
        <Input
          id="availability"
          label="Availability (optional)"
          placeholder="e.g. Immediate, 2 weeks notice"
          error={errors.availability?.message}
          {...register('availability')}
        />

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? 'Submitting...' : 'Submit application'}
        </Button>
      </form>
    </div>
  );
}
