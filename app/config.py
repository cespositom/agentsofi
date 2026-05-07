import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env for local development
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

# --- Retell AI ---
RETELL_API_KEY = os.environ.get("RETELL_API_KEY", "")
RETELL_OUTBOUND_AGENT_ID = os.environ.get("RETELL_OUTBOUND_AGENT_ID", "")

# --- Twilio ---
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER", "")

# --- Telnyx (segundo carrier opcional) ---
TELNYX_PHONE_NUMBER = os.environ.get("TELNYX_PHONE_NUMBER", "")

# --- Routing multi-carrier ---
# PRIMARY_CARRIER: "twilio" | "telnyx"   (cuál usa por default)
# FALLBACK_CARRIER: "twilio" | "telnyx" | ""  (vacío = sin failover)
PRIMARY_CARRIER = os.environ.get("PRIMARY_CARRIER", "twilio")
FALLBACK_CARRIER = os.environ.get("FALLBACK_CARRIER", "")

# --- Supabase (CRM self-hosted) ---
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

# --- Anthropic ---
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# --- Modal cost estimation ---
# Modal cobra por compute time, no per-call. Esta es una estimación atribuible
# por llamada (webhooks call_started/ended/analyzed + tool calls como
# search_properties). Calibrar mensualmente contra el billing real de Modal.
# Default $0.005 ≈ ~3-5 invocaciones cortas + idle time atribuido.
MODAL_COST_PER_CALL_USD = float(os.environ.get("MODAL_COST_PER_CALL_USD", "0.005"))
