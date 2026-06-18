"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Activity, ArrowRight, Loader2 } from 'lucide-react';
import { ApiClientError, registerUser } from '@/lib/api/client';
import { type RegistrationFormErrors, type RegistrationFormValues, validateRegistrationForm } from '@/lib/validators/registration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormFieldRow } from '@/components/forms/FormFieldRow';
import { ErrorState } from '@/components/states/ErrorState';

const initialValues: RegistrationFormValues = {
  name: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function RegistrationView() {
  const router = useRouter();
  const [values, setValues] = useState<RegistrationFormValues>(initialValues);
  const [errors, setErrors] = useState<RegistrationFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const setField = (field: keyof RegistrationFormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: field === 'username' ? value.toLowerCase() : value,
    }));
  };

  const runValidation = (): boolean => {
    const validationErrors = validateRegistrationForm(values);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (!runValidation()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser({
        name: values.name.trim(),
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      router.push('/login?registered=1');
    } catch (error) {
      if (error instanceof ApiClientError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Unable to create account right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-hero lg:block">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.22),transparent_45%),radial-gradient(circle_at_80%_70%,hsl(var(--accent)/0.22),transparent_50%)] animate-aurora" />
        <div className="flex h-full flex-col items-center justify-center p-16">
          <div className="max-w-md text-center">
            <h2 className="text-3xl font-bold"><span className="text-gradient">Build Before You Bet</span></h2>
            <p className="mt-4 text-muted-foreground">
              Turn curiosity into a clear research plan, test with discipline, and let conviction come from evidence.
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-8 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent shadow-[var(--glow-primary)]">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">BEE</span>
          </Link>

          <h1 className="text-3xl font-bold"><span className="text-gradient">Create an account</span></h1>
          <p className="mt-2 text-muted-foreground">Register for the BEE research environment.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
            <FormFieldRow htmlFor="name" label="Name" error={errors.name}>
              <Input id="name" value={values.name} onChange={(e) => setField('name', e.target.value)} placeholder="Your name" className="h-11" />
            </FormFieldRow>

            <FormFieldRow htmlFor="username" label="Username" error={errors.username} helpText="Lowercase letters and numbers only.">
              <Input id="username" value={values.username} onChange={(e) => setField('username', e.target.value)} placeholder="yourusername" className="h-11" />
            </FormFieldRow>

            <FormFieldRow htmlFor="email" label="Email" error={errors.email}>
              <Input id="email" type="email" value={values.email} onChange={(e) => setField('email', e.target.value)} placeholder="you@example.com" className="h-11" />
            </FormFieldRow>

            <FormFieldRow htmlFor="password" label="Password" error={errors.password}>
              <Input id="password" type="password" value={values.password} onChange={(e) => setField('password', e.target.value)} placeholder="••••••••" className="h-11" />
            </FormFieldRow>

            <FormFieldRow htmlFor="confirmPassword" label="Confirm Password" error={errors.confirmPassword}>
              <Input id="confirmPassword" type="password" value={values.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)} placeholder="••••••••" className="h-11" />
            </FormFieldRow>

            {submitError ? <ErrorState message={submitError} /> : null}

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting || hasErrors}>
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create Account <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}