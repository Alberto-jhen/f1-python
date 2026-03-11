from fastapi import APIRouter, HTTPException
from core.models import EmailData
import services.email_service as email_service

router = APIRouter()


@router.post("/contact", tags=["utility"])
async def contact_form(form_data: EmailData):
    success = email_service.send_contact_email(form_data)
    
    if not success:
        raise HTTPException(status_code=500, detail="Error al enviar el correo")
    
    return {"message": "Email enviado con éxito"}
