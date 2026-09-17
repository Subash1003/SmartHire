import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { organizationsApi } from '../../api/organizationsApi';
import { updateOrganizationSchema } from '../../validators/organization.schema';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import FloatingInput from '../../components/ui/FloatingInput';
import FloatingTextarea from '../../components/ui/FloatingTextarea';
import Button from '../../components/ui/Button';

export default function AdminSettings() {
  const [status, setStatus] = useState('loading');
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(updateOrganizationSchema) });

  useEffect(() => {
    organizationsApi
      .getMine()
      .then((res) => {
        const org = res.data.data.organization;
        reset({
          name: org.name || '',
          logo: org.logo || '',
          description: org.description || '',
          website: org.website || '',
          industry: org.industry || '',
          location: org.location || '',
          contactEmail: org.contactEmail || '',
        });
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [reset]);

  const onSubmit = async (values) => {
    setServerError('');
    setSaved(false);
    try {
      await organizationsApi.updateMine(values);
      setSaved(true);
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Unable to save organization settings.'));
    }
  };

  if (status === 'loading') {
    return <p className="text-muted">Loading organization settings...</p>;
  }

  if (status === 'error') {
    return <p className="text-error">Unable to load organization settings. Please try again.</p>;
  }

  return (
    <div className="form-page">
      <h1 className="dashboard-page__title">Organization settings</h1>

      <div className="card card--padded card--shadow form-page__card">
        <form onSubmit={handleSubmit(onSubmit)} className="stack stack--gap-4" noValidate>
          <FloatingInput id="name" label="Organization name" error={errors.name?.message} {...register('name')} />
          <FloatingInput id="logo" label="Logo URL" error={errors.logo?.message} {...register('logo')} />
          <FloatingTextarea
            id="description"
            label="Description"
            error={errors.description?.message}
            {...register('description')}
          />
          <FloatingInput id="website" label="Website" error={errors.website?.message} {...register('website')} />
          <FloatingInput id="industry" label="Industry" error={errors.industry?.message} {...register('industry')} />
          <FloatingInput id="location" label="Location" error={errors.location?.message} {...register('location')} />
          <FloatingInput
            id="contactEmail"
            label="Contact email"
            type="email"
            error={errors.contactEmail?.message}
            {...register('contactEmail')}
          />

          {serverError && <p className="text-error">{serverError}</p>}
          {saved && <p className="text-success">Settings saved.</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </div>
    </div>
  );
}
