import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BlueprintsLibraryView } from '@/views/BlueprintsLibraryView';
import { BlueprintDetailView } from '@/views/BlueprintDetailView';
import { BlueprintModerationView } from '@/views/BlueprintModerationView';

const apiGetMock = jest.fn();
const favoriteMock = jest.fn();
const unfavoriteMock = jest.fn();
const requestApprovalMock = jest.fn();
const moderationQueueMock = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
}));

jest.mock('@/lib/api/client', () => ({
  apiGet: (...args: unknown[]) => apiGetMock(...args),
  favoriteBlueprint: (...args: unknown[]) => favoriteMock(...args),
  unfavoriteBlueprint: (...args: unknown[]) => unfavoriteMock(...args),
  requestBlueprintApproval: (...args: unknown[]) => requestApprovalMock(...args),
  getBlueprintModerationQueue: (...args: unknown[]) => moderationQueueMock(...args),
  approveBlueprint: jest.fn().mockResolvedValue({ ok: true }),
  rejectBlueprint: jest.fn().mockResolvedValue({ ok: true }),
  disapproveBlueprint: jest.fn().mockResolvedValue({ ok: true }),
}));

describe('blueprint library/detail/moderation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders owned and favorited lists through tabs', async () => {
    apiGetMock
      .mockResolvedValueOnce({ ok: true, data: { items: [{ id: 1, name: 'Owned A', approvalState: 'Draft', version: 1, updatedAt: '2026-01-01T00:00:00Z', isFavorited: false }] } })
      .mockResolvedValueOnce({ ok: true, data: { items: [{ id: 2, name: 'Fav B', approvalState: 'Approved', version: 2, updatedAt: '2026-01-01T00:00:00Z', isFavorited: true }] } });

    render(<BlueprintsLibraryView />);
    await waitFor(() => expect(screen.getByText('Owned A')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Favorited' }));
    await waitFor(() => expect(screen.getByText('Fav B')).toBeInTheDocument());
  });

  it('renders detail status/lineage and favorite toggle UX', async () => {
    apiGetMock.mockResolvedValueOnce({
      ok: true,
      data: {
        blueprint: {
          id: 1,
          metadata: { name: 'BP One', description: 'Desc', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
          indicators: { selected: ['rsi'] },
          architecture: { reference: 'logreg_binary' },
          approvalState: 'Approved',
          version: 2,
          lineage: { parent: { id: 9, name: 'BP Parent', version: 1 }, children: [{ id: 3, name: 'BP Child', version: 3, approvalState: 'Draft' }] },
          owner: { id: 8, username: 'owner', name: 'Owner' },
          viewer: { isAuthenticated: true, isOwner: false, isStaff: false, role: 'User', isFavorited: false },
        },
      },
    });
    favoriteMock.mockResolvedValue({ ok: true });

    render(<BlueprintDetailView />);
    await waitFor(() => expect(screen.getByText('BP One')).toBeInTheDocument());
    expect(screen.getByText('Lineage')).toBeInTheDocument();
    expect(screen.getByText(/BP Parent/)).toBeInTheDocument();
    expect(screen.getByText(/BP Child/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Favorite' }));
    await waitFor(() => expect(favoriteMock).toHaveBeenCalledWith(1));
  });

  it('shows moderation actions when queue has items', async () => {
    moderationQueueMock.mockResolvedValue({
      ok: true,
      data: { items: [{ id: 7, name: 'Pending BP', approvalState: 'Pending', version: 1, submittedAt: null, updatedAt: '2026-01-01T00:00:00Z' }] },
    });

    render(<BlueprintModerationView />);
    await waitFor(() => expect(screen.getAllByText('Pending BP').length).toBeGreaterThan(0));
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disapprove' })).toBeInTheDocument();
  });
});
