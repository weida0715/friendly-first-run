export interface Model {
  id: string;
  name: string;
  description: string;
  experiment_id: string;
  owner: string;
  created_at: string;
  updated_at: string;
  metrics: {
    sharpe?: number;
    accuracy?: number;
    max_drawdown?: number;
    win_rate?: number;
    precision?: number;
    recall?: number;
    fpr?: number;
    auc?: number;
  };
  parameters: {
    sma_period?: number;
    rsi_period?: number;
    macd_fast?: number;
    macd_slow?: number;
    [key: string]: string | number | boolean | undefined;
  };
}

export const mockModels: Model[] = [
  {
    id: '1',
    name: 'Momentum Alpha',
    description: 'Momentum-based model with SMA and RSI',
    experiment_id: '1',
    owner: 'alina',
    created_at: '2024-02-08T10:00:00Z',
    updated_at: '2024-02-08T16:30:00Z',
    metrics: {
      sharpe: 2.41,
      accuracy: 0.72,
      max_drawdown: 0.125,
      win_rate: 0.68,
      precision: 0.78,
      recall: 0.82,
      fpr: 0.18,
      auc: 0.85
    },
    parameters: {
      sma_period: 20,
      rsi_period: 21,
      macd_fast: 12,
      macd_slow: 26
    }
  },
  {
    id: '2',
    name: 'Volatility Screen',
    description: 'Volatility-based model with Bollinger Bands',
    experiment_id: '2',
    owner: 'rami',
    created_at: '2024-02-05T08:30:00Z',
    updated_at: '2024-02-06T14:20:00Z',
    metrics: {
      sharpe: 1.89,
      accuracy: 0.69,
      max_drawdown: 0.183,
      win_rate: 0.64,
      precision: 0.74,
      recall: 0.78,
      fpr: 0.22,
      auc: 0.81
    },
    parameters: {
      sma_period: 50,
      rsi_period: 21,
      macd_fast: 15,
      macd_slow: 26
    }
  },
  {
    id: '3',
    name: 'Macro Trend Tracker',
    description: 'Trend tracker using on-chain data',
    experiment_id: '3',
    owner: 'jules',
    created_at: '2024-02-03T14:15:00Z',
    updated_at: '2024-02-03T14:30:00Z',
    metrics: {
      sharpe: 1.65,
      accuracy: 0.67,
      max_drawdown: 0.221,
      win_rate: 0.61,
      precision: 0.71,
      recall: 0.75,
      fpr: 0.25,
      auc: 0.79
    },
    parameters: {
      sma_period: 20,
      rsi_period: 21,
      macd_fast: 15,
      macd_slow: 26
    }
  },
  {
    id: '4',
    name: 'Carry Blend',
    description: 'Carry trade model with MACD and RSI',
    experiment_id: '4',
    owner: 'alina',
    created_at: '2024-02-09T00:00:00Z',
    updated_at: '2024-02-09T00:00:00Z',
    metrics: {
      sharpe: 1.42,
      accuracy: 0.65,
      max_drawdown: 0.258,
      win_rate: 0.59,
      precision: 0.68,
      recall: 0.72,
      fpr: 0.28,
      auc: 0.77
    },
    parameters: {
      sma_period: 50,
      rsi_period: 14,
      macd_fast: 12,
      macd_slow: 26
    }
  },
  {
    id: '5',
    name: 'Mean Reversion',
    description: 'Mean reversion strategy based on RSI',
    experiment_id: '5',
    owner: 'rami',
    created_at: '2024-02-01T09:45:00Z',
    updated_at: '2024-02-02T17:30:00Z',
    metrics: {
      sharpe: 1.28,
      accuracy: 0.63,
      max_drawdown: 0.284,
      win_rate: 0.57,
      precision: 0.66,
      recall: 0.70,
      fpr: 0.31,
      auc: 0.75
    },
    parameters: {
      sma_period: 20,
      rsi_period: 14,
      macd_fast: 12,
      macd_slow: 26
    }
  },
  {
    id: '6',
    name: 'Funding Divergence Alpha',
    description: 'Perpetual funding dislocation model with momentum confirmation filters',
    experiment_id: '6',
    owner: 'rami',
    created_at: '2024-02-08T21:00:00Z',
    updated_at: '2024-02-08T21:20:00Z',
    metrics: {
      sharpe: 2.18,
      accuracy: 0.75,
      max_drawdown: 0.158,
      win_rate: 0.67,
      precision: 0.79,
      recall: 0.8,
      fpr: 0.19,
      auc: 0.87
    },
    parameters: {
      funding_z_window: 96,
      momentum_period: 12,
      z_threshold: 1.2
    }
  },
  {
    id: '7',
    name: 'Regime Shift Ensemble',
    description: 'Regime-aware model that rotates between trend and mean-reversion states',
    experiment_id: '7',
    owner: 'nora',
    created_at: '2024-02-10T08:05:00Z',
    updated_at: '2024-02-10T15:10:00Z',
    metrics: {
      sharpe: 1.31,
      accuracy: 0.62,
      max_drawdown: 0.236,
      win_rate: 0.57,
      precision: 0.69,
      recall: 0.71,
      fpr: 0.27,
      auc: 0.78
    },
    parameters: {
      adx_period: 14,
      adx_threshold: 22,
      atr_period: 14,
      regime_window: 48
    }
  },
  {
    id: '8',
    name: 'Sweep Reversal Scout',
    description: 'Short-term reversal model for liquidation sweeps on lower timeframes',
    experiment_id: '8',
    owner: 'jules',
    created_at: '2024-02-11T03:45:00Z',
    updated_at: '2024-02-11T04:10:00Z',
    metrics: {
      sharpe: 0.94,
      accuracy: 0.58,
      max_drawdown: 0.292,
      win_rate: 0.53,
      precision: 0.62,
      recall: 0.65,
      fpr: 0.34,
      auc: 0.71
    },
    parameters: {
      wick_ratio: 1.8,
      volume_spike: 1.5,
      cooldown_bars: 8
    }
  }
];