export interface MetaItem {
  id: string;
  name: string;
  description: string;
  type: string;
  category?: string;
  params?: Array<{ name: string; default: number }>;
}

export const mockIndicators: MetaItem[] = [
  { 
    id: '1', 
    name: 'SMA', 
    description: 'Simple Moving Average', 
    type: 'trend',
    category: 'Moving Averages',
    params: [
      { name: 'period', default: 20 }
    ]
  },
  { 
    id: '2', 
    name: 'EMA', 
    description: 'Exponential Moving Average', 
    type: 'trend',
    category: 'Moving Averages',
    params: [
      { name: 'period', default: 20 }
    ]
  },
  { 
    id: '3', 
    name: 'RSI', 
    description: 'Relative Strength Index', 
    type: 'momentum',
    category: 'Oscillators',
    params: [
      { name: 'period', default: 14 }
    ]
  },
  { 
    id: '4', 
    name: 'MACD', 
    description: 'Moving Average Convergence Divergence', 
    type: 'momentum',
    category: 'Oscillators',
    params: [
      { name: 'fast_length', default: 12 },
      { name: 'slow_length', default: 26 },
      { name: 'signal_length', default: 9 }
    ]
  },
  { 
    id: '5', 
    name: 'Bollinger Bands', 
    description: 'Bollinger Bands', 
    type: 'volatility',
    category: 'Volatility',
    params: [
      { name: 'period', default: 20 },
      { name: 'std_dev', default: 2 }
    ]
  },
  { 
    id: '6', 
    name: 'ATR', 
    description: 'Average True Range', 
    type: 'volatility',
    category: 'Volatility',
    params: [
      { name: 'period', default: 14 }
    ]
  },
  { 
    id: '7', 
    name: 'Stochastic', 
    description: 'Stochastic Oscillator', 
    type: 'momentum',
    category: 'Oscillators',
    params: [
      { name: 'k_period', default: 14 },
      { name: 'd_period', default: 3 }
    ]
  }
];

export const mockFeatures: MetaItem[] = [
  { id: '1', name: 'Price Changes', description: 'Price change features', type: 'price' },
  { id: '2', name: 'Volume Changes', description: 'Volume change features', type: 'volume' },
  { id: '3', name: 'Technical Indicators', description: 'Technical indicator features', type: 'technical' },
  { id: '4', name: 'On-chain Metrics', description: 'On-chain metric features', type: 'onchain' },
  { id: '5', name: 'Sentiment Analysis', description: 'Sentiment analysis features', type: 'sentiment' }
];

export const mockIntervals: MetaItem[] = [
  { id: '1', name: '1m', description: '1 minute interval', type: 'time' },
  { id: '2', name: '15m', description: '15 minutes interval', type: 'time' },
  { id: '3', name: '1h', description: '1 hour interval', type: 'time' },
  { id: '4', name: '4h', description: '4 hours interval', type: 'time' },
  { id: '5', name: '1D', description: '1 day interval', type: 'time' }
];

export const systemConfig = {
  maxExperimentConcurrency: 5,
  currentExperimentJobs: 3,
  maxExperimentPermutations: 100
};