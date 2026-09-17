import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { interviewsApi } from '../../api/interviewsApi';
import { applicationsApi } from '../../api/applicationsApi';
import { usersApi } from '../../api/usersApi';
import { interviewFormSchema, toInterviewPayload, fromInterview } from '../../validators/interview.schema';
import { INTERVIEW_TYPE_OPTIONS } from '../../validators/interviewStatus';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import FloatingInput from '../../components/ui/FloatingInput';
import FloatingSelect from '../../components/ui/FloatingSelect';
import FloatingTextarea from '../../components/ui/FloatingTextarea';
import Button from '../../components/ui/Button';

export default function InterviewForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading');
  const [serverError, setServerError] = useState('');
  const [interviewerOptions, setInterviewerOptions] = useState([]);
  const [context, setContext] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(interviewFormSchema), defaultValues: { type: 'technical', round: 1 } });

  useEffect(() => {
    async function load() {
      try {
        const interviewersRes = await usersApi.list({ role: 'interviewer', limit: 100 });
        setInterviewerOptions(
          interviewersRes.data.data.map((u) => ({ value: u._id, label: u.name }))
        );

        if (isEditing) {
          const interviewRes = await interviewsApi.get(id);
          const interview = interviewRes.data.data.interview;
          setContext({ candidateName: interview.candidateId?.name, jobTitle: interview.jobId?.title });
          reset(fromInterview(interview));
        } else if (applicationId) {
          const appRes = await applicationsApi.get(applicationId);
          const application = appRes.data.data.application;
          setContext({ candidateName: application.candidateId?.name, jobTitle: application.jobId?.title });
        } else {
          setStatus('error');
          return;
        }

        setStatus('ready');
      } catch {
        setStatus('error');
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, applicationId]);

  const onSubmit = async (values) => {
    setServerError('');
    const payload = toInterviewPayload(values);
    try {
      if (isEditing) {
        await interviewsApi.update(id, payload);
      } else {
        await interviewsApi.create({ applicationId, ...payload });
      }
      navigate('/recruiter/interviews');
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Unable to save this interview.'));
    }
  };

  if (status === 'loading') {
    return <p className="text-muted">Loading...</p>;
  }

  if (status === 'error') {
    return <p className="text-error">Unable to load this form. Please try again.</p>;
  }

  return (
    <div className="form-page">
      <h1 className="dashboard-page__title">{isEditing ? 'Reschedule interview' : 'Schedule interview'}</h1>
      {context && (
        <p className="text-muted profile-page__intro">
          {context.candidateName} &middot; {context.jobTitle}
        </p>
      )}

      <div className="card card--padded card--shadow form-page__card">
        <form onSubmit={handleSubmit(onSubmit)} className="stack stack--gap-4" noValidate>
          <FloatingSelect
            id="interviewerId"
            label="Interviewer"
            options={[{ value: '', label: 'Select an interviewer' }, ...interviewerOptions]}
            error={errors.interviewerId?.message}
            {...register('interviewerId')}
          />
          <FloatingSelect
            id="type"
            label="Interview type"
            options={INTERVIEW_TYPE_OPTIONS}
            error={errors.type?.message}
            {...register('type')}
          />
          <FloatingInput id="round" label="Round" type="number" error={errors.round?.message} {...register('round')} />

          <div className="form-grid-2">
            <FloatingInput
              id="startTime"
              label="Start time"
              type="datetime-local"
              error={errors.startTime?.message}
              {...register('startTime')}
            />
            <FloatingInput
              id="endTime"
              label="End time"
              type="datetime-local"
              error={errors.endTime?.message}
              {...register('endTime')}
            />
          </div>

          <FloatingInput
            id="meetingLink"
            label="Meeting link (optional)"
            error={errors.meetingLink?.message}
            {...register('meetingLink')}
          />
          <FloatingTextarea id="notes" label="Notes (optional)" rows={3} error={errors.notes?.message} {...register('notes')} />

          {serverError && <p className="text-error">{serverError}</p>}

          <Button type="submit" disabled={isSubmitting} className="btn--block">
            {isSubmitting ? 'Saving...' : isEditing ? 'Save changes' : 'Schedule interview'}
          </Button>
        </form>
      </div>
    </div>
  );
}
