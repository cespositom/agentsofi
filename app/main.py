import modal
from fastapi import FastAPI

modal_app = modal.App("sofia-voice-agent")

image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "retell-sdk>=5.0.0",
    "twilio>=9.0.0",
    "anthropic>=0.42.0",
    "supabase>=2.7.0",
    "requests>=2.32.0",
    "python-dotenv>=1.0.0",
    "fastapi>=0.115.0",
)

sofia_secret = modal.Secret.from_name("sofia-credentials")

web_app = FastAPI(title="Sofia Voice Agent")


@web_app.get("/health")
def health():
    return {"status": "ok", "agent": "sofia", "version": "0.2.0"}


@web_app.post("/retell-webhook")
def retell_webhook(request: dict):
    from app.webhooks.retell_handler import handle_retell_event
    return handle_retell_event(request)


@web_app.post("/twilio-webhook")
def twilio_webhook(request: dict):
    from app.webhooks.twilio_handler import handle_twilio_event
    return handle_twilio_event(request)


@web_app.post("/search-properties")
def search_properties(request: dict):
    from app.services import supabase_service

    args = request.get("args", request)
    results = supabase_service.search_properties(
        zona=args.get("zona"),
        presupuesto_max=args.get("presupuesto_max"),
        recamaras_min=args.get("recamaras_min"),
        tipo=args.get("tipo"),
        operacion=args.get("operacion"),
    )
    return {"status": "ok", "count": len(results), "properties": results}


@web_app.post("/create-lead")
def create_lead(request: dict):
    from app.services import supabase_service

    args = request.get("args", request)
    lead = supabase_service.create_lead(
        name=args.get("name", ""),
        phone=args.get("phone", ""),
        email=args.get("email", ""),
        presupuesto=args.get("presupuesto"),
        zona_interes=args.get("zona_interes"),
        tipo_buscado=args.get("tipo_buscado"),
        operacion_buscada=args.get("operacion_buscada"),
        fuente=args.get("fuente", "Llamada entrante"),
        notas=args.get("notas", ""),
    )
    return {"status": "ok", "lead": lead}


@web_app.post("/book-visit")
def book_visit(request: dict):
    from app.services import supabase_service

    args = request.get("args", request)
    phone = args.get("phone", "")
    name = args.get("name", "")
    propiedad_id = args.get("propiedad_id")
    preferred_date = args.get("preferred_date", "")
    preferred_time = args.get("preferred_time", "")

    if preferred_date and preferred_time:
        booking = supabase_service.book_visit(
            phone=phone,
            name=name,
            preferred_date=preferred_date,
            preferred_time=preferred_time,
            propiedad_id=propiedad_id,
        )
        return {"status": "ok", "booking": booking}

    if preferred_date:
        slots = supabase_service.get_available_slots(preferred_date)
        return {"status": "ok", "available_slots": slots}

    return {"status": "error", "message": "Se necesita al menos preferred_date"}


@web_app.post("/update-lead-status")
def update_lead_status(request: dict):
    from app.services import supabase_service

    args = request.get("args", request)
    phone = args.get("phone", "")
    page_id = args.get("lead_id", "")

    if not page_id and phone:
        lead = supabase_service.find_lead_by_phone(phone)
        if not lead:
            return {"status": "error", "message": f"No se encontró lead con teléfono {phone}"}
        page_id = lead["id"]

    if not page_id:
        return {"status": "error", "message": "Se necesita phone o lead_id"}

    result = supabase_service.update_lead(
        page_id=page_id,
        estatus=args.get("estatus"),
        temperatura=args.get("temperatura"),
        siguiente_accion=args.get("siguiente_accion"),
    )
    return {"status": "ok", "result": result}


@web_app.post("/post-call-summary")
def post_call_summary(request: dict):
    from app.webhooks.retell_handler import process_post_call

    call_id = request.get("call_id", "")
    if not call_id:
        return {"status": "error", "message": "Se necesita call_id"}

    return process_post_call(call_id)


@web_app.post("/trigger-outbound")
def trigger_outbound():
    """Trigger manual del worker outbound (para demo/testing)."""
    from app.outbound_worker import run_outbound_cycle

    return run_outbound_cycle()


@modal_app.function(image=image, secrets=[sofia_secret])
@modal.asgi_app()
def api():
    return web_app


# ── Worker outbound automático (cada hora) ───────────────────

@modal_app.function(
    image=image,
    secrets=[sofia_secret],
    schedule=modal.Cron("0 * * * *"),  # cada hora en punto
    timeout=600,  # 10 min max por ejecución
)
def outbound_cron():
    """Cron job: revisa leads pendientes y les llama cada hora."""
    from app.outbound_worker import run_outbound_cycle

    return run_outbound_cycle()
