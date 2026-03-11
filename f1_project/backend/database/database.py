import os
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi

load_dotenv()

ca = certifi.where()

client = MongoClient(
    os.getenv("MONGO_URI"),
    tls=True,
    tlsCAFile=ca,
    tlsAllowInvalidCertificates=True,
    serverSelectionTimeoutMS=5000
)

db = client['f1_insights']


def get_db():
    return db
