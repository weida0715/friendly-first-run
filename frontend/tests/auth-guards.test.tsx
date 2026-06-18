import { render, waitFor } from '@testing-library/react';
import { RequireAuth, RequireRole } from '@/lib/auth/guards';

const replaceMock = jest.fn();

let mockPathname = '/dashboard';
let mockAuthState: {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: { role: string } | null;
} = {
  isLoading: false,
  isAuthenticated: false,
  user: null,
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => mockPathname,
}));

jest.mock('@/lib/auth/AuthProvider', () => ({
  useAuth: () => mockAuthState,
}));

describe('auth guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('RequireAuth redirects unauthenticated users to login with next', async () => {
    mockPathname = '/experiments';
    mockAuthState = { isLoading: false, isAuthenticated: false, user: null };

    render(
      <RequireAuth>
        <div>Private</div>
      </RequireAuth>,
    );

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith('/login?next=%2Fexperiments'),
    );
  });

  it('RequireRole redirects authenticated but unauthorized users', async () => {
    mockAuthState = {
      isLoading: false,
      isAuthenticated: true,
      user: { role: 'User' },
    };

    render(
      <RequireRole minimumRole="Moderator" fallbackTo="/dashboard">
        <div>Staff</div>
      </RequireRole>,
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/dashboard'));
  });

  it('RequireRole allows Admin users for Admin minimum role', async () => {
    mockAuthState = {
      isLoading: false,
      isAuthenticated: true,
      user: { role: 'Admin' },
    };

    const { getByText } = render(
      <RequireRole minimumRole="Admin" fallbackTo="/dashboard">
        <div>System Settings</div>
      </RequireRole>,
    );

    expect(getByText('System Settings')).toBeInTheDocument();
    await waitFor(() => expect(replaceMock).not.toHaveBeenCalled());
  });
});
