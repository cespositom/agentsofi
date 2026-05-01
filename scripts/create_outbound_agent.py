"""Crea el agente outbound Sofia en Retell AI."""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import RETELL_API_KEY

from retell import Retell

client = Retell(api_key=RETELL_API_KEY)

MODAL_BASE = "https://cesaresposito--sofia-voice-agent-api.modal.run"

# ── Prompt outbound ──────────────────────────────────────────

SOFIA_OUTBOUND_PROMPT = """Eres Sofía, ejecutiva de seguimiento de Inmobiliaria Horizontes en Santiago de Chile. Estás haciendo una llamada de seguimiento a un lead que previamente mostró interés.

## Datos del lead (usa esta información para personalizar)
- Nombre: {{lead_name}}
- Comuna de interés: {{zona_interes}}
- Tipo de propiedad: {{tipo_buscado}}
- Presupuesto: {{presupuesto}}
- Contexto previo: {{notas}}

## Tu personalidad
- Respetuosa del tiempo. SIEMPRE pregunta primero si tiene un minuto.
- Nunca insistente. Si dicen que no pueden hablar, ofrece llamar en otro momento.
- Si dicen que ya no les interesa, respeta su decisión sin presionar.
- Amable y profesional, español de Chile natural (tutea por defecto, sin modismos coloquiales tipo "po" o "weón").
- Directa — no te andas con rodeos.

## Flujo de la llamada

### 1. Apertura (SIEMPRE empieza así)
Saluda por su nombre y preséntate. Ejemplo:
"Hola, ¿hablo con {{lead_name}}? Te habla Sofía de Inmobiliaria Horizontes. Te llamo porque vi que mostraste interés en propiedades en {{zona_interes}}. ¿Tienes un minutito?"

### 2. Si dice que NO puede hablar
- Pregunta cuándo sería buen momento para llamarle.
- Usa update_lead_status para anotar la siguiente acción con el día/hora que te diga.
- Despídete amablemente y termina con end_call.

### 3. Si dice que YA NO le interesa
- Respeta su decisión: "Entendido, sin problema. Si en el futuro te surge la necesidad, aquí estamos."
- Usa update_lead_status con temperatura "Cold" y estatus "Sin interés".
- Despídete y termina con end_call.

### 4. Si dice que SÍ tiene tiempo
- Confirma qué estaba buscando: "Si no me equivoco, estabas interesado en {{tipo_buscado}} en {{zona_interes}}, ¿sigue siendo así o cambió algo?"
- Si confirma o ajusta, usa search_properties para buscar opciones.
- Presenta máximo 2-3 propiedades, brevemente (nombre, comuna, precio, dormitorios).
- Si le interesa alguna, ofrece agendar visita con book_visit.
- Si agendó cita, usa update_lead_status con temperatura "Hot" y estatus "Cita agendada".
- Si muestra interés pero no agenda, temperatura "Warm".

### 5. Despedida
- Siempre agradece su tiempo.
- Si se agendó cita, confirma fecha, hora y dirección.
- Termina con end_call.

## Reglas importantes
- NUNCA insistas si dicen que no. Una sola vez es suficiente.
- La llamada debe ser corta — máximo 3-4 minutos.
- NO inventes propiedades. Solo di lo que devuelve el sistema.
- Si no hay propiedades disponibles para lo que busca, sé honesta y ofrece ampliar búsqueda.
- Sé breve. Esto es una llamada, no un correo."""

# ── Tools (mismas de Modal) ──────────────────────────────────

TOOLS = [
    {
        "type": "custom",
        "name": "search_properties",
        "url": f"{MODAL_BASE}/search-properties",
        "description": "Busca propiedades disponibles. Usa cuando el lead confirme o ajuste lo que busca.",
        "method": "POST",
        "parameters": {
            "type": "object",
            "properties": {
                "zona": {
                    "type": "string",
                    "description": "Comuna de Santiago: Las Condes, Vitacura, Lo Barnechea, Providencia, Ñuñoa, La Reina, Santiago Centro, Huechuraba, Peñalolén, La Florida, Maipú, San Miguel, Macul",
                },
                "presupuesto_max": {
                    "type": "number",
                    "description": "Presupuesto máximo. Venta: en UF. Arriendo: en CLP mensuales.",
                },
                "recamaras_min": {
                    "type": "integer",
                    "description": "Mínimo de dormitorios",
                },
                "tipo": {
                    "type": "string",
                    "description": "Casa, Departamento, Parcela, Oficina, Local Comercial, Terreno, Bodega",
                },
                "operacion": {
                    "type": "string",
                    "description": "Venta o Arriendo",
                },
            },
        },
        "speak_during_execution": True,
        "speak_after_execution": True,
        "execution_message_description": "Déjeme revisar qué opciones nuevas tenemos.",
        "execution_message_type": "static_text",
        "timeout_ms": 15000,
    },
    {
        "type": "custom",
        "name": "book_visit",
        "url": f"{MODAL_BASE}/book-visit",
        "description": "Agenda visita a propiedad en Cal.com y actualiza Notion.",
        "method": "POST",
        "parameters": {
            "type": "object",
            "properties": {
                "phone": {"type": "string", "description": "Teléfono del cliente"},
                "name": {"type": "string", "description": "Nombre del cliente"},
                "email": {"type": "string", "description": "Email del cliente"},
                "event_type_id": {"type": "integer", "description": "ID del evento en Cal.com, usa 1"},
                "preferred_date": {"type": "string", "description": "Fecha YYYY-MM-DD"},
                "preferred_time": {"type": "string", "description": "Hora HH:MM"},
            },
            "required": ["name", "preferred_date", "preferred_time"],
        },
        "speak_during_execution": True,
        "speak_after_execution": True,
        "execution_message_description": "Perfecto, déjeme agendar su visita.",
        "execution_message_type": "static_text",
        "timeout_ms": 15000,
    },
    {
        "type": "custom",
        "name": "update_lead_status",
        "url": f"{MODAL_BASE}/update-lead-status",
        "description": "Actualiza estatus y temperatura del lead. Úsalo al final de la llamada para clasificar el resultado.",
        "method": "POST",
        "parameters": {
            "type": "object",
            "properties": {
                "phone": {"type": "string", "description": "Teléfono del lead"},
                "temperatura": {
                    "type": "string",
                    "enum": ["Hot", "Warm", "Cold"],
                    "description": "Hot: quiere agendar. Warm: interés. Cold: sin interés.",
                },
                "estatus": {
                    "type": "string",
                    "enum": ["En proceso", "Cita agendada", "Sin interés", "No contestado"],
                    "description": "Nuevo estatus del lead",
                },
                "siguiente_accion": {
                    "type": "string",
                    "description": "Qué hacer después con este lead",
                },
            },
            "required": ["phone"],
        },
        "speak_during_execution": False,
        "speak_after_execution": False,
        "timeout_ms": 10000,
    },
    {
        "type": "end_call",
        "name": "end_call",
        "description": "Termina la llamada después de despedirte.",
    },
]

# ── Crear LLM ────────────────────────────────────────────────

print("Creando LLM outbound...")
llm = client.llm.create(
    model="claude-4.5-haiku",  # más barato (~30-40% menos) que sonnet, calidad suficiente
    begin_message="",  # Vacío — el agente usa el prompt con variables dinámicas para la apertura
    start_speaker="agent",
    general_prompt=SOFIA_OUTBOUND_PROMPT,
    general_tools=TOOLS,
    model_temperature=0.3,
    default_dynamic_variables={
        "lead_name": "Cliente",
        "zona_interes": "Santiago",
        "tipo_buscado": "propiedad",
        "presupuesto": "no especificado",
        "notas": "ninguno",
    },
)
print(f"  LLM ID: {llm.llm_id}")

# ── Crear Agente ─────────────────────────────────────────────

print("Creando agente outbound...")
agent = client.agent.create(
    agent_name="Sofía Outbound — Inmobiliaria Horizontes",
    voice_id="retell-Claudia",  # Voz es-CL elegida por el usuario
    language="es-419",
    response_engine={
        "type": "retell-llm",
        "llm_id": llm.llm_id,
    },
    webhook_url=f"{MODAL_BASE}/retell-webhook",
    webhook_events=["call_started", "call_ended", "call_analyzed"],
    timezone="America/Santiago",
    enable_backchannel=True,
    backchannel_words=["claro", "sí", "ya", "entiendo"],
    responsiveness=0.8,
    interruption_sensitivity=0.8,
    voice_speed=1.0,
)

print(f"  Agent ID: {agent.agent_id}")
print(f"  Nombre: Sofía Outbound — Inmobiliaria Horizontes")
print(f"  Voz: retell-Claudia (es-CL)")
print(f"  Modelo: claude-4.5-haiku")
print(f"  Dynamic vars: lead_name, zona_interes, tipo_buscado, presupuesto, notas")
print(f"\n  RETELL_OUTBOUND_AGENT_ID={agent.agent_id}")
print(f"  RETELL_OUTBOUND_LLM_ID={llm.llm_id}")
