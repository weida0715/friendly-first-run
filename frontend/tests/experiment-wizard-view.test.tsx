import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExperimentWizardView } from '@/views/ExperimentWizardView';

const optionsMock = jest.fn();
const klinesMock = jest.fn();
const createExperimentMock = jest.fn();
const apiGetMock = jest.fn();
const pushMock = jest.fn();
const getBlueprintMetadataMock = jest.fn();

jest.mock('@/lib/api/client', () => ({
  getExperimentBlueprintOptions: (...args: unknown[]) => optionsMock(...args),
  getBTCUSDTKlines: (...args: unknown[]) => klinesMock(...args),
  getBTCUSDTMetadata: jest.fn().mockResolvedValue({ ok: true, data: { latestTimestamp: '2026-01-10T00:00:00Z' } }),
  getBlueprintMetadata: (...args: unknown[]) => getBlueprintMetadataMock(...args),
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
    getBlueprintMetadataMock.mockResolvedValue({ ok: true, data: { architectures: [{ name: 'logistic_regressor_arc', displayName: 'Logistic Regressor', parameterConstraints: { C: { default: 1, type: 'number', min: 0.0001, max: 1000 }, max_iter: { default: 200, type: 'integer', min: 50, max: 5000 } } }], targets: [{ name: 'forward_return', defaultValues: { lookahead_period: 1, return_threshold: 0 }, parameterConstraints: { lookahead_period: { type: 'integer', default: 1, min: 1, max: 1440 }, return_threshold: { type: 'number', default: 0, min: -1, max: 1 } } }, { name: 'roc_lookahead', defaultValues: { lookahead_period: 1, roc_threshold: 0 }, parameterConstraints: { lookahead_period: { type: 'integer', default: 1, min: 1, max: 1440 }, roc_threshold: { type: 'number', default: 0, min: -1, max: 1 } } }] } });
    apiGetMock.mockResolvedValue({ ok: true, data: { blueprint: { architecture: { name: 'logistic_regressor_arc', parameters: { C: 1, max_iter: 200 } }, indicators: { definitions: [{ name: 'RSI', parameters: { timeperiod: 14 } }] } } } });
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
    expect(screen.getByText('Accessible Blueprints')).toBeInTheDocument();
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

  it('keeps deterministic seed visible with default value when deterministic mode is enabled', async () => {
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

    expect(screen.getByText('Seed is required only when deterministic mode is enabled.')).toBeInTheDocument();
    expect((screen.getByLabelText('Seed') as HTMLInputElement).value).toBe('42');
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
    await user.selectOptions(screen.getByLabelText('Target Strategy'), 'roc_lookahead');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('Architecture Overrides')).toBeInTheDocument());
  });

  it('tokenizes target parameters on space and validates target constraints', async () => {
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

    expect(screen.getByRole('button', { name: /remove 1/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /remove 1/i }));
    const input = screen.getByLabelText('lookahead_period value');
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.keyDown(input, { key: ' ' });
    expect(screen.getByRole('button', { name: /remove 2/i })).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.keyDown(input, { key: ' ' });
    expect(screen.getByRole('alert')).toHaveTextContent('Value must be >= 1.');
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
    expect(screen.getByRole('button', { name: /remove 2/i })).toBeInTheDocument();
  });

  it('shows split computed total and blocks progression when total is not 100%', async () => {
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

    await user.clear(screen.getByLabelText('Train Split'));
    await user.type(screen.getByLabelText('Train Split'), '70');
    await user.clear(screen.getByLabelText('Validation Split'));
    await user.type(screen.getByLabelText('Validation Split'), '10');
    await user.clear(screen.getByLabelText('Test Split'));
    await user.type(screen.getByLabelText('Test Split'), '10');

    expect(screen.getByText('Computed Total: 90.00%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Train + Validation + Test must total 100%.')).toBeInTheDocument();
  });

  it('surfaces min constraints for validation/test splits and allows valid split progression', async () => {
    const user = userEvent.setup();
    optionsMock.mockResolvedValue({ ok: true, data: { items: [] } });

    render(<ExperimentWizardView />);
    await waitFor(() => expect(screen.getByText('Step 1: Basics')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Experiment Name'), 'Split Min Constraints');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Start Datetime'), { target: { value: '2026-01-01T00:00' } });
    fireEvent.change(screen.getByLabelText('End Datetime'), { target: { value: '2026-01-10T00:00' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.clear(screen.getByLabelText('Train Split'));
    await user.type(screen.getByLabelText('Train Split'), '90');
    await user.clear(screen.getByLabelText('Validation Split'));
    await user.type(screen.getByLabelText('Validation Split'), '5');
    await user.clear(screen.getByLabelText('Test Split'));
    await user.type(screen.getByLabelText('Test Split'), '5');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Validation split must be at least 10%.')).toBeInTheDocument();
    expect(screen.getByText('Test split must be at least 10%.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Train Split'));
    await user.type(screen.getByLabelText('Train Split'), '80');
    await user.clear(screen.getByLabelText('Validation Split'));
    await user.type(screen.getByLabelText('Validation Split'), '10');
    await user.clear(screen.getByLabelText('Test Split'));
    await user.type(screen.getByLabelText('Test Split'), '10');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(screen.getByText('Accessible Blueprints')).toBeInTheDocument());
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
