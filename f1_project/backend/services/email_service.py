import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_contact_email(data):
    sender_email = os.getenv("EMAIL_USER") 
    password = os.getenv("EMAIL_PASSWORD") 
    receiver_email = os.getenv("EMAIL_RECEIVER")

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["Subject"] = f"F1 Stats: Mensaje de {data.name}"
    

    message["Reply-To"] = data.email 

    body = f"""
    Has recibido un nuevo mensaje de contacto de "F1-STATS":
    ------------------------------------------
    Nombre: {data.name}
    Email del usuario: {data.email}
    Mensaje:
    {data.message}
    ------------------------------------------
    """
    message.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, password)
            server.send_message(message)
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False