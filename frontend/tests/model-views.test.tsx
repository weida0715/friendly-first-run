import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModelsRankingsView } from '@/views/ModelsRankingsView';
import { ModelDetailView } from '@/views/ModelDetailView';

const getModelRankingsMock = jest.fn();
const getModelHighlightsMock = jest.fn();
const getFavoritedModelsMock = jest.fn();
const getModelDetailMock = jest.fn();
const favoriteModelMock = jest.fn();
const unfavoriteModelMock = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '42' }),
}));

jest.mock('@/lib/api/client', () => ({
  getModelRankings: (...args: unknown[]) => getModelRankingsMock(...args),
  getModelHighlights: (...args: unknown[]) => getModelHighlightsMock(...args),
  getFavoritedModels: (...args: unknown[]) => getFavoritedModelsMock(...args),
  getModelDetail: (...args: unknown[]) => getModelDetailMock(...args),
  favoriteModel: (...args: unknown[]) => favoriteModelMock(...args),
  unfavoriteModel: (...args: unknown[]) => unfavoriteModelMock(...args),
}));

const model = {
  id: 42,
  experiment: { id: 7, name: 'Exp A', status: 'Completed' },
  blueprint: { id: 3, name: 'BP A', approvalState: 'Approved', version: 1 },
  owner: { id: 1, username: 'owner' },
  parameters: {
    architecture: { name: 'ridge', alpha: 1 },
    indicators: [{ name: 'rsi', period: 14 }],
    split: { train: 0.8 },
    target: { horizon: 1 },
    c: 2,
  },
  parameterHash: 'hash-42',
  metrics: { sharpe: 1.25, accuracy: 0.9, precision: 0.8, recall: 0.7, total_return_net_pct: 12, trade_win_rate_pct: 55, maxDrawdown: 8, winRate: 55 },
  logMetrics: [{ type: 'backtest', max_drawdown_pct: 8, total_return_net_pct: 12, trade_win_rate_pct: 55 }, { type: 'classification', f1: 0.75 }],
  createdAt: '2026-01-01T00:00:00',
  isFavorited: true,
  detailPath: '/models/42',
};

const stringMetricModel = {
  ...model,
  id: 43,
  detailPath: '/models/43',
  metrics: { ...model.metrics, sharpe: '1.25' },
};

describe('model views', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getModelHighlightsMock.mockResolvedValue({ ok: true, data: { sharpe: [model], totalReturn: [model], accuracy: [model], winRate: [model] } });
    getFavoritedModelsMock.mockResolvedValue({ ok: true, data: { items: [model] } });
  });

  it('renders rankings rows with detail links and sortable headings', async () => {
    getModelRankingsMock.mockResolvedValue({ ok: true, data: { items: [model], page: 1, totalPages: 1 } });
    render(<ModelsRankingsView />);

    await waitFor(() => expect(screen.getByRole('link', { name: '#42' })).toHaveAttribute('href', '/models/42'));
    expect(screen.getByText('Best Sharpe')).toBeInTheDocument();
    expect(screen.getByText('Best Total Return')).toBeInTheDocument();
    expect(screen.getByText('Best Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Favorited Models')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Model #42' })).toHaveAttribute('href', '/models/42');
    expect(screen.getAllByRole('link', { name: /#1 Model 42/i })[0]).toHaveAttribute('href', '/models/42');
    expect(screen.getAllByText('Exp A').length).toBeGreaterThan(0);
    expect(screen.getByText('BP A')).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'max_drawdown' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'win_rate' })).not.toBeInTheDocument();

    expect(screen.queryByText('Metric')).not.toBeInTheDocument();
    expect(screen.queryByText('Recall')).not.toBeInTheDocument();
    expect(screen.getByText('Total Return')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    await waitFor(() => expect(getModelHighlightsMock).toHaveBeenCalledWith());
    expect(getModelHighlightsMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Sort Accuracy descending/ }));
    await waitFor(() => expect(getModelRankingsMock).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'accuracy', order: 'desc' })));
    fireEvent.click(screen.getByRole('button', { name: /Sort Accuracy ascending/ }));
    await waitFor(() => expect(getModelRankingsMock).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'accuracy', order: 'asc' })));
    fireEvent.click(screen.getByRole('button', { name: /Sort Total Return descending/ }));
    await waitFor(() => expect(getModelRankingsMock).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'total_return_net_pct', order: 'desc' })));
    fireEvent.click(screen.getByRole('button', { name: /Sort Win Rate descending/ }));
    await waitFor(() => expect(getModelRankingsMock).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'trade_win_rate_pct', order: 'desc' })));
  });

  it('serializes search and filter rules', async () => {
    const user = userEvent.setup();
    getModelRankingsMock.mockResolvedValue({ ok: true, data: { items: [model], page: 1, totalPages: 1 } });
    render(<ModelsRankingsView />);
    await waitFor(() => expect(screen.getByRole('link', { name: '#42' })).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText(/Search model ID/i), 'Exp A');
    fireEvent.click(screen.getByRole('button', { name: 'Add filter' }));
    await user.clear(screen.getByPlaceholderText('Min'));
    await user.type(screen.getByPlaceholderText('Min'), '1');
    await user.clear(screen.getByPlaceholderText('Max'));
    await user.type(screen.getByPlaceholderText('Max'), '2');
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(getModelRankingsMock).toHaveBeenLastCalledWith(expect.objectContaining({
      q: 'Exp A',
      filters: [expect.objectContaining({ column: 'sharpe', op: 'between', min: '1', max: '2' })],
    })));

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(getModelRankingsMock).toHaveBeenLastCalledWith(expect.objectContaining({ filters: [] })));
  });

  it('limits filter operators by column type and resets invalid operators', async () => {
    const user = userEvent.setup();
    getModelRankingsMock.mockResolvedValue({ ok: true, data: { items: [model], page: 1, totalPages: 1 } });
    render(<ModelsRankingsView />);
    await waitFor(() => expect(screen.getByRole('link', { name: '#42' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Add filter' }));
    const column = screen.getByLabelText('Filter column');
    const operator = screen.getByLabelText('Filter operator');

    await user.selectOptions(column, 'owner');
    expect(screen.getByRole('option', { name: 'contains' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'equals' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'between' })).not.toBeInTheDocument();

    await user.selectOptions(column, 'total_return_net_pct');
    expect(operator).toHaveValue('min');
    expect(screen.getByRole('option', { name: 'between' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'contains' })).not.toBeInTheDocument();

    await user.selectOptions(column, 'model_id');
    expect(operator).toHaveValue('equals');
    expect(screen.queryByRole('option', { name: 'between' })).not.toBeInTheDocument();
  });

  it('does not format numeric strings as metric decimals', async () => {
    getModelRankingsMock.mockResolvedValue({ ok: true, data: { items: [stringMetricModel], page: 1, totalPages: 1 } });
    render(<ModelsRankingsView />);

    await waitFor(() => expect(screen.getByRole('link', { name: '#43' })).toBeInTheDocument());
    expect(screen.getByText('1.25')).toBeInTheDocument();
    expect(screen.queryByText('1.250')).not.toBeInTheDocument();
  });

  it('renders model rankings API errors instead of silent empty states', async () => {
    getModelRankingsMock.mockRejectedValue(new Error('rankings down'));
    getFavoritedModelsMock.mockRejectedValue(new Error('favorites down'));
    getModelHighlightsMock.mockRejectedValue(new Error('highlights down'));

    render(<ModelsRankingsView />);

    expect(await screen.findByText('Unable to load model rankings.')).toBeInTheDocument();
    expect(await screen.findByText('Unable to load favorited models.')).toBeInTheDocument();
    expect((await screen.findAllByText('Unable to load model highlights.')).length).toBe(4);
  });

  it('passes includeIncomplete when toggled', async () => {
    getModelRankingsMock.mockResolvedValue({ ok: true, data: { items: [model], page: 1, totalPages: 1 } });
    render(<ModelsRankingsView />);
    await waitFor(() => expect(screen.getByRole('link', { name: '#42' })).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Include incomplete'));
    await waitFor(() => expect(getModelRankingsMock).toHaveBeenLastCalledWith(expect.objectContaining({ includeIncomplete: true })));
  });

  it('removes favorited model from rankings immediately after unfavorite', async () => {
    getModelRankingsMock.mockResolvedValue({ ok: true, data: { items: [model], page: 1, totalPages: 1 } });
    getFavoritedModelsMock.mockResolvedValue({ ok: true, data: { items: [model] } });
    unfavoriteModelMock.mockResolvedValue({ ok: true, data: { favorited: false } });

    render(<ModelsRankingsView />);
    await waitFor(() => expect(screen.getByText('Model #42')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Unfavorite' }));
    await waitFor(() => expect(screen.queryByText('Model #42')).not.toBeInTheDocument());
  });

  it('renders model detail metrics, nested parameters, and readable logs', async () => {
    getModelDetailMock.mockResolvedValue({ ok: true, data: { model } });
    render(<ModelDetailView />);

    await waitFor(() => expect(screen.getByText('Model #42')).toBeInTheDocument());
    expect(screen.getByText('Exp A')).toBeInTheDocument();
    expect(screen.getByText('BP A')).toBeInTheDocument();
    expect(screen.getByText('hash-42')).toBeInTheDocument();
    expect(screen.queryByText('NaN')).not.toBeInTheDocument();
    expect(screen.getByText('Architecture')).toBeInTheDocument();
    expect(screen.getByText('ridge')).toBeInTheDocument();
    expect(screen.getByText('Backtest Metrics')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New Experiment' })).toHaveAttribute('href', '/experiments/new?modelId=42');
    expect(screen.getByText('Total Return')).toBeInTheDocument();
    expect(screen.getByText('Classification Metrics')).toBeInTheDocument();
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
  });
});
