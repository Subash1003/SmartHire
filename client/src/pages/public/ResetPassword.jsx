import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordSchema } from '../../validators/auth.schema';
import { authApi } from '../../api/authApi';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await authApi.resetPassword({ token, password: values.password });
      navigate('/login', { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'This reset link is invalid or has expired.'));
    }
  };

  if (!token) {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Invalid link</h1>
        <p className="text-sm text-gray-600">This password reset link is missing its token.</p>
        <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900">Set a new password</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Resetting...' : 'Reset password'}
        </Button>
      </form>
    </div>
  );
}
