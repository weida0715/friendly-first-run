"use client";

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export type PlotlyChartType = 'line' | 'scatter' | 'bar' | 'area' | 'histogram' | 'box' | 'heatmap';

type PlotlySeries = {
  name: string;
  x: Array<string | number>;
  y: Array<number | null>;
  type?: PlotlyChartType;
  mode?: 'lines' | 'markers' | 'lines+markers';
  fill?: 'tozeroy' | 'tonexty' | 'none';
};

type PlotlyChartProps = {
  title?: string;
  series: PlotlySeries[];
  height?: number;
  showLegend?: boolean;
  hideModeBar?: boolean;
};

const mapTraceType = (type: PlotlyChartType | undefined) => {
  switch (type) {
    case 'bar':
      return { type: 'bar' };
    case 'histogram':
      return { type: 'histogram' };
    case 'box':
      return { type: 'box' };
    case 'heatmap':
      return { type: 'heatmap' };
    case 'area':
      return { type: 'scatter', mode: 'lines', fill: 'tozeroy' };
    case 'scatter':
      return { type: 'scatter', mode: 'markers' };
    case 'line':
    default:
      return { type: 'scatter', mode: 'lines' };
  }
};

export default function PlotlyChart({
  title,
  series,
  height = 360,
  showLegend = true,
  hideModeBar = true,
}: PlotlyChartProps) {
  const { mode } = useTheme();
  const [Plot, setPlot] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import('react-plotly.js').then((mod) => setPlot(mod.default));
  }, []);

  if (!Plot) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-muted-foreground">
        Loading chart...
      </div>
    );
  }

  const textColor = mode === 'dark' ? '#e2e8f0' : '#0f172a';
  const gridColor = mode === 'dark' ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.4)';
  const backgroundColor = mode === 'dark' ? 'rgba(2,6,23,0.6)' : 'rgba(255,255,255,0.8)';
  const data = series.map((item) => {
    const defaults = mapTraceType(item.type);
    return {
      name: item.name,
      x: item.x,
      y: item.y,
      type: defaults.type,
      mode: item.mode ?? defaults.mode,
      fill: item.fill ?? defaults.fill,
    };
  });

  return (
    <Plot
      data={data}
      layout={{
        title: title ? { text: title, font: { color: textColor } } : undefined,
        paper_bgcolor: backgroundColor,
        plot_bgcolor: backgroundColor,
        font: { color: textColor },
        xaxis: { gridcolor: gridColor, zerolinecolor: gridColor },
        yaxis: { gridcolor: gridColor, zerolinecolor: gridColor },
        height,
        margin: { t: title ? 50 : 30, r: 20, l: 40, b: 40 },
        showlegend: showLegend,
      }}
      config={{ displayModeBar: !hideModeBar, responsive: true }}
      style={{ width: '100%' }}
      useResizeHandler
    />
  );
}