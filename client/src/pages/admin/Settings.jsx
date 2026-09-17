import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { organizationsApi } from '../../api/organizationsApi';
import { updateOrganizationSchema } from '../../validators/organization.schema';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
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
    return <p className="text-sm text-gray-500">Loading organization settings...</p>;
  }

  if (status === 'error') {
    return <p className="text-sm text-red-600">Unable to load organization settings. Please try again.</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900">Organization settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Input id="name" label="Organization name" error={errors.name?.message} {...register('name')} />
        <Input id="logo" label="Logo URL" error={errors.logo?.message} {...register('logo')} />
        <TextArea id="description" label="Description" error={errors.description?.message} {...register('description')} />
        <Input id="website" label="Website" error={errors.website?.message} {...register('website')} />
        <Input id="industry" label="Industry" error={errors.industry?.message} {...register('industry')} />
        <Input id="location" label="Location" error={errors.location?.message} {...register('location')} />
        <Input
          id="contactEmail"
          label="Contact email"
          type="email"
          error={errors.contactEmail?.message}
          {...register('contactEmail')}
        />

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        {saved && <p className="text-sm text-green-600">Settings saved.</p>}

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </Button>
      </form>
    </div>
  );
}
