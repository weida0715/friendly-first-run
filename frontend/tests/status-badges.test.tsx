import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/status/StatusBadge';
import { UserRoleBadge } from '@/components/status/UserRoleBadge';
import { UserStatusBadge } from '@/components/status/UserStatusBadge';

describe('StatusBadge', () => {
  it('renders known status with mapped style', () => {
    render(<StatusBadge status="enabled" />);
    const badge = screen.getByText('enabled');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-emerald-500/12');
  });

  it('falls back safely for unknown statuses', () => {
    render(<StatusBadge status="mystery" />);
    const badge = screen.getByText('mystery');
    expect(badge).toBeInTheDocument();
    expect(badge).not.toHaveClass('bg-emerald-600');
    expect(badge).not.toHaveClass('bg-red-600');
  });
});

describe('domain wrappers', () => {
  it('UserRoleBadge maps admin/moderator/user correctly', () => {
    const { rerender } = render(<UserRoleBadge role="administrator" />);
    expect(screen.getByText('Admin')).toHaveClass('bg-destructive/12');

    rerender(<UserRoleBadge role="mod" />);
    expect(screen.getByText('Moderator')).toHaveClass('bg-amber-500/12');

    rerender(<UserRoleBadge role="user" />);
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('UserStatusBadge maps enabled/disabled and degrades unknown safely', () => {
    const { rerender } = render(<UserStatusBadge status="enabled" />);
    expect(screen.getByText('Enabled')).toHaveClass('bg-emerald-500/12');

    rerender(<UserStatusBadge status="disabled" />);
    expect(screen.getByText('Disabled')).toHaveClass('bg-destructive/12');

    rerender(<UserStatusBadge status="Paused" />);
    const badge = screen.getByText('Paused');
    expect(badge).toBeInTheDocument();
    expect(badge).not.toHaveClass('bg-destructive/12');
    expect(badge).not.toHaveClass('bg-emerald-500/12');
  });
});
