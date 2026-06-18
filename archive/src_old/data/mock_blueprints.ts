export interface Blueprint {
  id: string;
  name: string;
  description: string;
  status: 'published' | 'pending' | 'rejected';
  owner: string;
  created_at: string;
  updated_at: string;
  parameters: {
    [key: string]: string | number | boolean;
  };
  code: string;
}

export const mockBlueprints: Blueprint[] = [
  {
    id: '1',
    name: 'Momentum Strategy',
    description: 'A momentum-based strategy using SMA and RSI',
    status: 'published',
    owner: 'alex',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T16:30:00Z',
    parameters: {
      sma_period: 20,
      rsi_period: 21,
      macd_fast: 12,
      macd_slow: 26
    },
    code: `import numpy as np

class MomentumStrategy:
    def __init__(self, sma_period=20, rsi_period=21, macd_fast=12, macd_slow=26):
        self.sma_period = sma_period
        self.rsi_period = rsi_period
        self.macd_fast = macd_fast
        self.macd_slow = macd_slow
        
    def predict(self, data):
        # Calculate indicators
        sma = data['close'].rolling(window=self.sma_period).mean()
        rsi = self.calculate_rsi(data['close'], self.rsi_period)
        macd, signal = self.calculate_macd(data['close'], self.macd_fast, self.macd_slow)
        
        # Generate signals
        signals = np.where((data['close'] > sma) & (rsi > 50) & (macd > signal), 1, 
                          np.where((data['close'] < sma) & (rsi < 50) & (macd < signal), -1, 0))
        
        return signals
`
  },
  {
    id: '2',
    name: 'Volatility Breakout',
    description: 'Volatility breakout strategy using Bollinger Bands',
    status: 'published',
    owner: 'alex',
    created_at: '2024-02-02T09:30:00Z',
    updated_at: '2024-02-02T15:45:00Z',
    parameters: {
      bollinger_period: 20,
      volatility_multiplier: 2.0
    },
    code: `import numpy as np

class VolatilityBreakout:
    def __init__(self, bollinger_period=20, volatility_multiplier=2.0):
        self.bollinger_period = bollinger_period
        self.volatility_multiplier = volatility_multiplier
        
    def predict(self, data):
        # Calculate Bollinger Bands
        sma = data['close'].rolling(window=self.bollinger_period).mean()
        std = data['close'].rolling(window=self.bollinger_period).std()
        upper_band = sma + self.volatility_multiplier * std
        lower_band = sma - self.volatility_multiplier * std
        
        # Generate signals
        signals = np.where(data['close'] > upper_band, 1, 
                          np.where(data['close'] < lower_band, -1, 0))
        
        return signals
`
  },
  {
    id: '3',
    name: 'Mean Reversion',
    description: 'Mean reversion strategy based on RSI and Bollinger Bands',
    status: 'pending',
    owner: 'alex',
    created_at: '2024-02-08T08:00:00Z',
    updated_at: '2024-02-08T08:00:00Z',
    parameters: {
      sma_period: 20,
      rsi_period: 14
    },
    code: `import numpy as np

class MeanReversion:
    def __init__(self, sma_period=20, rsi_period=14):
        self.sma_period = sma_period
        self.rsi_period = rsi_period
        
    def predict(self, data):
        # Calculate indicators
        sma = data['close'].rolling(window=self.sma_period).mean()
        rsi = self.calculate_rsi(data['close'], self.rsi_period)
        
        # Generate signals
        signals = np.where((data['close'] < sma) & (rsi < 30), 1, 
                          np.where((data['close'] > sma) & (rsi > 70), -1, 0))
        
        return signals
`
  },
  {
    id: '4',
    name: 'Regime Shift Detector',
    description: 'Switches between trend-following and mean-reversion based on ADX and volatility regimes',
    status: 'published',
    owner: 'nora',
    created_at: '2024-02-04T11:20:00Z',
    updated_at: '2024-02-06T09:10:00Z',
    parameters: {
      adx_period: 14,
      adx_threshold: 22,
      atr_period: 14,
      regime_window: 48
    },
    code: `import numpy as np

class RegimeShiftDetector:
    def __init__(self, adx_period=14, adx_threshold=22, atr_period=14, regime_window=48):
        self.adx_period = adx_period
        self.adx_threshold = adx_threshold
        self.atr_period = atr_period
        self.regime_window = regime_window

    def predict(self, data):
        adx = self.calculate_adx(data, self.adx_period)
        atr = self.calculate_atr(data, self.atr_period)
        atr_ma = atr.rolling(window=self.regime_window).mean()

        trend_regime = (adx > self.adx_threshold) & (atr > atr_ma)
        signal = np.where(trend_regime, np.sign(data['close'].diff()), -np.sign(data['close'].diff()))
        return np.nan_to_num(signal)
`
  },
  {
    id: '5',
    name: 'Funding Divergence',
    description: 'Captures perpetual funding dislocations with momentum confirmation',
    status: 'published',
    owner: 'rami',
    created_at: '2024-02-05T07:10:00Z',
    updated_at: '2024-02-06T17:25:00Z',
    parameters: {
      funding_z_window: 96,
      momentum_period: 12,
      z_threshold: 1.2
    },
    code: `import numpy as np

class FundingDivergence:
    def __init__(self, funding_z_window=96, momentum_period=12, z_threshold=1.2):
        self.funding_z_window = funding_z_window
        self.momentum_period = momentum_period
        self.z_threshold = z_threshold

    def predict(self, data):
        funding = data['funding_rate']
        z = (funding - funding.rolling(self.funding_z_window).mean()) / funding.rolling(self.funding_z_window).std()
        mom = data['close'].pct_change(self.momentum_period)
        return np.where((z < -self.z_threshold) & (mom > 0), 1, np.where((z > self.z_threshold) & (mom < 0), -1, 0))
`
  },
  {
    id: '6',
    name: 'Liquidity Sweep Reversal',
    description: 'Detects wick-based stop runs and enters reversal with volume confirmation',
    status: 'pending',
    owner: 'jules',
    created_at: '2024-02-10T04:45:00Z',
    updated_at: '2024-02-10T04:45:00Z',
    parameters: {
      wick_ratio: 1.8,
      volume_spike: 1.5,
      cooldown_bars: 8
    },
    code: `import numpy as np

class LiquiditySweepReversal:
    def __init__(self, wick_ratio=1.8, volume_spike=1.5, cooldown_bars=8):
        self.wick_ratio = wick_ratio
        self.volume_spike = volume_spike
        self.cooldown_bars = cooldown_bars

    def predict(self, data):
        body = np.abs(data['close'] - data['open'])
        upper_wick = data['high'] - np.maximum(data['open'], data['close'])
        lower_wick = np.minimum(data['open'], data['close']) - data['low']
        vol_ok = data['volume'] > data['volume'].rolling(20).mean() * self.volume_spike
        long_sig = (lower_wick > body * self.wick_ratio) & vol_ok
        short_sig = (upper_wick > body * self.wick_ratio) & vol_ok
        return np.where(long_sig, 1, np.where(short_sig, -1, 0))
`
  },
  {
    id: '7',
    name: 'VWAP Session Rotation',
    description: 'Session-aware VWAP rotation blueprint for intraday mean reversion windows',
    status: 'rejected',
    owner: 'nora',
    created_at: '2024-02-07T02:30:00Z',
    updated_at: '2024-02-08T12:10:00Z',
    parameters: {
      vwap_deviation: 1.1,
      session_length_hours: 8,
      stop_atr_multiple: 1.4
    },
    code: `import numpy as np

class VwapSessionRotation:
    def __init__(self, vwap_deviation=1.1, session_length_hours=8, stop_atr_multiple=1.4):
        self.vwap_deviation = vwap_deviation
        self.session_length_hours = session_length_hours
        self.stop_atr_multiple = stop_atr_multiple

    def predict(self, data):
        vwap = (data['close'] * data['volume']).cumsum() / data['volume'].cumsum()
        dist = (data['close'] - vwap) / vwap
        return np.where(dist < -0.01 * self.vwap_deviation, 1, np.where(dist > 0.01 * self.vwap_deviation, -1, 0))
`
  }
];