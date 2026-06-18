import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { TopBar } from '@/components/layout/TopBar';

const replaceMock = jest.fn();
let mockPathname = '/dashboard';
let mockAuthState: {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: { username: string; role: string } | null;
  logout: () => Promise<void>;
} = {
  isLoading: false,
  isAuthenticated: false,
  user: null,
  logout: async () => undefined,
};

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: replaceMock }),
}));

jest.mock('@/lib/auth/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

describe('navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/dashboard';
  });

  it('shows nav labels for authenticated user', () => {
    mockAuthState = {
      isLoading: false,
      isAuthenticated: true,
      user: { username: 'alice', role: 'User' },
      logout: async () => undefined,
    };

    render(<SidebarNav mobile />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Experiments')).toBeInTheDocument();
    expect(screen.getByText('Blueprints')).toBeInTheDocument();
    expect(screen.getByText('Models')).toBeInTheDocument();
  });

  it('contains expected route targets', () => {
    mockAuthState = {
      isLoading: false,
      isAuthenticated: true,
      user: { username: 'alice', role: 'User' },
      logout: async () => undefined,
    };

    render(<SidebarNav mobile />);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Experiments' })).toHaveAttribute('href', '/experiments');
    expect(screen.getByRole('link', { name: 'Public Hub' })).toHaveAttribute('href', '/hub');
  });

  it('enforces role-based visibility', () => {
    mockAuthState = {
      isLoading: false,
      isAuthenticated: true,
      user: { username: 'mod', role: 'Moderator' },
      logout: async () => undefined,
    };
    const { rerender } = render(<SidebarNav mobile />);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Moderation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jobs' })).toHaveAttribute('href', '/jobs');
    expect(screen.queryByText('System')).not.toBeInTheDocument();

    mockAuthState = {
      isLoading: false,
      isAuthenticated: true,
      user: { username: 'admin', role: 'Admin' },
      logout: async () => undefined,
    };
    rerender(<SidebarNav mobile />);
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('topbar sign out triggers router push to login', async () => {
    mockAuthState = {
      isLoading: false,
      isAuthenticated: true,
      user: { username: 'alice', role: 'User' },
      logout: async () => undefined,
    };

    render(<TopBar onOpenMobileNav={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/login'));
  });

  it('topbar brand opens landing and guest nav is public-only', () => {
    mockAuthState = {
      isLoading: false,
      isAuthenticated: false,
      user: null,
      logout: async () => undefined,
    };

    render(<TopBar onOpenMobileNav={jest.fn()} />);

    expect(screen.getByRole('link', { name: /BEE/i })).toHaveAttribute('href', '/landing');
    expect(screen.getByRole('link', { name: 'Public Hub' })).toHaveAttribute('href', '/hub');
    expect(screen.getByRole('link', { name: 'Documentation' })).toHaveAttribute('href', '/docs');
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
  });
});
