from fastapi import APIRouter, HTTPException
from core.models import EmailData
from core.schemas import MessageResponse
import services.email_service as email_service

router = APIRouter()


@router.post("/contact", tags=["Contact"], response_model=MessageResponse)
async def contact_form(form_data: EmailData):
    success = email_service.send_contact_email(form_data)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")
    
    return {"message": "Email sent successfully"}
