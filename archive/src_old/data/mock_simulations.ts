export interface Simulation {
  id: string;
  name: string;
  description: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  updated_at: string;
  owner: string;
  symbol: string;
  interval: string;
  date_range: {
    start: string;
    end: string;
  };
  metrics: {
    sharpe?: number;
    accuracy?: number;
    max_drawdown?: number;
    win_rate?: number;
    total_return?: number;
  };
  models: string[];
}

export const mockSimulations: Simulation[] = [
  {
    id: '1',
    name: 'Q4 Momentum',
    description: 'Simulation of Q4 momentum strategy',
    status: 'completed',
    progress: 100,
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T16:30:00Z',
    owner: 'alex',
    symbol: 'BTCUSDT',
    interval: '1h',
    date_range: {
      start: '2023-10-01',
      end: '2023-12-31'
    },
    metrics: {
      sharpe: 1.9,
      accuracy: 0.74,
      max_drawdown: 0.18,
      win_rate: 0.65,
      total_return: 0.14
    },
    models: ['Momentum Alpha', 'Trend Runner']
  },
  {
    id: '2',
    name: 'Volatility Carry',
    description: 'Simulation of volatility carry strategy',
    status: 'running',
    progress: 52,
    created_at: '2024-02-08T09:30:00Z',
    updated_at: '2024-02-09T01:50:00Z',
    owner: 'alex',
    symbol: 'BTCUSDT',
    interval: '4h',
    date_range: {
      start: '2023-10-01',
      end: '2023-12-31'
    },
    metrics: {},
    models: ['Volatility Screen', 'Carry Blend']
  },
  {
    id: '3',
    name: 'Macro Blend',
    description: 'Simulation of macro blend strategy',
    status: 'queued',
    progress: 0,
    created_at: '2024-02-09T00:00:00Z',
    updated_at: '2024-02-09T00:00:00Z',
    owner: 'alex',
    symbol: 'BTCUSDT',
    interval: '1D',
    date_range: {
      start: '2023-10-01',
      end: '2023-12-31'
    },
    metrics: {},
    models: ['Macro Trend Tracker', 'Mean Reversion']
  }
];