import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { jobsApi } from '../../api/jobsApi';
import { jobFormSchema, toJobPayload, fromJob, EMPLOYMENT_TYPE_OPTIONS, WORK_MODE_OPTIONS } from '../../validators/job.schema';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function JobForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [status, setStatus] = useState(isEditing ? 'loading' : 'ready');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(jobFormSchema),
    defaultValues: { employmentType: 'full-time', workMode: 'remote' },
  });

  useEffect(() => {
    if (!isEditing) return;
    jobsApi
      .get(id)
      .then((res) => {
        reset(fromJob(res.data.data.job));
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [id, isEditing, reset]);

  const onSubmit = async (values) => {
    setServerError('');
    const payload = toJobPayload(values);
    try {
      if (isEditing) {
        await jobsApi.update(id, payload);
        navigate(`/recruiter/jobs/${id}`);
      } else {
        const res = await jobsApi.create(payload);
        navigate(`/recruiter/jobs/${res.data.data.job._id}`);
      }
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Unable to save this job.'));
    }
  };

  if (status === 'loading') {
    return <p className="text-sm text-gray-500">Loading job...</p>;
  }

  if (status === 'error') {
    return <p className="text-sm text-red-600">Unable to load this job. Please try again.</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900">{isEditing ? 'Edit job' : 'Create job'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Input id="title" label="Title" error={errors.title?.message} {...register('title')} />
        <Input id="department" label="Department" error={errors.department?.message} {...register('department')} />
        <TextArea id="description" label="Description" rows={6} error={errors.description?.message} {...register('description')} />
        <Input
          id="responsibilitiesText"
          label="Responsibilities (comma-separated)"
          error={errors.responsibilitiesText?.message}
          {...register('responsibilitiesText')}
        />
        <Input
          id="requiredSkillsText"
          label="Required skills (comma-separated)"
          error={errors.requiredSkillsText?.message}
          {...register('requiredSkillsText')}
        />
        <Input
          id="preferredSkillsText"
          label="Preferred skills (comma-separated)"
          error={errors.preferredSkillsText?.message}
          {...register('preferredSkillsText')}
        />
        <Input id="education" label="Education" error={errors.education?.message} {...register('education')} />
        <Input id="experience" label="Experience" error={errors.experience?.message} {...register('experience')} />

        <div className="grid grid-cols-2 gap-4">
          <Select
            id="employmentType"
            label="Employment type"
            options={EMPLOYMENT_TYPE_OPTIONS}
            error={errors.employmentType?.message}
            {...register('employmentType')}
          />
          <Select
            id="workMode"
            label="Work mode"
            options={WORK_MODE_OPTIONS}
            error={errors.workMode?.message}
            {...register('workMode')}
          />
        </div>

        <Input id="location" label="Location" error={errors.location?.message} {...register('location')} />

        <div className="grid grid-cols-2 gap-4">
          <Input id="salaryMin" label="Salary min" type="number" error={errors.salaryMin?.message} {...register('salaryMin')} />
          <Input id="salaryMax" label="Salary max" type="number" error={errors.salaryMax?.message} {...register('salaryMax')} />
        </div>

        <Input id="deadline" label="Application deadline" type="date" error={errors.deadline?.message} {...register('deadline')} />

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? 'Saving...' : isEditing ? 'Save changes' : 'Create job'}
        </Button>
      </form>
    </div>
  );
}
