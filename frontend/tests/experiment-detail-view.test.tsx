import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { ExperimentDetailView } from '@/views/ExperimentDetailView';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '101' }),
}));

jest.mock('@/lib/api/client', () => ({
  getExperimentDetail: jest.fn(async () => {
    const backtestLogs = Array.from({ length: 25 }, (_, index) => {
      const modelId = index + 1;
      const isClusterPair = modelId === 2 || modelId === 3;
      return {
        modelId,
        max_drawdown_pct: isClusterPair ? 12.7 : Number((6 + index * 0.2).toFixed(1)),
        total_return_net_pct: isClusterPair ? 18.1 : Number((30 - index * 0.5).toFixed(1)),
        total_return_gross_pct: isClusterPair ? 20.4 : Number((35 - index * 0.4).toFixed(1)),
        sharpe_per_bar: isClusterPair ? 1.12 : Number((1.8 - index * 0.02).toFixed(2)),
        sharpe_annualized: isClusterPair ? 11.2 : Number((18.4 - index * 0.2).toFixed(1)),
        trades_count: isClusterPair ? (index === 1 ? 220 : 180) : 100 + index * 5,
        trade_expectancy_pct: isClusterPair ? (index === 1 ? 0.21 : 0.19) : Number((0.5 - index * 0.01).toFixed(2)),
        trade_win_rate_pct: isClusterPair ? (index === 1 ? 54.1 : 53.2) : Number((60 - index * 0.3).toFixed(1)),
        parameter_hash: `hash-${String(modelId).padStart(2, '0')}`,
      };
    });

    return {
      ok: true,
      data: {
        experiment: {
          id: 101,
          name: 'Exp A',
          status: 'Completed',
          canCancelQueued: true,
          interval: '1m',
          startDate: '2026-01-01',
          endDate: '2026-01-10',
          parameterOverrides: { window: 20 },
          backtestLogs,
          confusionMetrics: [{ modelId: 1, tp_count: 2, fp_count: 1, tn_count: 3, fn_count: 4, accuracy_pct: 50, precision_pct: 66.7, recall_pct: 33.3, pred_pos_rate_pct: 30, actual_pos_rate_pct: 60 }],
        },
      },
    };
  }),
  cancelExperiment: jest.fn(async () => ({ ok: true, data: { experiment: { id: 101, cancelled: true } } })),
}));

describe('ExperimentDetailView', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders configuration section with fetched data', async () => {
    render(<ExperimentDetailView />);

    expect(screen.getByText('Experiment Detail')).toBeInTheDocument();
    expect(await screen.findByText('Configuration')).toBeInTheDocument();
    expect(await screen.findByText('Exp A')).toBeInTheDocument();
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
    expect(await screen.findByRole('button', { name: 'Cancel Experiment' })).toBeInTheDocument();
    expect(screen.queryByText('Classification Quality')).not.toBeInTheDocument();
  });

  it('opens expanded risk chart modal with guidance text', async () => {
    const parentWheel = jest.fn();
    render(<div onWheel={parentWheel}><ExperimentDetailView /></div>);

    await screen.findByText('Exp A');
    const expandButton = await screen.findByRole('button', { name: /Expand Net Return vs Max Drawdown/i });
    fireEvent.click(expandButton);

    expect(await screen.findByRole('dialog', { name: 'Net Return vs Max Drawdown' })).toBeInTheDocument();
    expect(screen.getByText(/What to look for/i)).toBeInTheDocument();
    expect(screen.getByText(/upper-left area/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Dot size represents how many models share the same chart position/i).length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('risk-x-tick-label').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('risk-y-tick-label').length).toBeGreaterThan(0);

    const snapshot = screen.getByTestId('risk-selected-model-snapshot');
    expect(snapshot).toHaveTextContent('Models in dot');
    expect(snapshot).toHaveTextContent('1');

    fireEvent.wheel(screen.getByTestId('risk-expanded-scatter'), { deltaY: -100 });
    expect(parentWheel).not.toHaveBeenCalled();
    expect(screen.getAllByText(/Dot size represents how many models share the same chart position/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Close Net Return vs Max Drawdown modal/i }));
    expect(screen.queryByRole('dialog', { name: 'Net Return vs Max Drawdown' })).not.toBeInTheDocument();
  });

  it('paginates the models leaderboard and opens model detail popup from view', async () => {
    render(<ExperimentDetailView />);

    await screen.findByText('Exp A');
    expect(await screen.findByText('Models Leaderboard')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    const row = await screen.findByText('#21');
    expect(row).toBeInTheDocument();
    const tableRow = row.closest('tr');
    expect(row).not.toBeNull();
    fireEvent.click(within(tableRow as HTMLTableRowElement).getByRole('button', { name: 'View' }));

    const dialog = await screen.findByRole('dialog', { name: 'Model #21' });
    expect(within(dialog).getByText('Performance')).toBeInTheDocument();
    expect(within(dialog).getByText('#21')).toBeInTheDocument();
    expect(within(dialog).getByText('Net return')).toBeInTheDocument();
    expect(within(dialog).getByText('Sharpe annualized')).toBeInTheDocument();
    expect(within(dialog).getByText('Parameters')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close model detail modal' }));
    expect(screen.queryByRole('dialog', { name: 'Model #21' })).not.toBeInTheDocument();
  });

  it('shows retraining progress while round log CSV is prepared', async () => {
    let finishDownload: (response: Response) => void = () => undefined;
    jest.spyOn(global, 'fetch').mockImplementation(() => new Promise((resolve) => {
      finishDownload = resolve;
    }) as Promise<Response>);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:round-log') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    render(<ExperimentDetailView />);

    fireEvent.change(await screen.findByLabelText('Model ID for round log download'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Download round log CSV' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Retraining model to regenerate the round log');

    finishDownload({ ok: true, status: 200, blob: async () => new Blob(['roundIndex']) } as Response);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });

  it('shows completed experiment download actions', async () => {
    render(<ExperimentDetailView />);

    expect(await screen.findByRole('link', { name: 'Download backtest CSV' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download experiment config JSON' })).toBeInTheDocument();
  });
});
