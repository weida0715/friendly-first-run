import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { DocumentationView } from '@/views/DocumentationView';
import { getDocumentation, listDocumentation } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => ({
  listDocumentation: jest.fn(async () => ({ ok: true, data: { items: [{ slug: 'public-hub', title: 'Public Hub', category: 'Public Hub' }] } })),
  getDocumentation: jest.fn(async () => ({
    ok: true,
    data: {
      doc: {
        slug: 'public-hub',
        title: 'Public Hub',
        category: 'Public Hub',
        body: '# Public Hub\n\nThe `Public Hub` shows [enabled users](/hub).\n\n| Field | Meaning |\n| --- | --- |\n| `ownerId` | Filter by owner |\n| `q` | Search term |\n\n- Approved Blueprints\n- Completed experiments\n\n```text\nexport ready\n```',
      },
    },
  })),
}));

describe('DocumentationView', () => {
  it('renders documentation list and detail', async () => {
    render(<DocumentationView />);

    expect((await screen.findAllByText('Public Hub')).length).toBeGreaterThan(0);
    expect(await screen.findByText('Public Hub', { selector: 'code' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'enabled users' })).toHaveAttribute('href', '/hub');
    expect(await screen.findByText('Field')).toBeInTheDocument();
    expect(await screen.findByText('ownerId')).toBeInTheDocument();
    expect(await screen.findByText('Approved Blueprints')).toBeInTheDocument();
    expect(await screen.findByText('export ready')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search documentation'), { target: { value: 'public' } });
    await waitFor(() => expect(listDocumentation).toHaveBeenCalledWith('public'));
    expect(getDocumentation).toHaveBeenCalledWith('public-hub');
  });
});
