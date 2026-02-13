import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

def test_connection():
    try:
        client = MongoClient(os.getenv("MONGO_URI"))
        client.admin.command('ping')
        print("Conexión exitosa a MongoDB Atlas")
        
        # Create the db.
        db = client['f1_insights']
        print(f"Base de datos preparada: {db.name}")
        
    except Exception as e:
        print(f"Error de conexión: {e}")

if __name__ == "__main__":
    test_connection()