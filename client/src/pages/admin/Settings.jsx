import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { organizationsApi } from '../../api/organizationsApi';
import { updateOrganizationSchema } from '../../validators/organization.schema';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import FloatingInput from '../../components/ui/FloatingInput';
import FloatingTextarea from '../../components/ui/FloatingTextarea';
import Button from '../../components/ui/Button';
import PageLoading from '../../components/ui/PageLoading';
import PageError from '../../components/ui/PageError';

export default function AdminSettings() {
  const [status, setStatus] = useState('loading');
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savedValues, setSavedValues] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(updateOrganizationSchema) });

  const load = useCallback(() => {
    setStatus('loading');
    organizationsApi
      .getMine()
      .then((res) => {
        const org = res.data.data.organization;
        const values = {
          name: org.name || '',
          logo: org.logo || '',
          description: org.description || '',
          website: org.website || '',
          industry: org.industry || '',
          location: org.location || '',
          contactEmail: org.contactEmail || '',
        };
        reset(values);
        setSavedValues(values);
        setIsEditing(false);
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [reset]);

  useEffect(() => {
    load();
  }, [load]);

  const startEditing = () => {
    setSaved(false);
    setServerError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (savedValues) reset(savedValues);
    setServerError('');
    setIsEditing(false);
  };

  const onSubmit = async (values) => {
    setServerError('');
    setSaved(false);
    try {
      await organizationsApi.updateMine(values);
      setSavedValues(values);
      setSaved(true);
      setIsEditing(false);
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Unable to save organization settings.'));
    }
  };

  if (status === 'loading') {
    return <PageLoading label="Loading organization settings..." />;
  }

  if (status === 'error') {
    return <PageError message="Unable to load organization settings." onRetry={load} />;
  }

  return (
    <div className="form-page">
      <div className="dashboard-page__header">
        <h1 className="dashboard-page__title">Organization settings</h1>
        {!isEditing && (
          <Button type="button" variant="secondary" onClick={startEditing}>
            Edit
          </Button>
        )}
      </div>

      <div className="card card--padded card--shadow form-page__card">
        <form onSubmit={handleSubmit(onSubmit)} className="stack stack--gap-4" noValidate>
          <FloatingInput id="name" label="Organization name" disabled={!isEditing} error={errors.name?.message} {...register('name')} />
          <FloatingInput id="logo" label="Logo URL" disabled={!isEditing} error={errors.logo?.message} {...register('logo')} />
          <FloatingTextarea
            id="description"
            label="Description"
            disabled={!isEditing}
            error={errors.description?.message}
            {...register('description')}
          />
          <FloatingInput id="website" label="Website" disabled={!isEditing} error={errors.website?.message} {...register('website')} />
          <FloatingInput id="industry" label="Industry" disabled={!isEditing} error={errors.industry?.message} {...register('industry')} />
          <FloatingInput id="location" label="Location" disabled={!isEditing} error={errors.location?.message} {...register('location')} />
          <FloatingInput
            id="contactEmail"
            label="Contact email"
            type="email"
            disabled={!isEditing}
            error={errors.contactEmail?.message}
            {...register('contactEmail')}
          />

          {serverError && (
            <p className="text-error" role="alert">
              {serverError}
            </p>
          )}
          {saved && <p className="text-success">Settings saved.</p>}

          {isEditing && (
            <div className="cluster cluster--gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </Button>
              <Button type="button" variant="secondary" onClick={cancelEditing} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
