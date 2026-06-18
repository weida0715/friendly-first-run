import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RegistrationView } from '@/views/RegistrationView';
import { registerUser } from '@/lib/api/client';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/lib/api/client', () => ({
  ApiClientError: class ApiClientError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  registerUser: jest.fn(),
}));

describe('RegistrationView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows validation errors and blocks submit when invalid', async () => {
    render(<RegistrationView />);

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Username is required.')).toBeInTheDocument();
    expect(registerUser).not.toHaveBeenCalled();
  });

  it('submits valid payload and redirects to login', async () => {
    (registerUser as jest.Mock).mockResolvedValue({ ok: true });
    render(<RegistrationView />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'ALICE01' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'securepass' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'securepass' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(registerUser).toHaveBeenCalledTimes(1));
    expect(registerUser).toHaveBeenCalledWith({
      name: 'Alice',
      username: 'alice01',
      email: 'alice@example.com',
      password: 'securepass',
    });
    expect(pushMock).toHaveBeenCalledWith('/login?registered=1');
  });
});
