import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LoginView } from '@/views/LoginView';
import { loginUser } from '@/lib/api/client';

const replaceMock = jest.fn();
const refreshUserMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => ({ get: jest.fn(() => null) }),
}));

jest.mock('@/lib/auth/useAuth', () => ({
  useAuth: () => ({ refreshUser: refreshUserMock }),
}));

jest.mock('@/lib/api/client', () => ({
  ApiClientError: class ApiClientError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  loginUser: jest.fn(),
}));

describe('LoginView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    refreshUserMock.mockResolvedValue(undefined);
  });

  it('shows validation errors and blocks submit when invalid', async () => {
    render(<LoginView />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(loginUser).not.toHaveBeenCalled();
  });

  it('submits valid payload and redirects dashboard', async () => {
    (loginUser as jest.Mock).mockResolvedValue({ ok: true });
    render(<LoginView />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'securepass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(loginUser).toHaveBeenCalledTimes(1));
    expect(loginUser).toHaveBeenCalledWith({ email: 'alice@example.com', password: 'securepass' });
    expect(refreshUserMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith('/dashboard');
  });
});
