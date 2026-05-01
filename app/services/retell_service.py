import os

from retell import Retell


def get_client() -> Retell:
    return Retell(api_key=os.environ["RETELL_API_KEY"])


def get_call(call_id: str) -> dict:
    """Obtiene los detalles de una llamada, incluyendo transcripción y costo."""
    client = get_client()
    call = client.call.retrieve(call_id)

    # Costo en centavos USD según la doc de Retell. Convertir a USD.
    call_cost = getattr(call, "call_cost", None)
    combined_cents = 0
    cost_breakdown = None
    if call_cost is not None:
        combined_cents = getattr(call_cost, "combined_cost", 0) or 0
        # product_costs es lista de {product, unit_price, cost}
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


def create_phone_call(to_number: str, agent_id: str) -> dict:
    """Inicia una llamada saliente via Retell AI."""
    client = get_client()
    call = client.call.create_phone_call(
        from_number=os.environ["TWILIO_PHONE_NUMBER"],
        to_number=to_number,
        override_agent_id=agent_id,
    )
    return {"call_id": call.call_id, "status": call.call_status}


def create_outbound_call(
    to_number: str,
    lead_name: str = "Cliente",
    zona_interes: str = "Santiago",
    tipo_buscado: str = "propiedad",
    presupuesto: str = "no especificado",
    notas: str = "ninguno",
) -> dict:
    """Inicia llamada outbound con variables dinámicas para personalizar."""
    client = get_client()
    agent_id = os.environ["RETELL_OUTBOUND_AGENT_ID"]

    call = client.call.create_phone_call(
        from_number=os.environ["TWILIO_PHONE_NUMBER"],
        to_number=to_number,
        override_agent_id=agent_id,
        retell_llm_dynamic_variables={
            "lead_name": lead_name,
            "zona_interes": zona_interes,
            "tipo_buscado": tipo_buscado,
            "presupuesto": presupuesto,
            "notas": notas,
        },
    )
    return {"call_id": call.call_id, "status": call.call_status}
