import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FavoritesLibraryView } from '@/views/FavoritesLibraryView';

const getFavoritedModelsMock = jest.fn();
const listFavoritedBlueprintsMock = jest.fn();

jest.mock('@/lib/api/client', () => ({
  getFavoritedModels: (...args: unknown[]) => getFavoritedModelsMock(...args),
  listFavoritedBlueprints: (...args: unknown[]) => listFavoritedBlueprintsMock(...args),
}));

describe('FavoritesLibraryView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads favorited models and blueprints and filters them locally', async () => {
    const user = userEvent.setup();
    getFavoritedModelsMock.mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            id: 11,
            detailPath: '/models/11',
            experiment: { name: 'Signal Quality Run' },
            blueprint: { name: 'Momentum Blueprint' },
          },
        ],
      },
    });
    listFavoritedBlueprintsMock.mockResolvedValue({
      ok: true,
      data: {
        items: [
          { id: 7, name: 'Breakout Blueprint', approvalState: 'Approved', version: 2 },
        ],
      },
    });

    render(<FavoritesLibraryView />);

    await waitFor(() => expect(screen.getByText('Signal Quality Run')).toBeInTheDocument());
    expect(screen.getByText('Breakout Blueprint')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Models' }));
    expect(screen.getByText('Signal Quality Run')).toBeInTheDocument();
    expect(screen.queryByText('Breakout Blueprint')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Blueprints' }));
    expect(screen.queryByText('Signal Quality Run')).not.toBeInTheDocument();
    expect(screen.getByText('Breakout Blueprint')).toBeInTheDocument();
  });
});
