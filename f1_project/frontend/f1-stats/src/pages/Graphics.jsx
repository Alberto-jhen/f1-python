import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { ParametersFilter } from '../components/ParametersFilter.jsx';
import { ScatterPlotLaps } from '../components/graphics/ScatterPlotLaps.jsx';
import { ViolinPlotLaps } from '../components/graphics/ViolinLapDistribution.jsx';
import { QualyOverview } from '@/components/graphics/QualyResultsoverview.jsx';
import { fetchDriverLaps, fetchDriverLapsImage, 
    fetchDriversLapsViolin, fetchDriversLapsViolinImage,
    fetchQualyOverviewData, fetchQualyOverviewImage,
    fetchSeasonHeatmapData, fetchSeasonHeatmapImage } from '../service/apiService.js'
import { ImagePreview } from '../components/ImagePreview.jsx'
import { SeasonPointsHeatmap } from '../components/graphics/SeasonPointsHeatmap.jsx';

const GraphCard = ({ title, children, onSettingsClick, onExportPython, hasParams, isSettingsOpen, loading }) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-red-600/40 transition-all duration-300 group shadow-lg relative">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h4 className="text-white font-bold uppercase text-xs tracking-widest">{title}</h4>
                <div className="flex gap-2">
                    {hasParams && (
                        <button
                            type="button"
                            onClick={onExportPython}
                            disabled={loading}
                            aria-label={`Previsualizar reporte Python de ${title}`}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer border border-transparent hover:border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Previsualizar reporte oficial en Python"
                        >
                            <svg className="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onSettingsClick}
                        aria-label={`Configurar parámetros de ${title}`}
                        aria-haspopup="dialog"
                        aria-expanded={isSettingsOpen}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200 transition-colors hover:border-slate-400 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 cursor-pointer"
                    >
                        <SlidersHorizontal className="size-4" aria-hidden="true" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Configurar</span>
                    </button>
                </div>
            </div>
            <div className="p-6 flex items-center justify-center min-h-100 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-slate-800/20 to-transparent">
                {children}
            </div>
        </div>
    );
};

export const GraphicsDashboard = () => {
    const categories = [
        { id: 'lapTimes', label: 'Tiempos de vuelta' },
        { id: 'resultsAnalysis', label: 'Análisis de resultados'}
    ];

    const [activeTab, setActiveTab] = useState('lapTimes');
    const [pythonImage, setPythonImage] = useState(null)
    const [imageShown, setImageShown] = useState(false);
    const [previewTitle, setPreviewTitle] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', params: [], fetchFn: null });
    const [savedParams, setSavedParams] = useState({});
    const [tempParams, setTempParams] = useState({});
    
    const [graphsData, setGraphsData] = useState({}); 
    const [loading, setLoading] = useState(null);

    const openFilters = (graphName, paramsList, fetchFn) => {
        setModalConfig({ title: graphName, params: paramsList, fetchFn });
        setTempParams(savedParams[graphName] || {}); 
        setIsModalOpen(true);
    };

    const handleClosePreview = () => {
        setImageShown(false);
        if (pythonImage) URL.revokeObjectURL(pythonImage);
        setPythonImage(null);
        setPreviewTitle('');
    };

    const generateGraph = async (fetchFn, graphName, paramsOverride) => {
        const params = paramsOverride || savedParams[graphName];
        if (!fetchFn || !params) return;
        setLoading(graphName); 
        setGraphsData(prev => ({ ...prev, [graphName]: null }));
        
        try {
            const { year, track, session, driver, num_drivers } = params;
            
            let data;
            if (graphName === 'Resultados de clasificación') {
                data = await fetchFn(year, track);
            } else if (graphName === 'Mapa de calor de puntos') {
                data = await fetchFn(year);
            } else {
                data = await fetchFn(year, track, session, driver || num_drivers);
            }
            
            setGraphsData(prev => ({ ...prev, [graphName]: data })); 
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(null);
        }
    };

    const handleSaveConfig = async () => {
        const { title, params: requiredParams, fetchFn } = modalConfig;
        const params = { ...tempParams };
        const hasRequiredParams = requiredParams.every((param) => {
            const value = params[param];
            if (param === 'num_drivers') return Number.isInteger(value) && value >= 1 && value <= 20;
            return value !== undefined && value !== null && value !== '';
        });

        if (!hasRequiredParams) return;

        setSavedParams(prev => ({ ...prev, [title]: params }));
        setIsModalOpen(false);
        await generateGraph(fetchFn, title, params);
    };

    const getGraphPlaceholder = (graphName, initialMessage) => {
        if (loading === graphName) return 'Generando gráfico…';
        if (savedParams[graphName]) return 'Abre «Configurar» y confirma los parámetros para volver a generar este gráfico.';
        return initialMessage;
    };

    const handleExportPython = async (fetchFn, graphName) => {
        const params = savedParams[graphName];
        if (!params) return;
        setLoading(graphName);
        
        try {
            const { year, track, session, driver, num_drivers } = params;
            
            let blob;
            if (graphName === 'Resultados de clasificación') {
                blob = await fetchFn(year, track);
            } else if (graphName === 'Mapa de calor de puntos') {
                blob = await fetchFn(year);
            } else {
                blob = await fetchFn(year, track, session, driver || num_drivers);
            }
            
            if (pythonImage) URL.revokeObjectURL(pythonImage);
            const imageUrl = URL.createObjectURL(blob);
            setPreviewTitle(graphName);
            setPythonImage(imageUrl);
            setImageShown(true);
        } catch (error) {
            alert("Error al generar imagen: " + error.message);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-12 relative">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto relative">
                <div className="mb-10 border-l-4 border-red-600 pl-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-red-600 text-[10px] font-bold uppercase tracking-[0.3em]">Telemetría en vivo</span>
                    </div>
                    <h2 className="text-white text-4xl font-black italic uppercase tracking-tighter">
                        Análisis de <span className="text-red-600">Datos</span>
                    </h2>
                    <p className="text-slate-500 text-sm mt-2 max-w-lg">
                        Genera gráficos interactivos o exporta reportes oficiales en Python con datos reales de FastF1.
                    </p>
                </div>

                <div className="flex border-b border-slate-800 mb-10 gap-8">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`pb-4 cursor-pointer text-sm font-bold uppercase tracking-widest transition-all relative ${
                                activeTab === cat.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {cat.label}
                            {activeTab === cat.id && (
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="animate-fadeIn">
                    {activeTab === 'lapTimes' && (
                        <div className="grid grid-cols-1 gap-8">
                            <GraphCard 
                                title="Análisis de ritmo (Individual)"
                                onSettingsClick={() => openFilters('Análisis de ritmo (Individual)', ['year', 'track', 'session', 'driver'], fetchDriverLaps)}
                                onExportPython = {() => handleExportPython(fetchDriverLapsImage, 'Análisis de ritmo (Individual)')}
                                hasParams={!!savedParams['Análisis de ritmo (Individual)']}
                                isSettingsOpen={isModalOpen && modalConfig.title === 'Análisis de ritmo (Individual)'}
                                loading={loading === 'Análisis de ritmo (Individual)'}
                            >
                                {graphsData['Análisis de ritmo (Individual)'] ? (
                                    <ScatterPlotLaps data={graphsData['Análisis de ritmo (Individual)']} driverId={savedParams['Análisis de ritmo (Individual)'].driver} />
                                ) : (
                                    <p className="text-slate-600 text-sm italic text-center" aria-live="polite">
                                        {getGraphPlaceholder('Análisis de ritmo (Individual)', 'Para empezar, pulsa «Configurar» en la cabecera de esta tarjeta.')}
                                    </p>
                                )}
                            </GraphCard>

                            <GraphCard
                                title="Distribución de tiempos por vuelta"
                                onSettingsClick={() => openFilters('Distribución de tiempos por vuelta', ['year', 'track', 'session', 'num_drivers'], fetchDriversLapsViolin)}
                                onExportPython={() => handleExportPython(fetchDriversLapsViolinImage, 'Distribución de tiempos por vuelta')}
                                hasParams={!!savedParams['Distribución de tiempos por vuelta']}
                                isSettingsOpen={isModalOpen && modalConfig.title === 'Distribución de tiempos por vuelta'}
                                loading={loading === 'Distribución de tiempos por vuelta'}
                            >
                                {graphsData['Distribución de tiempos por vuelta'] ? (
                                    <ViolinPlotLaps data={graphsData['Distribución de tiempos por vuelta']} />
                                ) : (
                                    <p className="text-slate-600 text-sm italic text-center" aria-live="polite">
                                        {getGraphPlaceholder('Distribución de tiempos por vuelta', 'Para empezar, pulsa «Configurar» en la cabecera de esta tarjeta.')}
                                    </p>
                                )}
                            </GraphCard>
                        </div>
                    )} {activeTab === 'resultsAnalysis' && (
                        <div className="grid grid-cols-1 gap-8">
                            <GraphCard 
                                title="Resultados de clasificación"
                                onSettingsClick={() => openFilters('Resultados de clasificación', ['year', 'track'], fetchQualyOverviewData)}
                                onExportPython={() => handleExportPython(fetchQualyOverviewImage, 'Resultados de clasificación')}
                                hasParams={!!savedParams['Resultados de clasificación']}
                                isSettingsOpen={isModalOpen && modalConfig.title === 'Resultados de clasificación'}
                                loading={loading === 'Resultados de clasificación'}
                            >
                                {graphsData['Resultados de clasificación'] ? (
                                    <QualyOverview data={graphsData['Resultados de clasificación']} />
                                ) : (
                                    <p className="text-slate-600 text-sm italic text-center" aria-live="polite">
                                        {getGraphPlaceholder('Resultados de clasificación', 'Para empezar, pulsa «Configurar» en la cabecera de esta tarjeta.')}
                                    </p>
                                )}
                            </GraphCard>
                            <GraphCard
                                title="Mapa de calor de puntos"
                                onSettingsClick={() => openFilters('Mapa de calor de puntos', ['year'], fetchSeasonHeatmapData)}
                                onExportPython={() => handleExportPython(fetchSeasonHeatmapImage, 'Mapa de calor de puntos')}
                                hasParams={!!savedParams['Mapa de calor de puntos']}
                                isSettingsOpen={isModalOpen && modalConfig.title === 'Mapa de calor de puntos'}
                                loading={loading === 'Mapa de calor de puntos'}
                            >
                                {graphsData['Mapa de calor de puntos'] ? (
                                    <SeasonPointsHeatmap data={graphsData['Mapa de calor de puntos']} />
                                ) : (
                                    <p className="text-slate-600 text-sm italic text-center" aria-live="polite">
                                        {getGraphPlaceholder('Mapa de calor de puntos', 'Para empezar, pulsa «Configurar» en la cabecera de esta tarjeta.')}
                                    </p>
                                )}
                            </GraphCard>

                        </div>
                    )}


                </div>
            </div>

            <ParametersFilter 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                config={modalConfig}
                tempParams={tempParams}
                onInputChange={(name, val) => setTempParams(prev => ({ ...prev, [name]: val }))}
                onSave={handleSaveConfig}
            />

            <ImagePreview 
                isOpen={imageShown}
                onClose={handleClosePreview}
                imageSrc={pythonImage}
                fileName={`f1_stats_report_${previewTitle}`}
                title={previewTitle}
            />
        </div>
    );
};