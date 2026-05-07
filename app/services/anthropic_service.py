import json
import os

import anthropic


# Pricing por modelo (USD por 1M tokens). Mantener actualizado si cambia.
# Source: https://www.anthropic.com/pricing
MODEL_PRICING = {
    "claude-sonnet-4-5": {"in": 3.00, "out": 15.00},
    "claude-sonnet-4-6": {"in": 3.00, "out": 15.00},
    "claude-haiku-4-5": {"in": 1.00, "out": 5.00},
    "claude-haiku-4-5-20251001": {"in": 1.00, "out": 5.00},
    "claude-opus-4-7": {"in": 15.00, "out": 75.00},
}

ANALYSIS_MODEL = "claude-sonnet-4-5"


def get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


def _compute_cost_usd(model: str, input_tokens: int, output_tokens: int) -> float:
    """Calcula USD a partir de usage. Retorna 0 si modelo no tiene precio definido."""
    rates = MODEL_PRICING.get(model)
    if not rates:
        return 0.0
    return round(
        (input_tokens / 1_000_000) * rates["in"]
        + (output_tokens / 1_000_000) * rates["out"],
        6,
    )


def analyze_call(transcript: str) -> dict:
    """Analiza la transcripción y retorna resumen estructurado con lead scoring.

    Returns:
        {
            "resumen": str,
            "nombre_cliente": str,
            "temperatura": "Hot" | "Warm" | "Cold",
            "sentimiento": "Positivo" | "Neutral" | "Negativo",
            "propiedad_interes": str,
            "presupuesto": float | None,
            "zonas_interes": list[str],
            "siguiente_accion": str,
            "cita_agendada": bool,
            "_cost_usd": float,
            "_input_tokens": int,
            "_output_tokens": int,
        }
    """
    client = get_client()
    message = client.messages.create(
        model=ANALYSIS_MODEL,
        max_tokens=1500,
        messages=[
            {
                "role": "user",
                "content": f"""Eres un analista CRM de una inmobiliaria en Santiago de Chile. Analiza esta transcripción de llamada entre nuestra agente de voz "Sofía" y un cliente.

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin backticks) con esta estructura exacta:

{{
  "resumen": "Resumen de 2-3 oraciones de la llamada",
  "nombre_cliente": "Nombre del cliente si se mencionó, o vacío",
  "temperatura": "Hot si quiere agendar/comprar ya, Warm si muestra interés activo, Cold si solo pregunta sin compromiso",
  "sentimiento": "Positivo, Neutral o Negativo",
  "propiedad_interes": "Descripción breve de lo que busca",
  "presupuesto": null o número sin formato,
  "zonas_interes": ["zona1", "zona2"],
  "siguiente_accion": "Qué hacer después con este lead",
  "cita_agendada": true o false
}}

Transcripción:
{transcript}""",
            }
        ],
    )

    in_tokens = getattr(message.usage, "input_tokens", 0) or 0
    out_tokens = getattr(message.usage, "output_tokens", 0) or 0
    cost = _compute_cost_usd(ANALYSIS_MODEL, in_tokens, out_tokens)

    raw = message.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {
            "resumen": raw[:500],
            "nombre_cliente": "",
            "temperatura": "Warm",
            "sentimiento": "Neutral",
            "propiedad_interes": "",
            "presupuesto": None,
            "zonas_interes": [],
            "siguiente_accion": "Revisar transcripción manualmente",
            "cita_agendada": False,
        }

    result["_cost_usd"] = cost
    result["_input_tokens"] = in_tokens
    result["_output_tokens"] = out_tokens
    return result
