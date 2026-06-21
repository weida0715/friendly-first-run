import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { ConfirmDialogCard } from '@/components/ui/ConfirmDialogCard';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>Open Dialog</button>
      {open ? (
        <>
          <ConfirmDialogCard title="Confirm Action">
            <p>Dialog body</p>
          </ConfirmDialogCard>
          <button type="button" onClick={() => setOpen(false)}>Close Dialog</button>
        </>
      ) : null}
    </div>
  );
}

const mockPathname = '/dashboard';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/lib/auth/useAuth', () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
    user: { username: 'alice', role: 'User' },
    logout: async () => undefined,
  }),
}));

describe('dialog and responsive smoke', () => {
  it('dialog trigger opens and closes confirm card', () => {
    render(<DialogHarness />);
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Dialog' }));
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close Dialog' }));
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('app shell uses expected responsive structural classes', () => {
    const { container } = render(<ThemeProvider><AppShell><div>Page</div></AppShell></ThemeProvider>);
    expect(container.querySelector('button[aria-label="Open navigation menu"]')).toBeInTheDocument();
    expect(container.querySelector('[data-sidebar-nav]')).not.toBeInTheDocument();
  });
});
