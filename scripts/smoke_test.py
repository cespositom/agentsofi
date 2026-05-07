"""Smoke test post-call: verifica el pipeline de procesamiento sin gastar
en una llamada nueva.

Uso:
    python scripts/smoke_test.py [call_id]

Si no se pasa call_id, usa la última llamada registrada en Supabase.

Lo que verifica:
1. Llama al endpoint /post-call-summary del backend Modal con el call_id
2. Comprueba que el endpoint responde 200 con `status: ok` y `has_transcript: true`
3. Lee la fila resultante en `llamadas` y valida:
   - duracion_seg > 0
   - costo_retell_usd > 0
   - costo_twilio_usd > 0
   - costo_anthropic_usd > 0  (o cero si no hubo análisis)
   - costo_modal_usd > 0      (al menos el fixed estimate)
   - lead_id no null si el cliente es conocido
   - resumen no null
   - transcripcion no null
4. Reporta PASS/FAIL por check.

Exit code 0 si todos los checks core pasan, 1 si alguno falla.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode


def _load_env() -> None:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        # NO usar setdefault: el .env del repo es la verdad para este script,
        # y el entorno del shell puede tener valores viejos cacheados.
        os.environ[k.strip()] = v.strip()


# Cloudflare bloquea User-Agent default de urllib. Usar uno tipo curl.
_DEFAULT_UA = "curl/8.4.0 sofia-smoke-test"


def _http_get(url: str, headers: dict[str, str], timeout: int = 30) -> dict:
    headers = {"User-Agent": _DEFAULT_UA, **headers}
    req = Request(url, headers=headers)
    with urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def _http_post_json(url: str, payload: dict, timeout: int = 120) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = Request(
        url,
        data=body,
        headers={
            "User-Agent": _DEFAULT_UA,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def _supabase_query(table: str, params: dict) -> list[dict]:
    base = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_KEY"]
    url = f"{base}/rest/v1/{table}?{urlencode(params)}"
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    data = _http_get(url, headers)
    return data if isinstance(data, list) else [data]


CHECK = "✓"
CROSS = "✗"
WARN = "⚠"


def _check(label: str, cond: bool, detail: str = "") -> bool:
    icon = CHECK if cond else CROSS
    suffix = f" — {detail}" if detail else ""
    print(f"  {icon} {label}{suffix}")
    return cond


def main(call_id: str | None) -> int:
    _load_env()

    modal_url = os.environ.get("MODAL_API_URL", "").rstrip("/")
    if not modal_url:
        print("MODAL_API_URL not set in .env")
        return 1

    if not call_id:
        rows = _supabase_query(
            "llamadas",
            {
                "select": "retell_call_id",
                "order": "created_at.desc",
                "limit": "1",
            },
        )
        if not rows or not rows[0].get("retell_call_id"):
            print("No hay llamadas previas en la DB para usar como fixture.")
            return 1
        call_id = rows[0]["retell_call_id"]
        print(f"Sin call_id explícito → usando última: {call_id}\n")

    print(f"== POST {modal_url}/post-call-summary ==")
    try:
        resp = _http_post_json(
            f"{modal_url}/post-call-summary", {"call_id": call_id}
        )
    except Exception as e:
        print(f"  {CROSS} HTTP error: {e}")
        return 1

    print(f"  resp: {resp}\n")

    print("== Validaciones ==")
    fails = 0
    fails += not _check("status=ok", resp.get("status") == "ok",
                        f"got {resp.get('status')!r}")
    fails += not _check("has_transcript=True", resp.get("has_transcript") is True)

    print()
    print("== Fila en `llamadas` ==")
    rows = _supabase_query(
        "llamadas",
        {
            "select": "*",
            "retell_call_id": f"eq.{call_id}",
        },
    )
    if not rows:
        print(f"  {CROSS} No se encontró fila para call_id {call_id}")
        return 1
    row = rows[0]
    print(f"  titulo:           {row.get('titulo')}")
    print(f"  duracion_seg:     {row.get('duracion_seg')}")
    print(f"  carrier:          {row.get('carrier')}")
    print(f"  retell_usd:       {row.get('costo_retell_usd')}")
    print(f"  twilio_usd:       {row.get('costo_twilio_usd')}")
    print(f"  anthropic_usd:    {row.get('costo_anthropic_usd')}")
    print(f"  modal_usd:        {row.get('costo_modal_usd')}")
    print(f"  compute_modal_s:  {row.get('compute_modal_seg')}")
    print(f"  lead_id:          {row.get('lead_id')}")
    print(f"  sentimiento:      {row.get('sentimiento')}")
    print(f"  resumen:          {(row.get('resumen') or '')[:100]}...")
    print()

    fails += not _check("duracion_seg > 0", (row.get("duracion_seg") or 0) > 0)
    fails += not _check(
        "costo_retell_usd > 0",
        float(row.get("costo_retell_usd") or 0) > 0,
    )
    fails += not _check(
        "costo_twilio_usd > 0",
        float(row.get("costo_twilio_usd") or 0) > 0,
    )
    fails += not _check(
        "costo_modal_usd > 0",
        float(row.get("costo_modal_usd") or 0) > 0,
    )
    fails += not _check(
        "transcripcion no null",
        bool(row.get("transcripcion")),
    )
    fails += not _check(
        "resumen no null",
        bool(row.get("resumen")),
    )
    # Anthropic puede ser 0 si el análisis falló — warning, no fail.
    if float(row.get("costo_anthropic_usd") or 0) == 0:
        print(f"  {WARN} costo_anthropic_usd=0 (posible fallo de Claude API)")
    if not row.get("lead_id"):
        print(f"  {WARN} lead_id null (cliente no estaba en CRM)")

    print()
    if fails:
        print(f"FAIL: {fails} check(s) fallaron.")
        return 1
    print("OK: smoke test pasó.")
    return 0


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    sys.exit(main(arg))
