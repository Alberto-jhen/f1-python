import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
# Use the service role key so the backend can read/write all tables regardless
# of Row Level Security (RLS) policies. This is acceptable for a trusted backend
# process; the key must never be exposed to the frontend.
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Optional[Client] = None
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)


def get_supabase() -> Optional[Client]:
    return supabase
