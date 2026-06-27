import { render, screen } from '@testing-library/react';

const requireAuthMock = jest.fn(({ children }: { children: React.ReactNode }) => <>{children}</>);
const requireRoleMock = jest.fn(({ children }: { children: React.ReactNode }) => <>{children}</>);

jest.mock('@/lib/auth/guards', () => ({
  RequireAuth: (props: { children: React.ReactNode }) => requireAuthMock(props),
  RequireRole: (props: { children: React.ReactNode; minimumRole: string }) => requireRoleMock(props),
}));

jest.mock('@/views/DashboardView', () => ({ DashboardView: () => <div>Dashboard View</div> }));
jest.mock('@/views/ExperimentListView', () => ({ ExperimentListView: () => <div>Experiment List View</div> }));
jest.mock('@/views/ModelsRankingsView', () => ({ ModelsRankingsView: () => <div>Models Rankings View</div> }));
jest.mock('@/views/BlueprintsLibraryView', () => ({ BlueprintsLibraryView: () => <div>Blueprints Library View</div> }));
jest.mock('@/views/PublicHubView', () => ({ PublicHubView: () => <div>Public Hub View</div> }));
jest.mock('@/views/FavoritesLibraryView', () => ({ FavoritesLibraryView: () => <div>Favorites Library View</div> }));
jest.mock('@/views/DocumentationView', () => ({ DocumentationView: () => <div>Documentation View</div> }));
jest.mock('@/views/JobDetailView', () => ({ JobDetailView: () => <div>Job Detail View</div> }));
jest.mock('@/views/UserManagementView', () => ({ UserManagementView: () => <div>User Management View</div> }));
jest.mock('@/views/SystemManagementView', () => ({ SystemManagementView: () => <div>System Management View</div> }));

import DashboardPage from '@/app/dashboard/page';
import ExperimentsPage from '@/app/experiments/page';
import ModelsPage from '@/app/models/page';
import BlueprintsPage from '@/app/blueprints/page';
import HubPage from '@/app/hub/page';
import FavoritesPage from '@/app/favorites/page';
import DocsPage from '@/app/docs/page';
import JobsPage from '@/app/jobs/[id]/page';
import AdminUsersPage from '@/app/admin/users/page';
import SystemPage from '@/app/system/page';

describe('route rendering and protection contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders major page components', () => {
    const pages = [
      <DashboardPage key="d" />,
      <ExperimentsPage key="e" />,
      <ModelsPage key="m" />,
      <BlueprintsPage key="b" />,
      <HubPage key="h" />,
      <FavoritesPage key="f" />,
      <DocsPage key="doc" />,
      <JobsPage key="j" />,
      <AdminUsersPage key="a" />,
      <SystemPage key="s" />,
    ];
    render(<>{pages}</>);

    expect(screen.getByText('Dashboard View')).toBeInTheDocument();
    expect(screen.getByText('Experiment List View')).toBeInTheDocument();
    expect(screen.getByText('Models Rankings View')).toBeInTheDocument();
    expect(screen.getByText('Blueprints Library View')).toBeInTheDocument();
    expect(screen.getByText('Public Hub View')).toBeInTheDocument();
    expect(screen.getByText('Favorites Library View')).toBeInTheDocument();
    expect(screen.getByText('Documentation View')).toBeInTheDocument();
    expect(screen.getByText('Job Detail View')).toBeInTheDocument();
    expect(screen.getByText('User Management View')).toBeInTheDocument();
    expect(screen.getByText('System Management View')).toBeInTheDocument();
  });

  it('uses RequireAuth for authenticated pages', () => {
    render(
      <>
        <DashboardPage />
        <FavoritesPage />
        <JobsPage />
      </>,
    );

    expect(requireAuthMock).toHaveBeenCalled();
    expect(requireAuthMock).toHaveBeenCalledTimes(3);
  });

  it('uses RequireRole for role-protected pages with expected minimum role', () => {
    render(
      <>
        <AdminUsersPage />
        <SystemPage />
      </>,
    );

    expect(requireRoleMock).toHaveBeenCalledTimes(2);
    expect((requireRoleMock.mock.calls[0][0] as unknown as { minimumRole: string }).minimumRole).toBe('Moderator');
    expect((requireRoleMock.mock.calls[1][0] as unknown as { minimumRole: string }).minimumRole).toBe('Admin');
  });
});
