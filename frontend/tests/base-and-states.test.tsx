import { render, screen } from '@testing-library/react';
import { BaseView } from '@/views/BaseView';
import { EmptyState } from '@/components/states/EmptyState';
import { LoadingState } from '@/components/states/LoadingState';

describe('base and states', () => {
  it('BaseView normal/loading/error states render as expected', () => {
    const { rerender, container } = render(
      <BaseView title="Title" description="Desc">
        <div>Body</div>
      </BaseView>,
    );
    expect(screen.getByText('Body')).toBeInTheDocument();

    rerender(<BaseView title="Title" description="Desc" loading />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

    rerender(<BaseView title="Title" description="Desc" error="Boom" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Boom')).toBeInTheDocument();
  });

  it('EmptyState renders defaults and custom content', () => {
    const { rerender } = render(<EmptyState />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();

    rerender(<EmptyState title="No rows" description="Try a different filter" />);
    expect(screen.getByText('No rows')).toBeInTheDocument();
    expect(screen.getByText('Try a different filter')).toBeInTheDocument();
  });

  it('LoadingState renders default and custom messages', () => {
    const { rerender } = render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    rerender(<LoadingState message="Fetching records..." />);
    expect(screen.getByText('Fetching records...')).toBeInTheDocument();
  });
});
