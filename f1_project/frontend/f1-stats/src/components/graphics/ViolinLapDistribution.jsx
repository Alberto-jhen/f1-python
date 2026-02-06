import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { ViolinController, Violin } from '@sgratzl/chartjs-chart-boxplot';
import { formatLapTime } from '../../service/apiService';

ChartJS.register(CategoryScale, LinearScale, ViolinController, Violin, Tooltip);

export const ViolinPlotLaps = ({ data }) => {
    if (!data || !Array.isArray(data)) return null;

    // 1. Agrupación y ordenación por posición oficial de carrera
    const grouped = data.reduce((acc, lap) => {
        if (!acc[lap.Driver]) {
            acc[lap.Driver] = { 
                laps: [], 
                color: lap.TeamColor || '#475569', 
                order: lap.OfficialOrder 
            };
        }
        acc[lap.Driver].laps.push(lap);
        return acc;
    }, {});

    const sortedDrivers = Object.keys(grouped).sort((a, b) => grouped[a].order - grouped[b].order);

    const chartData = {
        labels: sortedDrivers,
        datasets: [{
            label: 'Distribución de Tiempos',
            data: sortedDrivers.map(d => grouped[d].laps.map(l => l.LapTimeSeconds)),
            backgroundColor: sortedDrivers.map(d => `${grouped[d].color}66`),
            borderColor: sortedDrivers.map(d => grouped[d].color),
            borderWidth: 2,
            outlierRadius: 0,
            itemRadius: 3,
            itemStyle: 'circle',
            // CAMBIO: Blanco grisáceo para reducir el contraste excesivo
            itemBackgroundColor: '#E5E7EB', 
            itemBorderColor: '#E5E7EB',
            itemBorderWidth: 0,
            jitter: 0.5,
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                reverse: true,
                beginAtZero: false,
                ticks: {
                    color: '#94a3b8',
                    font: { family: 'monospace', size: 10 },
                    callback: (value) => formatLapTime(value) //
                },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            x: {
                ticks: { color: '#f8fafc', font: { weight: 'bold', size: 11 }, padding: 15 },
                grid: { display: false }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                callbacks: {
                    label: (ctx) => {
                        const driver = sortedDrivers[ctx.index];
                        const lap = grouped[driver].laps[ctx.dataIndex];
                        return ` Lap ${lap.LapNumber}: ${formatLapTime(ctx.raw)} (${lap.Compound})`;
                    }
                }
            }
        }
    };

    return (
        <div className="flex flex-col h-full w-full">
            {/* NOTA RESTAURADA AL ESTILO ÁMBAR ANTERIOR */}
            <div className="mx-4 mb-4 p-3 bg-amber-900/20 border border-amber-800/40 rounded-lg flex items-center gap-3">
                <div className="text-amber-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <p className="text-[11px] text-amber-200/70 font-medium leading-tight">
                    <span className="text-amber-400 font-bold uppercase mr-1">Nota:</span> 
                    Para ver el detalle de neumáticos por vuelta con precisión, se recomienda descargar la versión exportada (PNG) del gráfico.
                </p>
            </div>

            <div style={{ flex: 1, minHeight: '500px', position: 'relative' }}>
                <Chart type="violin" data={chartData} options={options} />
            </div>
        </div>
    );
};