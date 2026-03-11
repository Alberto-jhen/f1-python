from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import services.plotting_service as plotting_service

router = APIRouter()


@router.get("/plot/violin", tags=["graphics"], operation_id="violin_graphic")
async def get_violin(
    year: int = Query(..., examples=2023),
    track: str = Query(..., examples="Monaco"),
    session: str = Query(..., examples="R"),
    num_drivers: int = Query(5, gt=0, le=20)
):
    try:
        image_buf = plotting_service.get_violin_plot_image(year, track, session, num_drivers)
        if not image_buf:
            raise HTTPException(status_code=404, detail="No se encontraron datos.")
        return StreamingResponse(image_buf, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/plot/scatter", tags=["graphics"], operation_id="scatterplot_graphic")
async def get_scatter(
    year: int = Query(..., examples=2023),
    track: str = Query(..., examples="Monza"),
    session: str = Query(..., examples="R"),
    driver: str = Query(..., examples="VER")
):
    try:
        image_buf = plotting_service.get_scatter_plot_image(year, track, session, driver)
        if not image_buf:
            raise HTTPException(status_code=404, detail="Piloto o sesión no encontrados.")
        return StreamingResponse(image_buf, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/plot/qualy_overview", tags=["graphics"], operation_id="qualifying_result_overview")
async def get_qualy_overview(
    year: int = Query(..., examples=2025),
    track: str = Query(..., examples="Japan"),
):
    try:
        image_buf = plotting_service.get_qualifying_results_overview(year, track)
        if not image_buf:
            raise HTTPException(status_code=404, detail="Clasificación no encontrada.")
        return StreamingResponse(image_buf, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
