import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PublicHubView } from '@/views/PublicHubView';
import { getPublicHub } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => ({
  getPublicHub: jest.fn(async ({ tab }: { tab?: string }) => ({
    ok: true,
    data: {
      tab,
      items: [{ id: 7, name: 'Public Exp', status: 'Completed', detailPath: '/experiments/7' }],
    },
  })),
}));

describe('PublicHubView', () => {
  it('loads public records and switches tabs', async () => {
    render(<PublicHubView />);

    expect(await screen.findByText('Public Exp')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Models' }));

    await waitFor(() => expect(getPublicHub).toHaveBeenLastCalledWith({ tab: 'models', q: '' }));
  });
});
