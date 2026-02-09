from fastapi import FastAPI
import fastf1
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routes from endpoints.py
app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": "API de F1 funcionando correctamente. Ve a /docs para probarla."}

def debug_columns():
    year = 2025
    # Probamos con Australia que es el inicio de temporada
    session = fastf1.get_session(year, 'Australia', 'R')
    session.load(telemetry=False, weather=False, messages=False)
    
    # Imprimimos todas las columnas disponibles en los resultados
    print("--- COLUMNAS DISPONIBLES EN RESULTS ---")
    print(session.results.columns.tolist())
    
    # Imprimimos las primeras filas para ver el contenido real
    print("\n--- VISTA PREVIA DE DATOS (Primeros 3 pilotos) ---")
    print(session.results[['FullName', 'Abbreviation', 'TeamName']].head(3))
    
    # Verificamos específicamente por variaciones de nombre de país
    posibles_nombres = ['CountryCode', 'Nationality', 'Country', 'Nation']
    found = [col for col in session.results.columns if col in posibles_nombres]
    print(f"\nColumnas de país encontradas: {found}")

if __name__ == "__main__":
    import uvicorn
    debug_columns()
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)