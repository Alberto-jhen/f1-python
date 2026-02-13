import { fetchQualyOverviewData } from "./apiService";

export const generateQualyOverviewGraph = async (graphName, savedParams, setLoading) => {
        const params = savedParams[graphName];
        if (!params) return;
        setLoading(graphName); 
        
        try {
            const { year, track} = params;
            const data = await fetchQualyOverviewData(year, track);
            setGraphsData(prev => ({ ...prev, [graphName]: data })); 
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(null);
        }
    };