import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ExperimentListView } from '@/views/ExperimentListView';

const listExperimentsMock = jest.fn();

jest.mock('@/lib/api/client', () => ({
  listExperiments: (...args: unknown[]) => listExperimentsMock(...args),
  cancelExperiment: jest.fn(async () => ({ ok: true, data: { experiment: { cancelled: true } } })),
}));

describe('ExperimentListView', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    listExperimentsMock.mockResolvedValue({ ok: true, data: { items: [] } });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces search/status API calls', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ExperimentListView />);

    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(listExperimentsMock).toHaveBeenCalledTimes(1);

    const search = screen.getByPlaceholderText('Search experiment name...');
    await user.type(search, 'abc');

    expect(listExperimentsMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(listExperimentsMock).toHaveBeenCalledTimes(2);
    expect(listExperimentsMock).toHaveBeenLastCalledWith({ status: undefined, search: 'abc' });
  });

  it('shows a graceful error state when network request fails', async () => {
    listExperimentsMock.mockRejectedValueOnce(new Error('Failed to fetch'));
    render(<ExperimentListView />);

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(await screen.findByText('Unable to load experiments')).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
  });
});
