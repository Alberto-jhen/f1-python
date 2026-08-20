import { useState } from 'react';
import { ParametersFilter } from '../components/ParametersFilter.jsx';
import { ScatterPlotLaps } from '../components/graphics/ScatterPlotLaps.jsx';
import { ViolinPlotLaps } from '../components/graphics/ViolinLapDistribution.jsx';
import { QualyOverview } from '@/components/graphics/QualyResultsoverview.jsx';
import { fetchDriverLaps, fetchDriverLapsImage, 
    fetchDriversLapsViolin, fetchDriversLapsViolinImage,
    fetchQualyOverviewData, fetchQualyOverviewImage} from '../service/apiService.js'
import { ImagePreview } from '../components/ImagePreview.jsx'

const GraphCard = ({ title, children, onSettingsClick, onGenerate, onExportPython, hasParams, loading }) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-red-600/40 transition-all duration-300 group shadow-lg relative">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h4 className="text-white font-bold uppercase text-xs tracking-widest">{title}</h4>
                <div className="flex gap-2">
                    {hasParams && (
                        <>
                            <button 
                                onClick={onExportPython}
                                disabled={loading}
                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer border border-transparent hover:border-blue-500/30"
                                title="Previsualizar Reporte Oficial (Python)"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </button>

                            <button 
                                onClick={onGenerate}
                                disabled={loading}
                                className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase rounded hover:bg-red-700 disabled:opacity-50 cursor-pointer transition-colors shadow-sm min-w-25"
                            >
                                {loading ? '...' : 'Generar gráfico'}
                            </button>
                        </>
                    )}
                    <button 
                        onClick={onSettingsClick}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m0-10a2 2 0 100-4m0 4a2 2 0 110-4m0 4V4" />
                        </svg>
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', params: [] });
    const [savedParams, setSavedParams] = useState({});
    const [tempParams, setTempParams] = useState({});
    
    const [graphsData, setGraphsData] = useState({}); 
    const [loading, setLoading] = useState(null);

    const openFilters = (graphName, paramsList) => {
        setModalConfig({ title: graphName, params: paramsList });
        setTempParams(savedParams[graphName] || {}); 
        setIsModalOpen(true);
    };

    const handleClosePreview = () => {
        setImageShown(false);
        if (pythonImage) URL.revokeObjectURL(pythonImage);
        setPythonImage(null);
    };

    const handleSaveConfig = () => {
        setSavedParams(prev => ({ ...prev, [modalConfig.title]: tempParams }));
        setIsModalOpen(false);
    };

    const generateGraph = async (fetchFn, graphName) => {
        const params = savedParams[graphName];
        if (!params) return;
        setLoading(graphName); 
        
        try {
            const { year, track, session, driver, num_drivers } = params;
            
            let data;
            if (graphName === 'Resultados de clasificación') {
                data = await fetchFn(year, track);
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

    const handleExportPython = async (fetchFn, graphName) => {
        const params = savedParams[graphName];
        if (!params) return;
        setLoading(graphName);
        
        try {
            const { year, track, session, driver, num_drivers } = params;
            
            let blob;
            if (graphName === 'Resultados de clasificación') {
                blob = await fetchFn(year, track);
            } else {
                blob = await fetchFn(year, track, session, driver || num_drivers);
            }
            
            const imageUrl = URL.createObjectURL(blob);
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
                <div className="mb-10">
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
                                onSettingsClick={() => openFilters('Análisis de ritmo (Individual)', ['year', 'track', 'session', 'driver'])}
                                onGenerate={() => generateGraph(fetchDriverLaps, 'Análisis de ritmo (Individual)')} 
                                onExportPython = {() => handleExportPython(fetchDriverLapsImage, 'Análisis de ritmo (Individual)')}
                                hasParams={!!savedParams['Análisis de ritmo (Individual)']}
                                loading={loading === 'Análisis de ritmo (Individual)'}
                            >
                                {graphsData['Análisis de ritmo (Individual)'] ? (
                                    <ScatterPlotLaps data={graphsData['Análisis de ritmo (Individual)']} driverId={savedParams['Análisis de ritmo (Individual)'].driver} />
                                ) : (
                                    <p className="text-slate-600 text-sm italic">
                                        {savedParams['Análisis de ritmo (Individual)'] 
                                            ? `Configuración lista para ${savedParams['Análisis de ritmo (Individual)'].driver}. Pulsa Generar.` 
                                            : "Configura los parámetros para empezar."}
                                    </p>
                                )}
                            </GraphCard>

                            <GraphCard
                                title="Distribución de tiempos por vuelta"
                                onSettingsClick={() => openFilters('Distribución de tiempos por vuelta', ['year', 'track', 'session', 'num_drivers'])}
                                onGenerate={() => generateGraph(fetchDriversLapsViolin, 'Distribución de tiempos por vuelta')}
                                onExportPython={() => handleExportPython(fetchDriversLapsViolinImage, 'Distribución de tiempos por vuelta')}
                                hasParams={!!savedParams['Distribución de tiempos por vuelta']}
                                loading={loading === 'Distribución de tiempos por vuelta'}
                            >
                                {graphsData['Distribución de tiempos por vuelta'] ? (
                                    <ViolinPlotLaps data={graphsData['Distribución de tiempos por vuelta']} />
                                ) : (
                                    <p className="text-slate-600 text-sm italic">
                                        {savedParams['Distribución de tiempos por vuelta'] 
                                            ? "Configuración lista. Pulsa Generar." 
                                            : "Configura los parámetros para empezar."}
                                    </p>
                                )}
                            </GraphCard>
                        </div>
                    )} {activeTab === 'resultsAnalysis' && (
                        <div className="grid grid-cols-1 gap-8">
                            <GraphCard 
                                title="Resultados de clasificación"
                                // Cambiado 'clasificiación' -> 'clasificación'
                                onSettingsClick={() => openFilters('Resultados de clasificación', ['year', 'track'])}
                                onGenerate={() => generateGraph(fetchQualyOverviewData, 'Resultados de clasificación')} 
                                onExportPython={() => handleExportPython(fetchQualyOverviewImage, 'Resultados de clasificación')}
                                hasParams={!!savedParams['Resultados de clasificación']}
                                loading={loading === 'Resultados de clasificación'}
                            >
                                {graphsData['Resultados de clasificación'] ? (
                                    <QualyOverview data={graphsData['Resultados de clasificación']} />
                                ) : (
                                    <p className="text-slate-600 text-sm italic">
                                        {savedParams['Resultados de clasificación'] 
                                            ? "Configuración lista. Pulsa Generar." 
                                            : "Configura los parámetros (Año y Circuito) para empezar."}
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
                fileName="f1_stats_report"
            />
        </div>
    );
};