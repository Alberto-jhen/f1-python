from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import services.f1_service as f1_service 
from pydantic import BaseModel, EmailStr
import io
import fastf1
import services.email_service as email_service
from matplotlib import pyplot as plt
import services.f1_drivers_service as f1_drivers_service

router = APIRouter()

# Define the data model for sending emails.
class EmailData(BaseModel):
    name: str
    email: str
    message: str

@router.get("/plot/violin", tags=["graphics"], operation_id="violin_graphic")
async def get_violin(
    year: int = Query(..., examples=2023),
    track: str = Query(..., examples="Monaco"),
    session: str = Query(..., examples="R"),
    num_drivers: int = Query(5, gt=0, le=20)
):
    try:
        image_buf = f1_service.get_violin_plot_image(year, track, session, num_drivers)
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
        image_buf = f1_service.get_scatter_plot_image(year, track, session, driver)
        if not image_buf:
            raise HTTPException(status_code=404, detail="Piloto o sesión no encontrados.")
        return StreamingResponse(image_buf, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/plot/qualy_overview", tags=["graphics"], operation_id="qualifyng_result_overview")
async def get_scatter(
    year: int = Query(..., examples=2025),
    track: str = Query(..., examples="Japan"),
):
    try:
        image_buf = f1_service.get_qualifying_results_overview(year, track)
        if not image_buf:
            raise HTTPException(status_code=404, detail="Clasificación no encontrada.")
        return StreamingResponse(image_buf, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# DATA LOGIC -- Returns data in JSON type for the frontend to draw the graphic --

@router.get("/data/laps/{year}/{track}/{session}/{driver}", tags=["JSON_data"])
async def laps_json(year: int, track: str, session: str, driver: str):
    data = f1_service.get_driver_laps_json(year, track, session, driver)
    if "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
    return data

@router.get("/data/laps/distribution/{year}/{track}/{session}/{num_drivers}", tags=["JSON_data"])
async def lap_distributions(year: int, track: str, session: str, num_drivers: int):
    data = f1_service.get_violin_data_json(year, track, session, num_drivers)
    if "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
    return data

@router.post("/contact", tags=["utility"])
async def contact_form(form_data: EmailData):
    # Call the email sending service, passing the data collected from the form in the frontend.
    success = email_service.send_contact_email(form_data)
    
    if not success:
        raise HTTPException(status_code=500, detail="Error al enviar el correo")
    
    return {"message": "Email enviado con éxito"}

# Driver related API requests.
@router.get("/driver/profile/{driver_num}", tags=["JSON_data"])
async def get_driver_profile(driver_num: int):
    data = f1_drivers_service.get_driver_profile(driver_num)
    if "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
    return data


# Year events JSON data.
@router.get("/data/schedule/{year}", tags=["JSON_data", "Schedule"])
async def get_year_schedule(year: int):
    schedule = fastf1.get_event_schedule(year)
    tracks = schedule['EventName'].unique().tolist()
    return {
        "tracks": tracks,
        "sessions": ['R', 'Q', 'Q1', 'Q2', 'Q3', 'FP1', 'FP2', 'FP3']
    }

# Drivers in a season JSON data.
@router.get("/data/drivers/{year}/{event_name}/{session_type}", tags=["JSON_data", "Drivers"])
async def get_drivers_full_name_by_year(year: int, event_name: str, session_type: str):
    data = f1_drivers_service.get_season_driver_full_names(year, event_name, session_type)
    if "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
    return data