// src/components/Graphics/ScatterLaps.jsx
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { formatLapTime } from '../../service/apiService';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

const COMPOUND_COLORS = {
    SOFT: '#ef4444',  
    MEDIUM: '#facc15', 
    HARD: '#f8fafc', 
    INTERMEDIATE: '#22c55e',
    WET: '#3b82f6',
    UNKNOWN: '#475569'
};

export const ScatterPlotLaps = ({ data, driverId }) => {
    if (!data || data.length === 0) return null;

    const chartData = {
        datasets: [{
            label: `Vueltas de ${driverId}`,
            data: data.map(lap => ({
                x: lap.LapNumber,         
                y: lap.LapTimeSeconds     
            })),
            pointBackgroundColor: data.map(lap => 
                COMPOUND_COLORS[lap.Compound?.toUpperCase()] || '#475569'
            ),
            pointRadius: 5,
            pointHoverRadius: 8,
            borderWidth: 0
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                ticks: {
                    color: '#94a3b8',
                    font: { family: 'monospace', size: 11 },
                    callback: (value) => formatLapTime(value)
                },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            x: {
                title: { display: true, text: 'VUELTA', color: '#64748b', font: { weight: 'bold' } },
                ticks: { color: '#94a3b8' },
                grid: { display: false }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                callbacks: {
                    label: (ctx) => {
                        const lap = data[ctx.dataIndex];
                        return ` Lap ${ctx.raw.x}: ${formatLapTime(ctx.raw.y)} (${lap.Compound})`;
                    }
                }
            }
        }
    };

    return (
        <div className="w-full h-full min-h-100">
            <Scatter data={chartData} options={options} />
        </div>
    );
};