# Sofía Voice Agent — Chile + Supabase (proyecto local)

> Guía de contexto para futuras sesiones de Claude Code que abran este proyecto.
> Este es un **fork muy modificado** de `santmun/sofia-voice-agent`. El upstream apunta a México con Notion + Cal.com; este fork apunta a Chile con Supabase self-hosted y webapp propia. **No reintroducir Notion ni Cal.com.**

## 1. Descripción

Agente de voz IA para inmobiliaria en **Santiago de Chile**. Recibe y origina llamadas, busca propiedades, registra leads, agenda visitas y genera resúmenes post-llamada. Todo con CRM en Supabase self-hosted y panel web propio.

## 2. Stack actual

| Capa | Tecnología |
|---|---|
| Voz | Retell AI (STT + LLM + TTS) |
| Backend | Python 3.11+, FastAPI, Modal (serverless + cron) |
| Telefonía | Twilio (número Chile +56 → SIP trunk Retell) |
| CRM + Auth | **Supabase self-hosted** en `https://spbsagtimb.cesmark.cl` (Kong API) — Studio UI en `https://studiospbsagtimb.cesmark.cl` |
| Webapp | Next 16 (Turbopack) + React 19 + Tailwind 4 + `@supabase/ssr` |
| Análisis | Anthropic Claude Sonnet 4.5 |

**Eliminados del upstream:** Notion (`notion-client`, `lib/notion.ts`, `notion_service.py`) y Cal.com (`calcom_service.py`). No referenciar.

## 3. Estructura del repo

```
sofia-voice-agent/
├── app/
│   ├── main.py                       # FastAPI + Modal app + cron outbound
│   ├── config.py                     # env vars (Retell/Twilio/Supabase/Anthropic)
│   ├── outbound_worker.py            # ciclo de llamadas salientes
│   ├── services/
│   │   ├── supabase_service.py       # CRM (props, leads, llamadas, visitas)
│   │   ├── retell_service.py         # SDK Retell wrapper
│   │   ├── twilio_service.py         # SDK Twilio wrapper
│   │   └── anthropic_service.py      # análisis post-llamada
│   └── webhooks/
│       ├── retell_handler.py         # call_started/ended/analyzed
│       └── twilio_handler.py
├── dashboard/                        # Webapp Next 16 (Supabase Auth + CRUD)
│   ├── src/
│   │   ├── proxy.ts                  # ¡NO middleware.ts! Next 16 usa proxy.ts
│   │   ├── lib/
│   │   │   ├── supabase/{client,server,types}.ts
│   │   │   └── format.ts             # CLP, UF, fechas TZ Santiago
│   │   ├── components/{shell,sidebar,ui/*}
│   │   └── app/
│   │       ├── page.tsx              # dashboard KPIs
│   │       ├── login/, signup/
│   │       ├── leads/{,nuevo}/
│   │       ├── propiedades/{,nueva}/
│   │       ├── llamadas/
│   │       ├── visitas/{,nueva}/
│   │       └── api/trigger-outbound/route.ts
│   └── .env.local.example
├── scripts/
│   ├── create_retell_agent.py        # crea agente inbound (Sofía es-CL)
│   ├── create_outbound_agent.py      # crea agente outbound es-CL
│   └── test_functions.py             # smoke test contra Supabase
├── supabase_schema.sql               # ESQUEMA OFICIAL — ejecutar en SQL Editor
├── SETUP_CHILE.md                    # guía de arranque
├── pyproject.toml
└── .env.example
```

## 4. Datos clave de localización Chile

- **Idioma**: español de Chile, **tutea por defecto**, sin "po"/"weón"/modismos coloquiales fuertes.
- **Comunas** (zona): Las Condes, Vitacura, Lo Barnechea, Providencia, Ñuñoa, La Reina, Santiago Centro, Huechuraba, Peñalolén, La Florida, Maipú, San Miguel, Macul.
- **Precios**: **UF** para venta, **CLP mensuales** para arriendo. Helpers en `dashboard/src/lib/format.ts` (`fmtUF`, `fmtCLP`, `fmtPrecio`).
- **Teléfonos**: `+56 9 XXXX XXXX`.
- **Timezone**: `America/Santiago` (offset `-04:00` aprox; cuidado con horario de verano).
- **Tipos de propiedad**: Casa, Departamento, Parcela, Oficina, Local Comercial, Terreno, Bodega.
- **Operación**: Venta / Arriendo (NO "Renta").
- **Voz Retell**: `cartesia-Sofia` (LATAM neutra). Marcado con `# TODO Chile` en `scripts/create_*.py` — antes de prod revisar voces es-CL.

## 5. Schema Supabase (ver `supabase_schema.sql`)

5 tablas + enums tipados:
- `perfiles` (mirror de `auth.users` con `rol = admin | ejecutivo`, auto-creado por trigger en signup)
- `propiedades`, `leads`, `llamadas`, `visitas`
- Vista `kpi_resumen` con `security_invoker = on`
- Helpers: `auth_rol()`, `es_admin()`
- RLS: lectura abierta a autenticados; escritura admin (con excepciones para ejecutivo dueño en `leads.update` y `visitas.update`)
- Backend Modal usa `SUPABASE_SERVICE_KEY` y bypassea RLS (necesario para insertar llamadas desde webhooks Retell sin sesión)

**Crear primer admin:**
```sql
update public.perfiles set rol='admin' where email='tu@mail.cl';
```

## 6. Comandos típicos

```bash
# Backend
.venv/Scripts/activate                  # Git Bash en Windows
python scripts/test_functions.py        # smoke contra Supabase

# Webapp
cd dashboard && npm run dev             # http://localhost:3000
cd dashboard && NEXT_PUBLIC_SUPABASE_URL=http://x NEXT_PUBLIC_SUPABASE_ANON_KEY=x npx --no-install next build

# Modal (cuando estén las API keys)
modal token new
modal secret create sofia-credentials --from-dotenv .env
modal deploy app/main.py
python scripts/create_retell_agent.py
python scripts/create_outbound_agent.py
```

## 7. Convenciones / cosas a respetar en revisiones

- **No reintroducir Notion/Cal.com** ni dependencias `notion-client` o `cal.com`.
- **Webapp = Next 16**: el archivo es `src/proxy.ts` con `export async function proxy(...)`. NO `middleware.ts` ni `export async function middleware`.
- **Tailwind 4** + base-ui: `Button` no soporta `asChild`. Para enlaces que parecen botón usar `<Link className={buttonVariants(...)}>`.
- Backend: cuando se agregan endpoints en `main.py`, importar dentro de la función (`from app.services import supabase_service`) — patrón existente para deferred import en Modal.
- Strings en es-CL en prompts y UI; código y nombres de variables en inglés/español neutro.
- Secrets solo en `.env` y Modal Secret. Nunca hardcodear.
- Backend usa `SUPABASE_SERVICE_KEY` (RLS bypass). Webapp usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` (RLS aplica). NO exponer service key al cliente.
- `supabase_service.book_visit` espera `preferred_date` (YYYY-MM-DD) + `preferred_time` (HH:MM); construye TZ con offset hardcoded `-04:00`. Si se necesita precisión con horario de verano, migrar a `zoneinfo("America/Santiago")`.
- Cron Modal: `outbound_cron` corre cada hora (`schedule=modal.Cron("0 * * * *")`), 10min timeout.

## 8. Estado de setup pendiente

Cosas que hace el humano (no Claude):
- [ ] Ejecutar `supabase_schema.sql` en el SQL Editor del Supabase
- [ ] Pegar `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_KEY` en `.env` y `dashboard/.env.local`
- [ ] Registrar primer usuario en `/signup` y promoverlo a admin con SQL
- [ ] Conseguir API keys de Retell, Twilio (+56), Modal, Anthropic
- [ ] Revisar voces es-CL en Retell dashboard
- [ ] Resolver TLS/HTTPS para el Supabase (hoy va por HTTP `traefik.me`)

## 9. Documentos de referencia

- `SETUP_CHILE.md` — guía completa de arranque y deploy
- `supabase_schema.sql` — único source-of-truth del schema
- `.env.example` y `dashboard/.env.local.example` — listado de env vars

## 10. Memoria global vinculada

Existe un memo global en `~/.claude/memory/sofia_voice_agent_chile.md` indexado en `~/.claude/MEMORY.md` con la misma información de alto nivel. Si hay conflicto, **este `CLAUDE.md` manda** (es el más cercano al código).
