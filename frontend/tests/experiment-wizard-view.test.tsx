import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExperimentWizardView } from '@/views/ExperimentWizardView';

const optionsMock = jest.fn();
const klinesMock = jest.fn();
const targetPreviewMock = jest.fn();
const createExperimentMock = jest.fn();
const apiGetMock = jest.fn();
const pushMock = jest.fn();
const getBlueprintMetadataMock = jest.fn();
const getSystemSettingsMock = jest.fn();

jest.mock('@/lib/api/client', () => ({
  getExperimentBlueprintOptions: (...args: unknown[]) => optionsMock(...args),
  getBTCUSDTKlines: (...args: unknown[]) => klinesMock(...args),
  getBTCUSDTTargetPreview: (...args: unknown[]) => targetPreviewMock(...args),
  getBTCUSDTMetadata: jest.fn().mockResolvedValue({ ok: true, data: { earliestTimestamp: '2026-01-01T00:00:00Z', latestTimestamp: '2026-01-10T00:00:00Z' } }),
  getBlueprintMetadata: (...args: unknown[]) => getBlueprintMetadataMock(...args),
  getSystemSettings: (...args: unknown[]) => getSystemSettingsMock(...args),
  createExperiment: (...args: unknown[]) => createExperimentMock(...args),
  apiGet: (...args: unknown[]) => apiGetMock(...args),
  ApiClientError: class ApiClientError extends Error {
    status: number;
    details?: unknown;
    constructor(message: string, status: number, details?: unknown) {
      super(message);
      this.status = status;
      this.details = details;
    }
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/components/charts', () => ({
  BTCUSDTPriceChart: () => <div>BTCUSDT Chart Mock</div>,
  useBTCUSDTChartData: () => ({ data: [], loading: false, error: null, loadOlder: jest.fn() }),
}));

describe('ExperimentWizardView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    klinesMock.mockResolvedValue({ ok: true, data: { symbol: 'BTCUSDT', interval: '1m', items: [] } });
    createExperimentMock.mockResolvedValue({ ok: true, data: { experiment: { id: 101 } } });
    getSystemSettingsMock.mockResolvedValue({ ok: true, data: { settings: { queue_job_timeout_seconds: 7200, max_requested_permutations: 500, max_round_log_rows: 0 } } });
    getBlueprintMetadataMock.mockResolvedValue({ ok: true, data: { architectures: [{ name: 'logistic_regressor_arc', displayName: 'Logistic Regressor', parameterConstraints: { C: { default: 1, type: 'number', min: 0.0001, max: 1000 }, max_iter: { default: 200, type: 'integer', min: 50, max: 5000 } } }], targets: [{ name: 'forward_return', defaultValues: { lookahead_period: 1, return_threshold: 0 }, parameterConstraints: { lookahead_period: { type: 'integer', default: 1, min: 1, max: 1440 }, return_threshold: { type: 'number', default: 0, min: -1, max: 1 } }, binaryLabelRule: '1 when close[t+lookahead] / close[t] - 1 > return_threshold, otherwise 0' }, { name: 'roc_lookahead', defaultValues: { lookahead_period: 1, roc_threshold: 0 }, parameterConstraints: { lookahead_period: { type: 'integer', default: 1, min: 1, max: 1440 }, roc_threshold: { type: 'number', default: 0, min: -1, max: 1 } }, binaryLabelRule: '1 when (close[t+lookahead] - close[t]) / close[t] > roc_threshold, otherwise 0' }, { name: 'quantile_flag', defaultValues: { roc_period: 4, q: 0.5, lookahead_period: 1 }, parameterConstraints: { roc_period: { type: 'integer', default: 4, min: 1, max: 1440 }, q: { type: 'number', default: 0.5, min: 0, max: 1 }, lookahead_period: { type: 'integer', default: 1, min: 1, max: 1440 } }, binaryLabelRule: '1 when ROC over roc_period exceeds the fitted (1-q) quantile cutoff, shifted by lookahead_period bars, otherwise 0' }, { name: 'candle_direction', defaultValues: { lookahead_period: 1 }, parameterConstraints: { lookahead_period: { type: 'integer', default: 1, min: 1, max: 1440 } }, binaryLabelRule: '1 when close[t+lookahead] > open[t+lookahead], otherwise 0' }] } });
    apiGetMock.mockResolvedValue({ ok: true, data: { blueprint: { architecture: { name: 'logistic_regressor_arc', parameters: { C: 1, max_iter: 200, class_weight: null }, parameterConstraints: { class_weight: { type: 'string', allowed_values: [null, 'balanced'] } } }, indicators: { definitions: [{ name: 'RSI', parameters: { timeperiod: 14 } }] } } } });
    targetPreviewMock.mockResolvedValue({ ok: true, data: { symbol: 'BTCUSDT', interval: '1m', strategy: { name: 'forward_return', binaryLabelRule: '1 when close[t+lookahead] / close[t] - 1 > return_threshold, otherwise 0', defaultValues: { lookahead_period: 1, return_threshold: 0 }, parameters: { lookahead_period: 1, return_threshold: 0 } }, range: { start: '2026-01-01T00:00:00Z', end: '2026-01-01T00:03:00Z', candles: 4 }, rows: [{ time: 1, timestamp: '2026-01-01T00:00:00Z', open: '100.00000000', high: '101.00000000', low: '99.00000000', close: '100.00000000', volume: '1.00000000', target: 1, candleDirection: 1, actualDirectionTarget: 1 }, { time: 2, timestamp: '2026-01-01T00:01:00Z', open: '100.00000000', high: '111.00000000', low: '99.00000000', close: '110.00000000', volume: '1.00000000', target: 0, candleDirection: -1, actualDirectionTarget: 0 }], summary: { rowCount: 2, labeledCount: 2, positiveCount: 1, negativeCount: 1, unlabeledCount: 0, positiveRatePct: 50, actualPositiveRatePct: 50, actualPositiveCount: 1, actualNegativeCount: 1, directionUpCount: 1, directionDownCount: 1, directionFlatCount: 0, warmupNullCount: 0, tailNullCount: 0, lookaheadPeriod: 1, confusion: { tp_count: 1, fp_count: 0, tn_count: 1, fn_count: 0, precision_pct: 100, recall_pct: 100, f1_score_pct: 100, accuracy_pct: 100, pred_pos_rate_pct: 50, actual_pos_rate_pct: 50, tp_mean_return_pct: 10, fp_mean_return_pct: null, tn_mean_return_pct: -4.5, fn_mean_return_pct: null } } } });
  });

  it('renders new 7-step wizard shell and dataset preview', async () => {
    optionsMock.mockResolvedValue({
      ok: true,
      data: {
        items: [
          { id: 1, name: 'Approved One', version: 1, ownerId: 8, updatedAt: '2026-01-01T00:00:00Z' },
          { id: 2, name: 'Approved Two', version: 3, ownerId: 9, updatedAt: '2026-01-01T00:00:00Z' },
        ],
      },
    });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    expect(screen.getByText('Basics')).toBeInTheDocument();
    expect(screen.getByText('Dataset Range')).toBeInTheDocument();
    expect(screen.getByText('Split Configuration')).toBeInTheDocument();
    expect(screen.getByText('Blueprint Selection')).toBeInTheDocument();
    expect(screen.getByText('Target Selection')).toBeInTheDocument();
    expect(screen.getByText('Parameter Overrides')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.queryByText('Summary')).not.toBeInTheDocument();
  });

  it('normalizes none-like architecture overrides before submit', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({
      ok: true,
      data: {
        items: [
          { id: 1, name: 'Approved One', version: 1, ownerId: 8, updatedAt: '2026-01-01T00:00:00Z' },
        ],
      },
    });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'None Normalizer');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByText('Approved One (v1)'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    const classWeightInput = await screen.findByLabelText('class_weight options');
    await user.selectOptions(classWeightInput, 'null');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Proceed to Submit' }));
    await user.click(screen.getByRole('button', { name: 'Submit Experiment' }));

    await waitFor(() => expect(createExperimentMock).toHaveBeenCalled());
    const payload = createExperimentMock.mock.calls[0][0] as { parameter_overrides?: { architecture?: { class_weight?: unknown } } };
    expect(payload.parameter_overrides?.architecture?.class_weight).toBeNull();
  });

  it('navigates to blueprint selection step and renders approved options', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({
      ok: true,
      data: {
        items: [
          { id: 1, name: 'Approved One', version: 1, ownerId: 8, updatedAt: '2026-01-01T00:00:00Z' },
          { id: 2, name: 'Approved Two', version: 3, ownerId: 9, updatedAt: '2026-01-01T00:00:00Z' },
        ],
      },
    });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'My Experiment');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(screen.getByText('Approved One (v1)')).toBeInTheDocument());
    expect(screen.getByText('Approved Two (v3)')).toBeInTheDocument();
    expect(screen.getByLabelText('Search blueprints')).toBeInTheDocument();
    expect(screen.getAllByText('Architecture').length).toBeGreaterThan(0);
  });

  it('blocks progression when no blueprint is selected and shows selected summary after picking one', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({
      ok: true,
      data: {
        items: [{ id: 1, name: 'Approved One', version: 1, ownerId: 8, updatedAt: '2026-01-01T00:00:00Z' }],
      },
    });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Blueprint Guard');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Please select a Blueprint to continue.')).toBeInTheDocument();

    await user.click(screen.getByText('Approved One (v1)'));
    expect(screen.getByText('Selected Blueprint')).toBeInTheDocument();
    expect(screen.getByText('Name:')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('Architecture Overrides')).toBeInTheDocument());
  });

  it('opens a read-only blueprint preview from the table', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({
      ok: true,
      data: {
        items: [{ id: 1, name: 'Approved One', version: 1, ownerId: 8, ownerName: 'Owner One', indicatorCount: 1, architectureName: 'logistic_regressor_arc', updatedAt: '2026-01-01T00:00:00Z' }],
        page: 1,
        totalPages: 1,
      },
    });
    apiGetMock.mockResolvedValueOnce({
      ok: true,
      data: {
        blueprint: {
          id: 1,
          metadata: { name: 'Approved One', description: 'Preview description', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
          indicators: { definitions: [{ name: 'RSI', parameters: { timeperiod: 14 } }] },
          architecture: { name: 'logistic_regressor_arc', parameters: { C: 1 } },
          approvalState: 'Approved',
          version: 1,
          owner: { id: 8, username: 'owner', name: 'Owner One' },
        },
      },
    });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Preview Blueprint');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.click(screen.getByRole('button', { name: 'View' }));
    const dialog = await screen.findByRole('dialog', { name: 'Blueprint preview' });
    const modal = within(dialog);
    expect(modal.getByText('Preview description')).toBeInTheDocument();
    expect(modal.getByText('logistic_regressor_arc')).toBeInTheDocument();
    await user.click(modal.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Blueprint preview' })).not.toBeInTheDocument());
  });

  it('renders grouped parameter override fields before allowing review', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({
      ok: true,
      data: {
        items: [{ id: 1, name: 'Approved One', version: 1, ownerId: 8, updatedAt: '2026-01-01T00:00:00Z' }],
      },
    });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Override Validation');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByText('Approved One (v1)'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Architecture Overrides')).toBeInTheDocument();
    expect(screen.getByText('Indicator Overrides')).toBeInTheDocument();
    expect(screen.getByText('Target Overrides')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('Permutation Sampling')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('Configuration Review')).toBeInTheDocument());
  });

  it('renders empty state when no approved blueprint options at blueprint step', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({ ok: true, data: { items: [] } });

    render(<ExperimentWizardView />);

    await user.type(screen.getByLabelText('Experiment Name'), 'My Experiment');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(screen.getByText('No approved blueprints available.')).toBeInTheDocument());
  });

  it('shows inline errors for required basics and dataset date range ordering', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({ ok: true, data: { items: [] } });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Experiment name is required.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Experiment Name'), 'Valid Name');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Fixed Dataset Scope')).toBeInTheDocument();
    expect(screen.getByLabelText('Interval')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-10T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-01T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Start date must be before end date.')).toBeInTheDocument();
    expect(screen.getByText('BTCUSDT 1m Dataset Preview')).toBeInTheDocument();
  });

  it('constrains dataset datetime inputs to cached kline bounds', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({ ok: true, data: { items: [] } });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Bounds Check');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(screen.getByLabelText('Start Datetime')).toHaveAttribute('min', '2026-01-01T00:00'));
    expect(screen.getByLabelText('Start Datetime')).toHaveAttribute('max', '2026-01-10T00:00');
    expect(screen.getByLabelText('End Datetime')).toHaveAttribute('min', '2026-01-01T00:00');
    expect(screen.getByLabelText('End Datetime')).toHaveAttribute('max', '2026-01-10T00:00');

    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2025-12-31T23:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Start datetime cannot be before 2026-01-01T00:00.')).toBeInTheDocument();
  });

  it('shows all RFC-009 interval options', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({ ok: true, data: { items: [] } });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Interval Check');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    const intervalSelect = screen.getByLabelText('Interval');

    expect(screen.getByRole('option', { name: '1m' })).toBeInTheDocument();
    expect(intervalSelect.querySelectorAll('option')).toHaveLength(8);
    expect(screen.getByRole('option', { name: '30m' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2h' })).toBeInTheDocument();
    expect(screen.queryByText('Summary')).not.toBeInTheDocument();
  });

  it('defaults split strategy to time_based_sequential', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({ ok: true, data: { items: [] } });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Default Split');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect((screen.getByLabelText('Split Strategy') as HTMLSelectElement).value).toBe('time_based_sequential');
  });

  it('uses split range draggers and clamps validation and test minimums', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({ ok: true, data: { items: [] } });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Split Drag');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));

    fireEvent.change(screen.getByLabelText('Validation test split boundary'), { target: { value: '95' } });

    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getAllByText('10%')).toHaveLength(2);
  });

  it('shows the deterministic seed field by default', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({
      ok: true,
      data: { items: [{ id: 1, name: 'Approved One', version: 1, ownerId: 8, updatedAt: '2026-01-01T00:00:00Z' }] },
    });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Seed Step');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByText('Approved One (v1)'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('This system is designed for deterministic execution. Set the seed used for repeatable permutation sampling.')).toBeInTheDocument();
    expect((screen.getByLabelText('Seed') as HTMLInputElement).value).toBe('42');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('adds target selection after blueprint selection', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({ ok: true, data: { items: [{ id: 1, name: 'Approved One', version: 1, ownerId: 8, updatedAt: '2026-01-01T00:00:00Z' }] } });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Target Step');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByText('Approved One (v1)'));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Target Strategy')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'quantile flag' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'candle direction' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Target Strategy'), 'roc_lookahead');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('Architecture Overrides')).toBeInTheDocument());
  });

  it('opens target info popup and shows backend preview stats', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({ ok: true, data: { items: [{ id: 1, name: 'Approved One', version: 1, ownerId: 8, updatedAt: '2026-01-01T00:00:00Z' }] } });
    targetPreviewMock.mockResolvedValueOnce({
      ok: true,
      data: {
        symbol: 'BTCUSDT',
        interval: '5m',
        mode: {
          previewMode: 'true_label',
          entryAssumption: 'next_open',
          evaluationCostBps: 0,
          mockPrecision: null,
          mockRecall: null,
          mockSeed: 42,
        },
        strategy: {
          name: 'forward_return',
          binaryLabelRule: '1 when close[t+lookahead] / close[t] - 1 > return_threshold, otherwise 0',
          defaultValues: { lookahead_period: 1, return_threshold: 0 },
          parameters: { lookahead_period: 1, return_threshold: 0 },
        },
        range: { start: '2026-01-01T00:00:00Z', end: '2026-01-01T00:09:00Z', candles: 2 },
        rows: [
          { time: 1, timestamp: '2026-01-01T00:00:00Z', open: '100.00000000', high: '110.00000000', low: '99.00000000', close: '110.00000000', volume: '5.00000000', target: 1, candleDirection: 1, actualDirectionTarget: 1 },
          { time: 2, timestamp: '2026-01-01T00:05:00Z', open: '110.00000000', high: '111.00000000', low: '99.00000000', close: '100.00000000', volume: '5.00000000', target: null, candleDirection: -1, actualDirectionTarget: 0 },
        ],
        summary: {
          rowCount: 2,
          labeledCount: 1,
          positiveCount: 0,
          negativeCount: 1,
          unlabeledCount: 1,
          positiveRatePct: 0,
          actualPositiveRatePct: 50,
          actualPositiveCount: 1,
          actualNegativeCount: 1,
          directionUpCount: 1,
          directionDownCount: 1,
          directionFlatCount: 0,
          warmupNullCount: 0,
          tailNullCount: 1,
          lookaheadPeriod: 1,
          confusion: {
            tp_count: 0,
            fp_count: 1,
            tn_count: 0,
            fn_count: 0,
            precision_pct: 0,
            recall_pct: 0,
            f1_score_pct: 0,
            accuracy_pct: 0,
            pred_pos_rate_pct: 0,
            actual_pos_rate_pct: 50,
            tp_mean_return_pct: null,
            fp_mean_return_pct: null,
            tn_mean_return_pct: null,
            fn_mean_return_pct: null,
          },
        },
        economics: {
          horizons: [
            {
              horizon: 1,
              allCount: 1,
              signalCount: 1,
              nonSignalCount: 0,
              allMeanPct: 10,
              signalMeanPct: 10,
              nonSignalMeanPct: null,
              signalSpreadPct: null,
              liftPct: 0,
              allMedianPct: 10,
              signalMedianPct: 10,
              allWinRatePct: 100,
              signalWinRatePct: 100,
              allProfitFactor: 1,
              signalProfitFactor: 1,
              positiveRatePct: 50,
            },
          ],
        },
        bridge: null,
      },
    });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Target Popup');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    fireEvent.change(screen.getByLabelText('Interval'), { target: { value: '5m' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByText('Approved One (v1)'));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.click(screen.getByRole('button', { name: 'Target info' }));
    const dialog = await screen.findByRole('dialog', { name: 'Target information' });
    await waitFor(() => expect(screen.getByText('Label balance')).toBeInTheDocument());
    expect(screen.getByText('Forward-return separation')).toBeInTheDocument();
    expect(screen.getByText('Preview Controls')).toBeInTheDocument();
    expect(screen.getByText('Diagnostics')).toBeInTheDocument();
    expect(screen.getByText('Prediction bridge')).toBeInTheDocument();
    expect(screen.getByLabelText('TP help')).toBeInTheDocument();
    expect(screen.getByLabelText('Rows help')).toBeInTheDocument();
    expect(screen.getByLabelText('Precision help')).toBeInTheDocument();
    expect(screen.getByText('BTCUSDT Chart Mock')).toBeInTheDocument();
    await waitFor(() => expect(targetPreviewMock).toHaveBeenCalled());
    await waitFor(() => expect(targetPreviewMock).toHaveBeenCalledTimes(1));
    expect(targetPreviewMock).toHaveBeenCalledWith(expect.objectContaining({
      interval: '5m',
      target_strategy: 'forward_return',
      target_params: { lookahead_period: 1, return_threshold: 0 },
      preview_mode: 'true_label',
      entry_assumption: 'next_open',
      evaluation_cost_bps: 0,
      mock_precision: 0.6,
      mock_recall: 0.35,
      mock_seed: 42,
    }));
    const modal = within(dialog);
    expect(modal.getByLabelText('lookahead_period value')).toBeInTheDocument();
    expect(modal.getByLabelText('return_threshold value')).toBeInTheDocument();
    expect(modal.getByLabelText('lookahead_period value')).toHaveAttribute('min', '0');
    fireEvent.change(modal.getByLabelText('lookahead_period value'), { target: { value: '0' } });
    expect(targetPreviewMock).toHaveBeenCalledTimes(1);
    await user.click(modal.getByRole('button', { name: 'Apply preview' }));
    await waitFor(() => expect(targetPreviewMock).toHaveBeenLastCalledWith(expect.objectContaining({
      interval: '5m',
      target_strategy: 'forward_return',
      target_params: { lookahead_period: 0, return_threshold: 0 },
      preview_mode: 'true_label',
      entry_assumption: 'next_open',
    })));
    await waitFor(() => expect(screen.getByText('Entry-aligned forward return curve')).toBeInTheDocument());
    expect(screen.getAllByText(/^TP$/)).toHaveLength(1);
    expect(screen.getAllByText(/^FP$/)).toHaveLength(1);
    expect(screen.getAllByText(/^FN$/)).toHaveLength(1);
    expect(screen.getAllByText(/^TN$/)).toHaveLength(1);
  });

  it('shows inline preview validation errors and blocks apply when a preview value is invalid', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({ ok: true, data: { items: [{ id: 1, name: 'Approved One', version: 1, ownerId: 8, updatedAt: '2026-01-01T00:00:00Z' }] } });
    targetPreviewMock.mockResolvedValue({
      ok: true,
      data: {
        symbol: 'BTCUSDT',
        interval: '1m',
        strategy: { name: 'forward_return', binaryLabelRule: '1 when close[t+lookahead] / close[t] - 1 > return_threshold, otherwise 0', defaultValues: { lookahead_period: 1, return_threshold: 0 }, parameters: { lookahead_period: 1, return_threshold: 0 } },
        range: { start: '2026-01-01T00:00:00Z', end: '2026-01-01T00:03:00Z', candles: 2 },
        rows: [],
        summary: {},
      },
    });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Target Invalid');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByText('Approved One (v1)'));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.click(screen.getByRole('button', { name: 'Target info' }));
    const dialog = await screen.findByRole('dialog', { name: 'Target information' });
    const modal = within(dialog);
    fireEvent.change(modal.getByLabelText('lookahead_period value'), { target: { value: '-1' } });
    await user.click(modal.getByRole('button', { name: 'Apply preview' }));

    expect(modal.getByText('Value must be >= 0.')).toBeInTheDocument();
    expect(targetPreviewMock).toHaveBeenCalledTimes(1);
  });

  it('renders simple target parameter inputs and validates target constraints', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({ ok: true, data: { items: [{ id: 1, name: 'Approved One', version: 1, ownerId: 8, updatedAt: '2026-01-01T00:00:00Z' }] } });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Target Tokens');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByText('Approved One (v1)'));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    const input = screen.getByLabelText('lookahead_period value');
    expect(input).toHaveValue(1);
    fireEvent.change(input, { target: { value: '2' } });
    expect(screen.getByLabelText('lookahead_period value')).toHaveValue(2);
  });

  it('tokenizes architecture overrides with metadata-backed constraints', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({ ok: true, data: { items: [{ id: 1, name: 'Approved One', version: 1, ownerId: 8, updatedAt: '2026-01-01T00:00:00Z' }] } });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Architecture Tokens');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByText('Approved One (v1)'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(screen.getByLabelText('C value')).toBeInTheDocument());
    const input = screen.getByLabelText('C value');
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.keyDown(input, { key: ' ' });
    expect(screen.getAllByRole('button', { name: /remove 2/i }).length).toBeGreaterThan(0);
  });

  it('hydrates blueprint target and indicator override values from metadata', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({
      ok: true,
      data: {
        items: [{ id: 1, name: 'Approved One', version: 1, ownerId: 8, updatedAt: '2026-01-01T00:00:00Z' }],
      },
    });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Hydrate Overrides');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByText('Approved One (v1)'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByRole('button', { name: /remove 14/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove 0/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /remove 1/i }).length).toBeGreaterThan(0);
  });

  it('shows an error when requested permutations exceed the admin cap', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({
      ok: true,
      data: {
        items: [{ id: 1, name: 'Approved One', version: 1, ownerId: 8, updatedAt: '2026-01-01T00:00:00Z' }],
      },
    });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Permutation Count');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByText('Approved One (v1)'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    if (!screen.queryByLabelText('Desired permutations to run')) {
      await user.click(screen.getByRole('button', { name: 'Next' }));
    }

    const requested = await screen.findByLabelText('Desired permutations to run');
    await user.clear(requested);
    await user.type(requested, '2000');
    await waitFor(() => expect(requested).toHaveAttribute('aria-invalid', 'true'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(requested).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Desired permutations to run')).toBeInTheDocument();
  });

  it('shows split computed total from the range bar', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({ ok: true, data: { items: [] } });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Split Total Check');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Computed Total: 100.00%')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Train validation split boundary'), { target: { value: '70' } });
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('Computed Total: 100.00%')).toBeInTheDocument();
  });

  it('allows valid split progression from the range bar', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({ ok: true, data: { items: [] } });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Split Min Constraints');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));

    fireEvent.change(screen.getByLabelText('Validation test split boundary'), { target: { value: '95' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(screen.getByLabelText('Search blueprints')).toBeInTheDocument());
  });

  it('submits experiment and redirects to detail on success', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({
      ok: true,
      data: {
        items: [{ id: 1, name: 'Approved One', version: 1, ownerId: 8, updatedAt: '2026-01-01T00:00:00Z' }],
      },
    });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Submit Flow');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByText('Approved One (v1)'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
        await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Proceed to Submit' }));

    await user.click(screen.getByRole('button', { name: 'Submit Experiment' }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/experiments/101'));
  });

  it('supports back navigation across steps', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({ ok: true, data: { items: [] } });

    render(<ExperimentWizardView />);
    await user.type(screen.getByLabelText('Experiment Name'), 'Back Flow');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Step 2: Dataset Range')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Step 1: Basics')).toBeInTheDocument();
  });

  it('maps backend 422 field errors onto wizard fields', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({
      ok: true,
      data: { items: [{ id: 1, name: 'Approved One', version: 1, ownerId: 8, updatedAt: '2026-01-01T00:00:00Z' }] },
    });
    createExperimentMock.mockRejectedValue({
      name: 'ApiClientError',
      status: 422,
      details: { data: { errors: { splitTotal: 'Train + Validation + Test must total 100%.' } } },
    });

    render(<ExperimentWizardView />);
    await user.type(screen.getByLabelText('Experiment Name'), '422 Flow');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByText('Approved One (v1)'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
        await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Proceed to Submit' }));
    await user.click(screen.getByRole('button', { name: 'Submit Experiment' }));

    await waitFor(() => expect(screen.getByText('Failed to submit experiment.')).toBeInTheDocument());
  });
});
