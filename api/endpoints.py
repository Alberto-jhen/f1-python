from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import services.f1_service as f1_service 
import io
from matplotlib import pyplot as plt

router = APIRouter()

@router.get("/plot/violin", tags=["Gráficos"])
async def get_violin(
    year: int = Query(..., example=2023),
    track: str = Query(..., example="Monaco"),
    session: str = Query(..., example="R"),
    num_drivers: int = Query(5, gt=0, le=20)
):
    """Genera el gráfico de distribución de tiempos (Violin)"""
    try:
        image_buf = f1_service.get_violin_plot_image(year, track, session, num_drivers)
        if not image_buf:
            raise HTTPException(status_code=404, detail="No se encontraron datos.")
        return StreamingResponse(image_buf, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plot/scatter", tags=["Gráficos"])
async def get_scatter(
    year: int = Query(..., example=2023),
    track: str = Query(..., example="Monza"),
    session: str = Query(..., example="R"),
    driver: str = Query(..., example="VER")
):
    """Genera el scatterplot de vueltas de un piloto"""
    try:
        image_buf = f1_service.get_scatter_plot_image(year, track, session, driver)
        if not image_buf:
            raise HTTPException(status_code=404, detail="Piloto o sesión no encontrados.")
        return StreamingResponse(image_buf, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))