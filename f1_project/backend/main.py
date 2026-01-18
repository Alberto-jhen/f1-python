from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import router as api_router
from dotenv import load_dotenv
import os
import core.config # Activate cache.

# Load env file.
load_dotenv();
frontend_url = os.getenv("FRONTEND_URL")

app = FastAPI(
    title="F1 Analytics API",
    description="Backend para visualización de datos de F1",
    version="1.0.0"
)

# Middleware to allor frontend conections.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routes from endpoints.py
app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": "API de F1 funcionando correctamente. Ve a /docs para probarla."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)