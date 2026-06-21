import { render, screen } from '@testing-library/react';

import { BTCUSDTPriceChart } from '@/components/charts/BTCUSDTPriceChart';

const setDataMock = jest.fn();
const updateMock = jest.fn();
const fitContentMock = jest.fn();
const scrollToRealTimeMock = jest.fn();
const applyOptionsMock = jest.fn();
const removeMock = jest.fn();
const subscribeCrosshairMoveMock = jest.fn();
const subscribeVisibleLogicalRangeChangeMock = jest.fn();

class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

jest.mock('lightweight-charts', () => ({
  CandlestickSeries: 'CandlestickSeries',
  ColorType: { Solid: 'solid' },
  createChart: jest.fn(() => ({
    addSeries: jest.fn(() => ({ setData: setDataMock, update: updateMock, setMarkers: jest.fn() })),
    timeScale: jest.fn(() => ({
      fitContent: fitContentMock,
      scrollToRealTime: scrollToRealTimeMock,
      subscribeVisibleLogicalRangeChange: subscribeVisibleLogicalRangeChangeMock,
    })),
    subscribeCrosshairMove: subscribeCrosshairMoveMock,
    applyOptions: applyOptionsMock,
    remove: removeMock,
  })),
}), { virtual: true });

describe('BTCUSDTPriceChart', () => {
  beforeEach(() => {
    setDataMock.mockClear();
    updateMock.mockClear();
    fitContentMock.mockClear();
    scrollToRealTimeMock.mockClear();
    applyOptionsMock.mockClear();
    removeMock.mockClear();
    subscribeCrosshairMoveMock.mockClear();
    subscribeVisibleLogicalRangeChangeMock.mockClear();
  });

  it('renders loading state', () => {
    render(<BTCUSDTPriceChart loading />);
    expect(screen.getByText('Loading BTCUSDT price data...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<BTCUSDTPriceChart error="chart failed" />);
    expect(screen.getByText('chart failed')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<BTCUSDTPriceChart data={[]} />);
    expect(screen.getByText('No BTCUSDT candles')).toBeInTheDocument();
  });

  it('renders chart and pushes candlestick data on success', () => {
    render(
      <BTCUSDTPriceChart
        data={[
          { time: 1767225600, open: '50000.1', high: '50100.0', low: '49900.0', close: '50050.2' },
        ]}
      />,
    );

    expect(screen.getByTestId('btcusdt-price-chart')).toBeInTheDocument();
    expect(setDataMock).toHaveBeenCalledWith([
      {
        time: 1767225600,
        open: 50000.1,
        high: 50100,
        low: 49900,
        close: 50050.2,
      },
    ]);
    expect(fitContentMock).toHaveBeenCalled();
  });

  it('updates the latest bar incrementally and scrolls right', () => {
    const { rerender } = render(
      <BTCUSDTPriceChart
        data={[
          { time: 1767225600, open: '50000.1', high: '50100.0', low: '49900.0', close: '50050.2' },
        ]}
      />,
    );

    rerender(
      <BTCUSDTPriceChart
        data={[
          { time: 1767225600, open: '50000.1', high: '50100.0', low: '49900.0', close: '50050.2' },
          { time: 1767225660, open: '50050.2', high: '50120.0', low: '50020.0', close: '50100.0' },
        ]}
      />,
    );

    expect(updateMock).toHaveBeenCalledWith({
      time: 1767225660,
      open: 50050.2,
      high: 50120,
      low: 50020,
      close: 50100,
    });
    expect(scrollToRealTimeMock).toHaveBeenCalled();
  });

  it('cleans up chart on unmount', () => {
    const { unmount } = render(
      <BTCUSDTPriceChart
        data={[
          { time: 1767225600, open: 50000, high: 50100, low: 49900, close: 50050 },
        ]}
      />,
    );

    unmount();
    expect(removeMock).toHaveBeenCalled();
  });
});
