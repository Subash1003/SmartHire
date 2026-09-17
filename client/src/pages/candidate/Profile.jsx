import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { candidateProfileApi } from '../../api/candidateProfileApi';
import { updateCandidateProfileSchema } from '../../validators/candidateProfile.schema';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Button from '../../components/ui/Button';

export default function CandidateProfile() {
  const [status, setStatus] = useState('loading');
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(updateCandidateProfileSchema) });

  useEffect(() => {
    candidateProfileApi
      .getMine()
      .then((res) => {
        const profile = res.data.data.profile;
        reset({
          phone: profile.phone || '',
          location: profile.location || '',
          summary: profile.summary || '',
          skillsText: (profile.skills || []).join(', '),
          portfolio: profile.portfolio || '',
          github: profile.github || '',
          linkedin: profile.linkedin || '',
        });
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [reset]);

  const onSubmit = async (values) => {
    setServerError('');
    setSaved(false);
    const { skillsText, ...rest } = values;
    const skills = skillsText
      ? skillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    try {
      await candidateProfileApi.updateMine({ ...rest, skills });
      setSaved(true);
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Unable to save your profile.'));
    }
  };

  if (status === 'loading') {
    return <p className="text-sm text-gray-500">Loading your profile...</p>;
  }

  if (status === 'error') {
    return <p className="text-sm text-red-600">Unable to load your profile. Please try again.</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900">Your profile</h1>
      <p className="mt-1 text-sm text-gray-600">
        Experience, education, and resume uploads are added in a later step.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Input id="phone" label="Phone" error={errors.phone?.message} {...register('phone')} />
        <Input id="location" label="Location" error={errors.location?.message} {...register('location')} />
        <TextArea
          id="summary"
          label="Professional summary"
          error={errors.summary?.message}
          {...register('summary')}
        />
        <Input
          id="skillsText"
          label="Skills (comma-separated)"
          placeholder="React, Node.js, MongoDB"
          error={errors.skillsText?.message}
          {...register('skillsText')}
        />
        <Input id="portfolio" label="Portfolio URL" error={errors.portfolio?.message} {...register('portfolio')} />
        <Input id="github" label="GitHub URL" error={errors.github?.message} {...register('github')} />
        <Input id="linkedin" label="LinkedIn URL" error={errors.linkedin?.message} {...register('linkedin')} />

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        {saved && <p className="text-sm text-green-600">Profile saved.</p>}

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? 'Saving...' : 'Save profile'}
        </Button>
      </form>
    </div>
  );
}
