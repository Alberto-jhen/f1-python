from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv
import os

import core.config  # Activate cache.
from api.router import router as api_router
from database.database import get_supabase


# Load env file.
load_dotenv();
frontend_url = os.getenv("FRONTEND_URL")

app = FastAPI(
    title="F1 Analytics API",
    description="Backend para visualización de datos de F1",
    version="1.0.0"
)

# CORS must be added before other middleware so headers are always present.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url or "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.on_event("startup")
async def startup_db_client():
    try:
        sb = get_supabase()
        print("✅ Conexión a Supabase exitosa")
    except Exception as e:
        print(f"❌ Error conectando a Supabase: {e}")

# Include the routes from endpoints.py
app.include_router(api_router)

@app.get("/")
async def root():
    return {
        "message": "F1 Insights API funcionando correctamente", 
        "status": "ok"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)