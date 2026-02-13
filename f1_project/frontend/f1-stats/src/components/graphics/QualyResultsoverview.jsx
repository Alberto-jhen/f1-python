import React from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Cell, LabelList 
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
                <p className="text-white font-black italic">{data.Driver}</p> {/* Driver */}
                <p className="text-slate-400 text-xs uppercase tracking-widest">{data.Team}</p> {/* Team */}
                <p className="text-red-500 font-bold mt-1">
                    {data.IsPole ? "POLE POSITION" : `+${data.Delta.toFixed(3)}s`} {/* IsPole y Delta */}
                </p>
            </div>
        );
    }
    return null;
};

export const QualyOverview = ({ data }) => {
    if (!data || data.length === 0) return null;

    const chartData = [...data]; 

    return (
        <div className="w-full h-150 py-4"> 
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 70, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                    
                    <XAxis 
                        type="number" 
                        domain={[0, 'dataMax + 0.1']}
                        stroke="#64748b"
                        fontSize={10} // Valor numérico, no string
                        tickFormatter={(val) => `+${val}s`}
                    />
                    
                    <YAxis 
                        dataKey="Driver" 
                        type="category" 
                        stroke="#f8fafc"
                        fontSize={12} // Valor numérico
                        fontWeight={900} // Valor numérico para evitar advertencias
                        width={60}
                        />

                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />

                    <Bar dataKey="Delta" radius={[0, 4, 4, 0]} barSize={25}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.TeamColor} />
                        ))}
                        <LabelList 
                            dataKey="Delta" 
                            position="right" 
                            formatter={(val) => val === 0 ? "POLE" : `+${val.toFixed(3)}`}
                            fill="#94a3b8"
                            fontSize={11}
                            fontWeight="bold"
                            dx={10} // Desplazamiento a la derecha para que no se pegue a la barra
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};