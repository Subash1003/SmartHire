import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema } from '../../validators/auth.schema';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const ORGANIZATION_ID = import.meta.env.VITE_ORGANIZATION_ID;

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await registerUser({ ...values, organizationId: ORGANIZATION_ID });
      navigate('/candidate/dashboard', { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Unable to create your account.'));
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900">Create a candidate account</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input id="name" label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
