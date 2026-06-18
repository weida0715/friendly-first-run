import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { UserManagementView } from '@/views/UserManagementView';

const listUsersMock = jest.fn();
const createManagedUserMock = jest.fn();

jest.mock('@/lib/auth/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/api/client', () => ({
  ApiClientError: class ApiClientError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  listUsers: (...args: unknown[]) => listUsersMock(...args),
  createManagedUser: (...args: unknown[]) => createManagedUserMock(...args),
  deleteManagedUser: jest.fn(),
  resetManagedUserPassword: jest.fn(),
  updateManagedUserRole: jest.fn(),
  updateManagedUserStatus: jest.fn(),
}));

const { useAuth } = jest.requireMock('@/lib/auth/useAuth') as {
  useAuth: jest.Mock;
};

const baseUser = {
  id: 1,
  username: 'user1',
  email: 'user1@example.com',
  name: 'User One',
  role: 'User',
  status: 'Enabled',
};

describe('UserManagementView RBAC UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows error when create user mutation fails', async () => {
    useAuth.mockReturnValue({ user: { role: 'Admin' } });
    listUsersMock.mockResolvedValue({ data: { items: [baseUser] } });
    createManagedUserMock.mockRejectedValue(new Error('Create failed'));

    render(<UserManagementView />);

    expect(await screen.findByText('Create User')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Create User'));
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() =>
      expect(screen.getByText('Failed to create user')).toBeInTheDocument(),
    );
  });

  it('hides staff actions for normal user actor', async () => {
    useAuth.mockReturnValue({ user: { role: 'User' } });
    listUsersMock.mockResolvedValue({ data: { items: [baseUser] } });

    render(<UserManagementView />);

    expect(screen.queryByText('Create User')).not.toBeInTheDocument();
    expect(screen.queryByText('Reset Password')).not.toBeInTheDocument();
    expect(screen.queryByText('Update Role')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('shows moderator actions only for normal-user targets', async () => {
    useAuth.mockReturnValue({ user: { role: 'Moderator' } });
    listUsersMock.mockResolvedValue({
      data: {
        items: [
          baseUser,
          { ...baseUser, id: 2, username: 'mod1', role: 'Moderator' },
        ],
      },
    });

    render(<UserManagementView />);

    expect(await screen.findByText('Create User')).toBeInTheDocument();
    // one reset for normal user target only
    expect(screen.getAllByText('Reset Password')).toHaveLength(1);
    expect(screen.queryByText('Update Role')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('shows full admin action set', async () => {
    useAuth.mockReturnValue({ user: { role: 'Admin' } });
    listUsersMock.mockResolvedValue({ data: { items: [baseUser] } });

    render(<UserManagementView />);

    expect(await screen.findByText('Create User')).toBeInTheDocument();
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByText('Update Role')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders forbidden/api errors from list endpoint', async () => {
    useAuth.mockReturnValue({ user: { role: 'Moderator' } });
    listUsersMock.mockRejectedValue(new Error('Forbidden'));

    render(<UserManagementView />);

    fireEvent.click(screen.getByText('Apply'));
    await waitFor(() => expect(screen.getByText('Failed to load users')).toBeInTheDocument());
  });
});
