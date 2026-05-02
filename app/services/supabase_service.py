"""Cliente Supabase para CRM (propiedades, leads, llamadas, visitas).

Reemplaza al antiguo notion_service. Usa service_role para bypass de RLS
desde el backend. La webapp usa anon key + login para respetar RLS.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any
from zoneinfo import ZoneInfo

CHILE_TZ = ZoneInfo("America/Santiago")

from supabase import create_client, Client


_client: Client | None = None


def _sb() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_KEY"]
        _client = create_client(url, key)
    return _client


# ─── Propiedades ───────────────────────────────────────────────

def search_properties(
    zona: str | None = None,
    presupuesto_max: float | None = None,
    recamaras_min: int | None = None,
    tipo: str | None = None,
    operacion: str | None = None,
) -> list[dict]:
    q = _sb().table("propiedades").select("*").eq("disponible", True)
    if zona:
        q = q.eq("comuna", zona)
    if tipo:
        q = q.eq("tipo", tipo)
    if operacion:
        q = q.eq("operacion", operacion)
    if presupuesto_max is not None:
        q = q.lte("precio", presupuesto_max)
    if recamaras_min is not None:
        q = q.gte("dormitorios", recamaras_min)
    res = q.limit(10).execute()
    return [_map_property(p) for p in (res.data or [])]


def _map_property(p: dict) -> dict:
    return {
        "id": p["id"],
        "nombre": p.get("nombre", ""),
        "tipo": p.get("tipo", ""),
        "operacion": p.get("operacion", ""),
        "precio": p.get("precio", 0),
        "zona": p.get("comuna", ""),
        "recamaras": p.get("dormitorios"),
        "banos": p.get("banos"),
        "m2": p.get("m2"),
        "amenidades": p.get("amenidades") or [],
        "direccion": p.get("direccion", ""),
    }


# ─── Leads ─────────────────────────────────────────────────────

def create_lead(
    name: str,
    phone: str,
    email: str = "",
    presupuesto: float | None = None,
    zona_interes: list[str] | None = None,
    tipo_buscado: list[str] | None = None,
    operacion_buscada: str | None = None,
    fuente: str = "Llamada entrante",
    notas: str = "",
) -> dict:
    payload: dict[str, Any] = {
        "nombre": name,
        "telefono": phone,
        "estatus": "En proceso",
        "temperatura": "Warm",
        "fuente": fuente,
        "intentos": 1,
    }
    if email:
        payload["email"] = email
    if presupuesto is not None:
        payload["presupuesto"] = presupuesto
    if zona_interes:
        payload["comunas_interes"] = zona_interes
    if tipo_buscado:
        payload["tipos_buscados"] = tipo_buscado
    if operacion_buscada:
        payload["operacion_buscada"] = operacion_buscada
    if notas:
        payload["notas"] = notas

    # Upsert por teléfono para no duplicar leads
    res = (
        _sb()
        .table("leads")
        .upsert(payload, on_conflict="telefono")
        .execute()
    )
    row = res.data[0] if res.data else {}
    return {"id": row.get("id"), "nombre": name}


def get_pending_leads() -> list[dict]:
    res = (
        _sb()
        .table("leads")
        .select("*")
        .eq("estatus", "Pendiente de llamar")
        .limit(20)
        .execute()
    )
    return [
        {
            "id": l["id"],
            "nombre": l.get("nombre", ""),
            "telefono": l.get("telefono", ""),
            "email": l.get("email", ""),
            "zona_interes": l.get("comunas_interes") or [],
            "tipo_buscado": l.get("tipos_buscados") or [],
            "presupuesto": l.get("presupuesto"),
            "notas": l.get("notas", ""),
            "intentos": l.get("intentos") or 0,
        }
        for l in (res.data or [])
    ]


def find_lead_by_phone(phone: str) -> dict | None:
    res = (
        _sb()
        .table("leads")
        .select("id, nombre, telefono, estatus, temperatura")
        .eq("telefono", phone)
        .limit(1)
        .execute()
    )
    if not res.data:
        return None
    l = res.data[0]
    return {
        "id": l["id"],
        "nombre": l.get("nombre", ""),
        "telefono": l.get("telefono", ""),
        "estatus": l.get("estatus", ""),
        "temperatura": l.get("temperatura", ""),
    }


def update_lead(
    page_id: str,
    estatus: str | None = None,
    temperatura: str | None = None,
    siguiente_accion: str | None = None,
    resumen_ia: str | None = None,
    intentos: int | None = None,
) -> dict:
    payload: dict[str, Any] = {}
    if estatus:
        payload["estatus"] = estatus
    if temperatura:
        payload["temperatura"] = temperatura
    if siguiente_accion is not None:
        payload["siguiente_accion"] = siguiente_accion
    if resumen_ia is not None:
        payload["resumen_ia"] = resumen_ia[:4000]
    if intentos is not None:
        payload["intentos"] = intentos

    if not payload:
        return {"id": page_id, "updated_fields": []}

    _sb().table("leads").update(payload).eq("id", page_id).execute()
    return {"id": page_id, "updated_fields": list(payload.keys())}


# ─── Llamadas ──────────────────────────────────────────────────

# Tarifas estimadas (USD/min) por carrier y destino.
# Edítalas si tu tarifario real difiere.
CARRIER_RATES = {
    "twilio": {"cl_mobile": 0.20, "cl_fixed": 0.05, "default": 0.20},
    "telnyx": {"cl_mobile": 0.08, "cl_fixed": 0.03, "default": 0.10},
}


def _rate_per_min(carrier: str, to_number: str) -> float:
    rates = CARRIER_RATES.get((carrier or "").lower(), CARRIER_RATES["twilio"])
    if to_number.startswith("+569"):
        return rates["cl_mobile"]
    if to_number.startswith("+56"):
        return rates["cl_fixed"]
    return rates["default"]


def create_call_record(
    titulo: str,
    tipo: str,
    resultado: str,
    telefono: str,
    nombre_lead: str = "",
    duracion_seg: int = 0,
    resumen: str = "",
    transcripcion: str = "",
    sentimiento: str = "Neutral",
    cita_agendada: bool = False,
    retell_call_id: str = "",
    costo_usd: float = 0,
    costo_detalle: list | None = None,
    carrier: str | None = None,
) -> dict:
    lead = find_lead_by_phone(telefono) if telefono else None

    carrier_norm = (carrier or "twilio").lower()
    rate = _rate_per_min(carrier_norm, telefono)
    costo_telefonia = round((duracion_seg / 60.0) * rate, 4) if duracion_seg else 0

    payload: dict[str, Any] = {
        "titulo": titulo,
        "tipo": tipo,
        "resultado": resultado,
        "telefono": telefono,
        "nombre_lead": nombre_lead,
        "duracion_seg": duracion_seg,
        "sentimiento": sentimiento,
        "cita_agendada": cita_agendada,
        "costo_retell_usd": costo_usd,
        "carrier": carrier_norm,
        # Mantenemos el nombre histórico costo_twilio_usd para no romper UI;
        # ahora representa "costo del carrier que efectivamente se usó".
        "costo_twilio_usd": costo_telefonia,
    }
    if resumen:
        payload["resumen"] = resumen[:4000]
    if transcripcion:
        payload["transcripcion"] = transcripcion
    if retell_call_id:
        payload["retell_call_id"] = retell_call_id
    if lead:
        payload["lead_id"] = lead["id"]
    if costo_detalle:
        payload["costo_detalle"] = costo_detalle

    res = _sb().table("llamadas").upsert(payload, on_conflict="retell_call_id").execute()
    row = res.data[0] if res.data else {}
    return {"id": row.get("id"), "titulo": titulo}


# ─── Visitas (reemplaza Cal.com) ───────────────────────────────

def book_visit(
    phone: str,
    name: str,
    preferred_date: str,
    preferred_time: str,
    propiedad_id: str | None = None,
    notas: str = "",
) -> dict:
    """Crea una visita en Supabase. Fecha en TZ America/Santiago (DST automático)."""
    naive = datetime.fromisoformat(f"{preferred_date}T{preferred_time}:00")
    fecha_hora = naive.replace(tzinfo=CHILE_TZ).isoformat()

    lead = find_lead_by_phone(phone) if phone else None
    payload: dict[str, Any] = {
        "fecha_hora": fecha_hora,
        "estado": "Solicitada",
        "notas": notas or f"Agendada por Sofía para {name}",
    }
    if lead:
        payload["lead_id"] = lead["id"]
    if propiedad_id:
        payload["propiedad_id"] = propiedad_id

    res = _sb().table("visitas").insert(payload).execute()
    visita = res.data[0] if res.data else {}

    if lead:
        update_lead(
            page_id=lead["id"],
            estatus="Cita agendada",
            siguiente_accion=f"Visita: {preferred_date} {preferred_time}",
        )

    return {
        "id": visita.get("id"),
        "fecha_hora": fecha_hora,
        "estado": "Solicitada",
    }


def get_available_slots(date_iso: str) -> list[str]:
    """Slots de 1h entre 09:00 y 19:00, descartando los ocupados."""
    start = datetime.fromisoformat(f"{date_iso}T00:00:00").replace(tzinfo=CHILE_TZ).isoformat()
    end = datetime.fromisoformat(f"{date_iso}T23:59:59").replace(tzinfo=CHILE_TZ).isoformat()

    res = (
        _sb()
        .table("visitas")
        .select("fecha_hora")
        .gte("fecha_hora", start)
        .lte("fecha_hora", end)
        .in_("estado", ["Solicitada", "Confirmada"])
        .execute()
    )
    ocupados = set()
    for v in res.data or []:
        try:
            dt = datetime.fromisoformat(v["fecha_hora"].replace("Z", "+00:00")).astimezone(CHILE_TZ)
            ocupados.add(dt.strftime("%H:%M"))
        except Exception:
            continue

    slots = []
    for h in range(9, 19):
        slot = f"{h:02d}:00"
        if slot not in ocupados:
            slots.append(slot)
    return slots
