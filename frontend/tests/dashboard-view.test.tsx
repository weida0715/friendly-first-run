import { render, screen, waitFor } from '@testing-library/react';
import { DashboardView } from '@/views/DashboardView';

const getBTCUSDTKlinesMock = jest.fn();
const listExperimentsMock = jest.fn();
const getModelRankingsMock = jest.fn();
const listOwnedBlueprintsMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('@/lib/auth/useAuth', () => ({
  useAuth: () => ({ logout: jest.fn() }),
}));

jest.mock('@/components/status/BackendHealthStatus', () => ({
  BackendHealthStatus: () => <div>Backend Health Widget</div>,
}));

jest.mock('@/lib/api/client', () => ({
  getBTCUSDTKlines: (...args: unknown[]) => getBTCUSDTKlinesMock(...args),
  listExperiments: (...args: unknown[]) => listExperimentsMock(...args),
  getModelRankings: (...args: unknown[]) => getModelRankingsMock(...args),
  listOwnedBlueprints: (...args: unknown[]) => listOwnedBlueprintsMock(...args),
}));

jest.mock('@/components/charts', () => ({
  BTCUSDTPriceChart: () => <div>BTCUSDT Chart Mock</div>,
  useBTCUSDTChartData: () => ({
    data: [],
    loading: false,
    loadingOlder: false,
    hasMoreOlder: false,
    loadOlder: jest.fn(),
    error: null,
  }),
}));

describe('DashboardView', () => {
  beforeEach(() => {
    listExperimentsMock.mockResolvedValue({ data: { items: [{}, {}, {}] } });
    getModelRankingsMock.mockResolvedValue({ data: { total: 1204 } });
    listOwnedBlueprintsMock.mockResolvedValue({ data: { items: [{}, {}] } });
  });

  it('renders all required dashboard cards and quick action links', async () => {
    render(<DashboardView />);

    await waitFor(() => expect(listExperimentsMock).toHaveBeenCalled());

    expect(screen.getByText('Total Experiments')).toBeInTheDocument();
    expect(screen.getByText('Total Models')).toBeInTheDocument();
    expect(screen.getAllByText('Approved Blueprints').length).toBeGreaterThan(0);
    expect(screen.getByText('BTCUSDT Market Status')).toBeInTheDocument();
    expect(screen.getByText('BTCUSDT Chart Mock')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Backend Health Widget')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Create Experiment/i })).toHaveAttribute('href', '/experiments/new');
    expect(screen.getByRole('link', { name: /Browse Experiments/i })).toHaveAttribute('href', '/experiments');
    expect(screen.getByRole('link', { name: /Create Blueprint/i })).toHaveAttribute('href', '/blueprints/new');
    expect(screen.getByRole('link', { name: /View Rankings/i })).toHaveAttribute('href', '/models');
    expect(screen.getByRole('link', { name: /Open Blueprints/i })).toHaveAttribute('href', '/blueprints');
    expect(screen.getByRole('link', { name: 'Open Jobs' })).toHaveAttribute('href', '/jobs');
  });

  it('renders loading state and live stat fallbacks from widget props', async () => {
    listExperimentsMock.mockResolvedValue({ data: { items: [] } });
    getModelRankingsMock.mockResolvedValue({ data: { total: 0 } });
    listOwnedBlueprintsMock.mockResolvedValue({ data: { items: [] } });

    render(<DashboardView data={{ market: { loading: true, price: '-', change24h: '-', status: 'active' } }} />);

    await waitFor(() => expect(getModelRankingsMock).toHaveBeenCalled());
    expect(screen.getByText('BTCUSDT Chart Mock')).toBeInTheDocument();
  });
});
