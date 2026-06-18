"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Activity, ArrowRight, Loader2 } from 'lucide-react';
import { ApiClientError, loginUser } from '@/lib/api/client';
import { type LoginFormErrors, type LoginFormValues, validateLoginForm } from '@/lib/validators/login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormFieldRow } from '@/components/forms/FormFieldRow';
import { ErrorState } from '@/components/states/ErrorState';
import { useAuth } from '@/lib/auth/useAuth';

const initialValues: LoginFormValues = {
  email: '',
  password: '',
};

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setField = (field: keyof LoginFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validateLoginForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await loginUser({ email: values.email.trim(), password: values.password });
      await refreshUser();
      const next = searchParams.get('next');
      if (next && next.startsWith('/')) {
        router.replace(next);
      } else {
        router.replace('/dashboard');
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          setSubmitError('Invalid credentials. Please check your email and password.');
        } else if (error.status === 403) {
          setSubmitError('Your account is disabled. Please contact support.');
        } else {
          setSubmitError(error.message);
        }
      } else {
        setSubmitError('Unable to sign in right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-8 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent shadow-[var(--glow-primary)]">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">BEE</span>
          </Link>

          <h1 className="text-3xl font-bold"><span className="text-gradient">Welcome back</span></h1>
          <p className="mt-2 text-muted-foreground">Sign in to continue your research journey</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
            <FormFieldRow htmlFor="email" label="Email" error={errors.email}>
              <Input id="email" type="email" placeholder="you@example.com" value={values.email} onChange={(e) => setField('email', e.target.value)} className="h-12" />
            </FormFieldRow>

            <FormFieldRow htmlFor="password" label="Password" error={errors.password}>
              <Input id="password" type="password" placeholder="••••••••" value={values.password} onChange={(e) => setField('password', e.target.value)} className="h-12" />
            </FormFieldRow>

            {submitError ? <ErrorState message={submitError} /> : null}

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-hero lg:block">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.22),transparent_45%),radial-gradient(circle_at_75%_75%,hsl(var(--accent)/0.22),transparent_50%)] animate-aurora" />
        <div className="flex h-full flex-col items-center justify-center p-16">
          <div className="max-w-md text-center">
            <h2 className="text-3xl font-bold"><span className="text-gradient">Discipline Over Hype</span></h2>
            <p className="mt-4 text-muted-foreground">
              Research first, trade second. Build repeatable ideas, validate them on data, then execute with confidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}