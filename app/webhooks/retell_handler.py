import json

from app.services import anthropic_service, supabase_service, retell_service


def _extract_call_id(data: dict) -> str:
    """Extrae call_id del payload de Retell.
    Retell envía: {"event": "...", "call": {"call_id": "...", ...}}
    """
    # Primero buscar en data.call.call_id (formato real de Retell)
    call_obj = data.get("call", {})
    if isinstance(call_obj, dict) and call_obj.get("call_id"):
        return call_obj["call_id"]
    # Fallback: call_id en root
    return data.get("call_id", "")


def handle_retell_event(request: dict) -> dict:
    """Procesa eventos de Retell AI: call_started, call_ended, call_analyzed."""
    event_type = request.get("event", "unknown")

    # Log del payload para debug (primera línea con las keys)
    print(f"[Sofia] Webhook recibido: event={event_type}, keys={list(request.keys())}")

    if event_type == "call_started":
        return _on_call_started(request)
    elif event_type == "call_ended":
        return _on_call_ended(request)
    elif event_type == "call_analyzed":
        return _on_call_analyzed(request)
    else:
        return {"status": "ignored", "event": event_type}


def _on_call_started(data: dict) -> dict:
    call_id = _extract_call_id(data)
    print(f"[Sofia] Llamada iniciada: {call_id}")
    return {"status": "ok", "call_id": call_id}


def _on_call_ended(data: dict) -> dict:
    """Al colgar: obtiene transcripción, analiza con Claude, guarda en Notion."""
    call_id = _extract_call_id(data)
    print(f"[Sofia] Llamada terminada: {call_id}")

    if not call_id:
        print(f"[Sofia] call_id vacío. Payload keys: {list(data.keys())}")
        # Log completo para diagnosticar
        for key in data:
            val = data[key]
            if isinstance(val, dict):
                print(f"  {key}: dict con keys {list(val.keys())}")
            else:
                print(f"  {key}: {str(val)[:100]}")
        return {"status": "error", "error": "call_id vacío en webhook"}

    try:
        return process_post_call(call_id)
    except Exception as e:
        print(f"[Sofia] Error en post-call: {e}")
        return {"status": "error", "call_id": call_id, "error": str(e)}


def _on_call_analyzed(data: dict) -> dict:
    """call_analyzed llega después de call_ended con transcript+costos finales.
    Re-ejecutamos process_post_call para upsertear con el análisis IA.
    """
    call_id = _extract_call_id(data)
    print(f"[Sofia] Llamada analizada: {call_id}")
    if not call_id:
        return {"status": "error", "error": "call_id vacío en analyzed"}
    try:
        return process_post_call(call_id)
    except Exception as e:
        print(f"[Sofia] Error en post-call analyzed: {e}")
        return {"status": "error", "call_id": call_id, "error": str(e)}


def _infer_carrier(from_number: str) -> str:
    import os
    if from_number and from_number == os.environ.get("TELNYX_PHONE_NUMBER", ""):
        return "telnyx"
    if from_number and from_number == os.environ.get("TWILIO_PHONE_NUMBER", ""):
        return "twilio"
    return (os.environ.get("PRIMARY_CARRIER") or "twilio").lower()


def process_post_call(call_id: str) -> dict:
    """Flujo post-llamada robusto. Guarda registro SIEMPRE (aun sin transcript),
    upsertea sobre retell_call_id para que call_analyzed re-actualice la fila
    con análisis Claude cuando esté listo.
    """
    # 1. Datos de la llamada
    call_data = retell_service.get_call(call_id)
    transcript = call_data.get("transcript", "") or ""
    direction = call_data.get("direction", "inbound")
    duration_sec = int((call_data.get("duration_ms", 0) or 0) / 1000)
    disconnect = call_data.get("disconnect_reason") or ""
    from_n = call_data.get("from_number", "") or ""
    to_n = call_data.get("to_number", "") or ""

    tipo_llamada = "Inbound" if "inbound" in direction.lower() else "Outbound"
    carrier = _infer_carrier(from_n)
    # phone = el número del CLIENTE, no el de Sofía
    # inbound: cliente está en from_number; outbound: cliente está en to_number
    phone = from_n if tipo_llamada == "Inbound" else to_n

    # 2. Analizar con Claude solo si hay transcripción
    analysis: dict = {}
    if transcript:
        try:
            analysis = anthropic_service.analyze_call(transcript) or {}
        except Exception as e:
            print(f"[Sofia] Análisis Claude falló para {call_id}: {e}")
            analysis = {}

    nombre = (analysis.get("nombre_cliente") or "Cliente").strip() or "Cliente"

    # Resultado heurístico
    if not transcript and duration_sec == 0:
        resultado = f"No conectada ({disconnect})" if disconnect else "No conectada"
    elif not transcript:
        resultado = "Sin transcripción"
    else:
        resultado = "Contestada"

    # Estimación de costo Modal por llamada (configurable, calibrar mensualmente).
    import os as _os
    modal_cost = float(_os.environ.get("MODAL_COST_PER_CALL_USD", "0.005") or 0)

    # 3. Registrar/actualizar llamada (upsert por retell_call_id)
    call_record = supabase_service.create_call_record(
        titulo=f"{tipo_llamada} - {nombre}",
        tipo=tipo_llamada,
        resultado=resultado,
        telefono=phone,
        nombre_lead=nombre,
        duracion_seg=duration_sec,
        resumen=analysis.get("resumen", "") or (disconnect if not transcript else ""),
        transcripcion=transcript,
        sentimiento=analysis.get("sentimiento", "Neutral"),
        cita_agendada=bool(analysis.get("cita_agendada", False)),
        retell_call_id=call_id,
        costo_usd=call_data.get("costo_usd", 0) or 0,
        costo_detalle=call_data.get("costo_detalle"),
        carrier=carrier,
        costo_anthropic_usd=float(analysis.get("_cost_usd", 0) or 0),
        costo_modal_usd=modal_cost,
    )

    # 4. Lead: solo si hay análisis útil
    lead_id = None
    if phone and analysis:
        existing = supabase_service.find_lead_by_phone(phone)
        if existing:
            lead_id = existing["id"]
            supabase_service.update_lead(
                page_id=lead_id,
                temperatura=analysis.get("temperatura", "Warm"),
                resumen_ia=analysis.get("resumen", ""),
                siguiente_accion=analysis.get("siguiente_accion", ""),
                estatus="Cita agendada" if analysis.get("cita_agendada") else None,
            )
        else:
            lead = supabase_service.create_lead(
                name=nombre,
                phone=phone,
                presupuesto=analysis.get("presupuesto"),
                zona_interes=analysis.get("zonas_interes", []),
                fuente="Llamada entrante" if tipo_llamada == "Inbound" else "Otro",
                notas=analysis.get("resumen", ""),
            )
            lead_id = lead["id"]

    print(f"[Sofia] Post-call: call={call_id} dur={duration_sec}s carrier={carrier} "
          f"costo_retell={call_data.get('costo_usd', 0)} transcript={'si' if transcript else 'no'}")
    return {
        "status": "ok",
        "call_id": call_id,
        "call_record_id": call_record.get("id"),
        "lead_id": lead_id,
        "has_transcript": bool(transcript),
    }
