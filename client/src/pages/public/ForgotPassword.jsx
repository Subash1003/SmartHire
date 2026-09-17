import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema } from '../../validators/auth.schema';
import { authApi } from '../../api/authApi';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ForgotPassword() {
  const [serverError, setServerError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await authApi.forgotPassword(values);
      setSubmitted(true);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-600">
          If an account with that email exists, we&apos;ve sent a link to reset your password.
        </p>
        <Link to="/login" className="text-sm text-brand-600 hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900">Reset your password</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>
    </div>
  );
}
