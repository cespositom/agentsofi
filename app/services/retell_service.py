import os

from retell import Retell


# ─── Configuración multi-carrier ──────────────────────────────
# El sistema puede operar con Twilio, Telnyx, o ambos. El primary
# se usa por default; si el outbound falla, se reintenta con el
# fallback (si está configurado).
#
# Env vars:
#   PRIMARY_CARRIER:  "twilio" | "telnyx"  (default "twilio")
#   FALLBACK_CARRIER: "twilio" | "telnyx" | ""  (vacío = sin fallback)
#   TWILIO_PHONE_NUMBER, TELNYX_PHONE_NUMBER
# ─────────────────────────────────────────────────────────────

CARRIER_PHONE_ENV = {
    "twilio": "TWILIO_PHONE_NUMBER",
    "telnyx": "TELNYX_PHONE_NUMBER",
}


def get_client() -> Retell:
    return Retell(api_key=os.environ["RETELL_API_KEY"])


def _from_number(carrier: str) -> str | None:
    env_key = CARRIER_PHONE_ENV.get(carrier)
    if not env_key:
        return None
    return os.environ.get(env_key) or None


def _primary_carrier() -> str:
    return (os.environ.get("PRIMARY_CARRIER") or "twilio").strip().lower()


def _fallback_carrier() -> str | None:
    fb = (os.environ.get("FALLBACK_CARRIER") or "").strip().lower()
    return fb if fb in CARRIER_PHONE_ENV and fb != _primary_carrier() else None


def get_call(call_id: str) -> dict:
    """Obtiene los detalles de una llamada, incluyendo transcripción y costo."""
    client = get_client()
    call = client.call.retrieve(call_id)

    call_cost = getattr(call, "call_cost", None)
    combined_cents = 0
    cost_breakdown = None
    if call_cost is not None:
        combined_cents = getattr(call_cost, "combined_cost", 0) or 0
        product_costs = getattr(call_cost, "product_costs", None) or []
        try:
            cost_breakdown = [
                {
                    "product": getattr(pc, "product", ""),
                    "cost_cents": getattr(pc, "cost", 0) or 0,
                }
                for pc in product_costs
            ]
        except Exception:
            cost_breakdown = None

    return {
        "call_id": call.call_id,
        "status": call.call_status,
        "from_number": getattr(call, "from_number", ""),
        "to_number": getattr(call, "to_number", ""),
        "direction": getattr(call, "direction", ""),
        "duration_ms": getattr(call, "end_timestamp", 0) - getattr(call, "start_timestamp", 0),
        "transcript": getattr(call, "transcript", ""),
        "costo_usd": round(combined_cents / 100.0, 4),
        "costo_detalle": cost_breakdown,
        "disconnect_reason": getattr(call, "disconnection_reason", None),
    }


def create_phone_call(to_number: str, agent_id: str, carrier: str | None = None) -> dict:
    """Inicia una llamada saliente via Retell AI usando el carrier indicado
    (o el primary si no se pasa).
    """
    client = get_client()
    carrier = (carrier or _primary_carrier()).lower()
    from_number = _from_number(carrier)
    if not from_number:
        raise RuntimeError(f"No hay número configurado para carrier '{carrier}' "
                           f"(env {CARRIER_PHONE_ENV.get(carrier)} vacío)")
    call = client.call.create_phone_call(
        from_number=from_number,
        to_number=to_number,
        override_agent_id=agent_id,
    )
    return {"call_id": call.call_id, "status": call.call_status, "carrier": carrier}


def create_outbound_call(
    to_number: str,
    lead_name: str = "Cliente",
    zona_interes: str = "Santiago",
    tipo_buscado: str = "propiedad",
    presupuesto: str = "no especificado",
    notas: str = "ninguno",
) -> dict:
    """Outbound con failover entre carriers.
    Intenta primero PRIMARY_CARRIER; si Retell rechaza, retry con FALLBACK_CARRIER.
    """
    client = get_client()
    agent_id = os.environ["RETELL_OUTBOUND_AGENT_ID"]
    dynamic_vars = {
        "lead_name": lead_name,
        "zona_interes": zona_interes,
        "tipo_buscado": tipo_buscado,
        "presupuesto": presupuesto,
        "notas": notas,
    }

    carriers_to_try = [_primary_carrier()]
    fb = _fallback_carrier()
    if fb:
        carriers_to_try.append(fb)

    last_error: Exception | None = None
    for carrier in carriers_to_try:
        from_number = _from_number(carrier)
        if not from_number:
            print(f"[Retell] carrier '{carrier}' sin número configurado, saltando")
            continue
        try:
            call = client.call.create_phone_call(
                from_number=from_number,
                to_number=to_number,
                override_agent_id=agent_id,
                retell_llm_dynamic_variables=dynamic_vars,
            )
            print(f"[Retell] outbound OK via {carrier}: call_id={call.call_id}")
            return {
                "call_id": call.call_id,
                "status": call.call_status,
                "carrier": carrier,
            }
        except Exception as e:
            last_error = e
            print(f"[Retell] outbound FAIL via {carrier}: {e}")
            continue

    raise last_error or RuntimeError("Sin carriers disponibles para outbound")
