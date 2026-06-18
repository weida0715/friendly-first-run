export interface Experiment {
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
  splits: {
    train: number;
    validation: number;
    test: number;
  };
  metrics: {
    sharpe?: number;
    accuracy?: number;
    max_drawdown?: number;
    win_rate?: number;
  };
}

export const mockExperiments: Experiment[] = [
  {
    id: '1',
    name: 'Momentum Mix v3',
    description: 'A momentum-based strategy using multiple timeframes',
    status: 'running',
    progress: 62,
    created_at: '2024-02-08T10:00:00Z',
    updated_at: '2024-02-09T01:45:00Z',
    owner: 'alina',
    symbol: 'BTCUSDT',
    interval: '1h',
    date_range: {
      start: '2024-01-01',
      end: '2024-03-01'
    },
    splits: {
      train: 70,
      validation: 15,
      test: 15
    },
    metrics: {
      sharpe: 1.8,
      accuracy: 0.72,
      max_drawdown: 0.125,
      win_rate: 0.68
    }
  },
  {
    id: '2',
    name: 'Volatility Screen',
    description: 'Identifies volatility breakouts and mean reversion opportunities',
    status: 'completed',
    progress: 100,
    created_at: '2024-02-05T08:30:00Z',
    updated_at: '2024-02-07T16:20:00Z',
    owner: 'rami',
    symbol: 'BTCUSDT',
    interval: '4h',
    date_range: {
      start: '2024-01-01',
      end: '2024-03-01'
    },
    splits: {
      train: 70,
      validation: 15,
      test: 15
    },
    metrics: {
      sharpe: 2.4,
      accuracy: 0.78,
      max_drawdown: 0.183,
      win_rate: 0.64
    }
  },
  {
    id: '3',
    name: 'Macro Trend Tracker',
    description: 'Tracks macroeconomic trends using on-chain data',
    status: 'failed',
    progress: 0,
    created_at: '2024-02-03T14:15:00Z',
    updated_at: '2024-02-03T14:30:00Z',
    owner: 'jules',
    symbol: 'BTCUSDT',
    interval: '15m',
    date_range: {
      start: '2024-01-01',
      end: '2024-03-01'
    },
    splits: {
      train: 70,
      validation: 15,
      test: 15
    },
    metrics: {
      sharpe: -0.3,
      accuracy: 0.48,
      max_drawdown: 0.32,
      win_rate: 0.45
    }
  },
  {
    id: '4',
    name: 'Carry Blend',
    description: 'Combines carry trade strategies across different markets',
    status: 'queued',
    progress: 0,
    created_at: '2024-02-09T00:00:00Z',
    updated_at: '2024-02-09T00:00:00Z',
    owner: 'alina',
    symbol: 'BTCUSDT',
    interval: '1h',
    date_range: {
      start: '2024-01-01',
      end: '2024-03-01'
    },
    splits: {
      train: 70,
      validation: 15,
      test: 15
    },
    metrics: {}
  },
  {
    id: '5',
    name: 'Mean Reversion',
    description: 'Mean reversion strategy based on RSI and Bollinger Bands',
    status: 'completed',
    progress: 100,
    created_at: '2024-02-01T09:45:00Z',
    updated_at: '2024-02-02T17:30:00Z',
    owner: 'rami',
    symbol: 'BTCUSDT',
    interval: '1h',
    date_range: {
      start: '2024-01-01',
      end: '2024-03-01'
    },
    splits: {
      train: 70,
      validation: 15,
      test: 15
    },
    metrics: {
      sharpe: 1.28,
      accuracy: 0.63,
      max_drawdown: 0.284,
      win_rate: 0.57
    }
  },
  {
    id: '6',
    name: 'Funding Regime Explorer',
    description: 'Evaluates funding-rate extremes against short-horizon momentum entries',
    status: 'completed',
    progress: 100,
    created_at: '2024-02-06T05:10:00Z',
    updated_at: '2024-02-08T20:40:00Z',
    owner: 'rami',
    symbol: 'ETHUSDT',
    interval: '1h',
    date_range: {
      start: '2023-11-01',
      end: '2024-03-01'
    },
    splits: {
      train: 65,
      validation: 20,
      test: 15
    },
    metrics: {
      sharpe: 2.11,
      accuracy: 0.74,
      max_drawdown: 0.162,
      win_rate: 0.66
    }
  },
  {
    id: '7',
    name: 'Regime Shift Multi-Asset',
    description: 'Blueprint stress test across BTC, ETH, and SOL during volatility clustering',
    status: 'running',
    progress: 37,
    created_at: '2024-02-10T01:00:00Z',
    updated_at: '2024-02-10T15:15:00Z',
    owner: 'nora',
    symbol: 'SOLUSDT',
    interval: '15m',
    date_range: {
      start: '2023-12-01',
      end: '2024-03-15'
    },
    splits: {
      train: 70,
      validation: 10,
      test: 20
    },
    metrics: {
      sharpe: 1.26,
      accuracy: 0.61,
      max_drawdown: 0.241,
      win_rate: 0.56
    }
  },
  {
    id: '8',
    name: 'Liquidity Sweep Validation',
    description: 'Validates reversal entries after wick-based liquidation sweeps',
    status: 'queued',
    progress: 0,
    created_at: '2024-02-11T03:20:00Z',
    updated_at: '2024-02-11T03:20:00Z',
    owner: 'jules',
    symbol: 'BTCUSDT',
    interval: '5m',
    date_range: {
      start: '2024-01-01',
      end: '2024-03-10'
    },
    splits: {
      train: 75,
      validation: 10,
      test: 15
    },
    metrics: {}
  },
  {
    id: '9',
    name: 'Session VWAP Rotation Bench',
    description: 'Benchmarks session-aware VWAP mean-reversion against baseline momentum systems',
    status: 'failed',
    progress: 0,
    created_at: '2024-02-04T02:40:00Z',
    updated_at: '2024-02-04T06:00:00Z',
    owner: 'nora',
    symbol: 'ETHUSDT',
    interval: '15m',
    date_range: {
      start: '2023-10-01',
      end: '2024-02-01'
    },
    splits: {
      train: 70,
      validation: 15,
      test: 15
    },
    metrics: {
      sharpe: -0.18,
      accuracy: 0.44,
      max_drawdown: 0.341,
      win_rate: 0.42
    }
  }
];