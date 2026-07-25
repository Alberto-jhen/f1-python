import React, { useEffect, useRef, useMemo } from 'react';

// Canvas resolution for crisp rendering when scaled by CSS.
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 140;
const PADDING = { top: 18, right: 16, bottom: 20, left: 44 };

// Fixed sliding window in seconds. Keeps the chart scale constant so that
// features like throttle dips or brake spikes remain visible regardless of
// how much telemetry has been loaded in the background buffer.
const WINDOW_SIZE = 15;

const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const drawChart = (canvas, data, metric, currentTime, windowStart, windowEnd) => {
    const ctx = canvas.getContext('2d');
    const { top, right, bottom, left } = PADDING;
    const chartWidth = CANVAS_WIDTH - left - right;
    const chartHeight = CANVAS_HEIGHT - top - bottom;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (data.length === 0 || windowStart >= windowEnd) return;

    const minTime = data[0].timestamp;
    const timeRange = Math.max(windowEnd - windowStart, 0.001);

    // Use the fixed metric range so the Y-axis scale stays constant across
    // frames and buffer transitions. This makes throttle dips, brake spikes
    // and gear shifts visually comparable at any point of the replay.
    const minValue = metric.min;
    const maxValue = metric.max;
    const valueRange = Math.max(maxValue - minValue, 0.001);

    const getX = (timestamp) => left + ((timestamp - windowStart) / timeRange) * chartWidth;
    const getY = (value) => top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

    // Horizontal grid lines.
    const gridCount = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridCount; i++) {
        const y = top + (chartHeight * i) / gridCount;
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(CANVAS_WIDTH - right, y);
        ctx.stroke();
    }

    // Draw only the telemetry points that fall inside the sliding window.
    const windowData = data.filter((d) => d.timestamp >= windowStart && d.timestamp <= windowEnd);

    // Main telemetry line.
    ctx.beginPath();
    ctx.strokeStyle = metric.color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    windowData.forEach((point, index) => {
        const x = getX(point.timestamp);
        const y = getY(point[metric.key] ?? 0);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Subtle fill under the line.
    if (windowData.length > 0) {
        ctx.lineTo(getX(windowData[windowData.length - 1].timestamp), top + chartHeight);
        ctx.lineTo(getX(windowData[0].timestamp), top + chartHeight);
        ctx.closePath();
        ctx.fillStyle = hexToRgba(metric.color, 0.08);
        ctx.fill();
    }

    // Y-axis labels.
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= gridCount; i++) {
        const value = maxValue - (valueRange * i) / gridCount;
        const y = top + (chartHeight * i) / gridCount;
        ctx.fillText(Math.round(value).toString(), left - 8, y);
    }
    ctx.textAlign = 'left';

    // Current time indicator at the right edge of the sliding window.
    const currentX = getX(windowEnd);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(currentX, top);
    ctx.lineTo(currentX, top + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current value is interpolated from the full dataset so it is accurate
    // even when the replay head is waiting for the next background chunk.
    let currentValue = null;
    for (let i = 0; i < data.length - 1; i++) {
        if (data[i].timestamp <= currentTime && data[i + 1].timestamp > currentTime) {
            const t = (currentTime - data[i].timestamp) / (data[i + 1].timestamp - data[i].timestamp);
            const v1 = data[i][metric.key] ?? 0;
            const v2 = data[i + 1][metric.key] ?? 0;
            currentValue = v1 + t * (v2 - v1);
            break;
        }
    }
    if (currentValue === null) {
        currentValue = currentTime <= minTime ? data[0][metric.key] ?? 0 : data[data.length - 1][metric.key] ?? 0;
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`${metric.label}: ${Math.round(currentValue)}${metric.unit || ''}`, left + 8, top + 14);
};

export const TelemetryChart = ({ data, metric, currentTime, windowStart, windowEnd }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || data.length === 0) return;
        drawChart(canvas, data, metric, currentTime, windowStart, windowEnd);
    }, [data, metric, currentTime, windowStart, windowEnd]);

    return (
        <div className="w-full rounded-lg overflow-hidden border border-zinc-800 bg-[#09090b] shadow-lg">
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full h-auto object-contain"
            />
        </div>
    );
};

export const TelemetryCharts = ({ telemetryData, driver, currentTime }) => {
    // Memoize the driver's dataset so filter/sort only runs when the raw
    // telemetry array changes (i.e. after a new background chunk is loaded),
    // not on every animation frame.
    const driverData = useMemo(
        () => telemetryData.filter((d) => d.driver === driver).sort((a, b) => a.timestamp - b.timestamp),
        [telemetryData, driver]
    );

    const maxGear = useMemo(
        () => Math.max(8, ...driverData.map((d) => d.n_gear || 0)),
        [driverData]
    );

    // Memoize the sliding window so it is only recomputed when the data or
    // replay head changes. This keeps the chart scale constant during play.
    const window = useMemo(() => {
        if (driverData.length === 0) return null;
        const maxTime = driverData[driverData.length - 1].timestamp;
        const end = Math.min(maxTime, currentTime);
        const start = Math.max(driverData[0].timestamp, end - WINDOW_SIZE);
        return { start, end };
    }, [driverData, currentTime]);

    const metrics = useMemo(
        () => [
            { key: 'throttle', label: 'Throttle', color: '#22c55e', min: 0, max: 100, unit: '%' },
            { key: 'brake', label: 'Brake', color: '#ef4444', min: 0, max: 1, unit: '' },
            { key: 'n_gear', label: 'Gear', color: '#f59e0b', min: 0, max: maxGear, unit: '' },
        ],
        [maxGear]
    );

    if (!window) return null;

    return (
        <div className="w-full flex flex-col gap-4 mt-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Live Telemetry — {driver}
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                    T+ {window.start.toFixed(1)}s — {window.end.toFixed(1)}s
                </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
                {metrics.map((metric) => (
                    <TelemetryChart
                        key={metric.key}
                        data={driverData}
                        metric={metric}
                        currentTime={currentTime}
                        windowStart={window.start}
                        windowEnd={window.end}
                    />
                ))}
            </div>
        </div>
    );
};
