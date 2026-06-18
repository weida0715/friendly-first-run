export interface RegistrationFormValues {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type RegistrationFormErrors = Partial<Record<keyof RegistrationFormValues, string>>;

const USERNAME_PATTERN = /^[a-z0-9]+$/;

export function validateRegistrationForm(values: RegistrationFormValues): RegistrationFormErrors {
  const errors: RegistrationFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Name is required.';
  }

  const normalizedUsername = values.username.trim();
  if (!normalizedUsername) {
    errors.username = 'Username is required.';
  } else if (normalizedUsername.length < 3 || normalizedUsername.length > 32) {
    errors.username = 'Username must be between 3 and 32 characters.';
  } else if (!USERNAME_PATTERN.test(normalizedUsername)) {
    errors.username = 'Username must contain lowercase letters and numbers only.';
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}
