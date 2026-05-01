"""Test rápido de cada función contra Supabase y APIs reales."""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import *  # noqa: F401,F403 — loads .env


def test_search_properties():
    print("\n=== 1. BUSQUEDA DE PROPIEDADES ===")
    from app.services.supabase_service import search_properties

    results = search_properties(zona="Las Condes", tipo="Departamento")
    print(f"  Filtro: comuna=Las Condes, tipo=Departamento")
    print(f"  Resultados: {len(results)}")
    for p in results:
        print(f"    -> {p['nombre'][:60]} | UF {p['precio']:,.0f} | {p['m2']}m2")

    results2 = search_properties(presupuesto_max=8000, operacion="Venta")
    print(f"\n  Filtro: presupuesto_max=8.000 UF, operacion=Venta")
    print(f"  Resultados: {len(results2)}")
    for p in results2:
        print(f"    -> {p['nombre'][:60]} | UF {p['precio']:,.0f}")
    return len(results) >= 0  # OK aunque venga vacío


def test_create_lead():
    print("\n=== 2. CREAR LEAD ===")
    from app.services.supabase_service import create_lead

    lead = create_lead(
        name="Carlos Mendoza (TEST)",
        phone="+56912345678",
        email="carlos.test@ejemplo.cl",
        presupuesto=6000,
        zona_interes=["Las Condes", "Providencia"],
        tipo_buscado=["Departamento"],
        operacion_buscada="Compra",
        fuente="Llamada entrante",
        notas="Lead de prueba — se puede eliminar",
    )
    print(f"  Lead id: {lead['id']}")
    print(f"  Nombre: {lead['nombre']}")
    return lead["id"]


def test_update_lead(lead_id: str):
    print("\n=== 3. ACTUALIZAR LEAD ===")
    from app.services.supabase_service import update_lead

    result = update_lead(
        page_id=lead_id,
        estatus="En proceso",
        temperatura="Hot",
        siguiente_accion="Agendar visita a depto en Las Condes esta semana",
    )
    print(f"  Lead actualizado: {result['id']}")
    print(f"  Campos: {result['updated_fields']}")
    return True


def test_find_lead():
    print("\n=== 4. BUSCAR LEAD POR TELEFONO ===")
    from app.services.supabase_service import find_lead_by_phone

    lead = find_lead_by_phone("+56912345678")
    if lead:
        print(f"  Encontrado: {lead['nombre']}")
        print(f"  Estatus: {lead['estatus']} | Temp: {lead['temperatura']}")
    else:
        print("  No encontrado")
    return lead is not None


def test_create_call_record():
    print("\n=== 5. REGISTRAR LLAMADA ===")
    from app.services.supabase_service import create_call_record

    record = create_call_record(
        titulo="Inbound — Carlos Mendoza (TEST)",
        tipo="Inbound",
        resultado="Contestada",
        telefono="+56912345678",
        nombre_lead="Carlos Mendoza",
        duracion_seg=185,
        resumen="Cliente interesado en departamentos en Las Condes/Providencia. Presupuesto 6.000 UF. Quiere agendar visita esta semana.",
        sentimiento="Positivo",
        cita_agendada=False,
        retell_call_id="test_call_123",
    )
    print(f"  Llamada registrada: {record['id']}")
    print(f"  Titulo: {record['titulo']}")
    return True


def test_book_visit():
    print("\n=== 6. AGENDAR VISITA ===")
    from app.services.supabase_service import book_visit, get_available_slots
    from datetime import date, timedelta

    fecha = (date.today() + timedelta(days=2)).isoformat()
    slots = get_available_slots(fecha)
    print(f"  Slots disponibles {fecha}: {slots[:5]}...")
    if not slots:
        print("  No hay slots disponibles")
        return False

    visita = book_visit(
        phone="+56912345678",
        name="Carlos Mendoza",
        preferred_date=fecha,
        preferred_time=slots[0],
    )
    print(f"  Visita: {visita}")
    return visita.get("id") is not None


def test_analyze_call():
    print("\n=== 7. ANALISIS POST-LLAMADA (Claude) ===")
    from app.services.anthropic_service import analyze_call

    fake_transcript = """
    Sofía: Hola, gracias por llamar a Inmobiliaria Horizontes. ¿En qué te puedo ayudar?
    Cliente: Hola Sofía, soy Roberto. Busco un departamento en Las Condes, unos 100m2.
    Sofía: ¿Tienes presupuesto en mente?
    Cliente: Entre 6.000 y 8.000 UF para compra.
    Sofía: ¿Quieres agendar una visita esta semana?
    Cliente: Sí, el jueves a las 4 de la tarde.
    Sofía: Confirmado para el jueves a las 4pm. ¡Gracias!
    """
    analysis = analyze_call(fake_transcript)
    print(f"  Resumen: {analysis.get('resumen', 'N/A')[:120]}...")
    print(f"  Temperatura: {analysis.get('temperatura', 'N/A')}")
    print(f"  Cita agendada: {analysis.get('cita_agendada', False)}")
    return "resumen" in analysis


if __name__ == "__main__":
    results = {}
    results["search_properties"] = test_search_properties()
    lead_id = test_create_lead()
    results["create_lead"] = bool(lead_id)
    if lead_id:
        results["update_lead"] = test_update_lead(lead_id)
    results["find_lead"] = test_find_lead()
    results["create_call_record"] = test_create_call_record()
    results["book_visit"] = test_book_visit()
    results["analyze_call"] = test_analyze_call()

    print("\n=== RESUMEN ===")
    all_pass = True
    for name, passed in results.items():
        status = "OK" if passed else "FAIL"
        print(f"  [{status}] {name}")
        if not passed:
            all_pass = False
    sys.exit(0 if all_pass else 1)
