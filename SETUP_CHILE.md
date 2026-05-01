# Sofía Voice Agent — Setup Chile + Supabase

Plantilla `santmun/sofia-voice-agent` reescrita para inmobiliaria en **Santiago de Chile** con **Supabase self-hosted** como CRM (sin Notion, sin Cal.com).

## Cambios vs upstream

**Localización Chile**
- Prompts inbound + outbound en es-CL (tutea, sin "po" / "weón")
- Comunas de Santiago, UF/CLP, +56, `timezone=America/Santiago`
- Backchannel chileno, voz LATAM neutra (`cartesia-Sofia`, revisar es-CL antes de prod)

**CRM: Notion → Supabase self-hosted**
- `app/services/supabase_service.py` reemplaza `notion_service.py` (eliminado)
- Schema completo en `supabase_schema.sql` (tablas + RLS + triggers + vista KPI)
- 3 tablas core (`propiedades`, `leads`, `llamadas`) + `visitas` (reemplaza Cal.com) + `perfiles` (auth)

**Cal.com → tabla `visitas` propia**
- `book_visit` y `get_available_slots` ahora pegan a Supabase
- Slots de 1h entre 09:00–19:00, descartando los ocupados (`Solicitada`/`Confirmada`)

**Webapp nueva (carpeta `dashboard/`)**
- Stack: Next 16 (Turbopack) + React 19 + Tailwind 4 + Supabase JS + `@supabase/ssr`
- Auth con email/password (Supabase Auth). Trigger SQL crea perfil al signup.
- RLS: lectura abierta a autenticados, escritura admin (con excepciones para ejecutivos).
- Páginas: `/login`, `/signup`, `/` (dashboard KPIs), `/leads`, `/leads/nuevo`, `/propiedades`, `/propiedades/nueva`, `/llamadas`, `/visitas`, `/visitas/nueva`
- Endpoint `POST /api/trigger-outbound` reenvía al backend Modal
- Proxy/middleware (`src/proxy.ts`, Next 16) protege rutas sin sesión

## Arranque

### 1. Configurar Supabase
1. Abrir SQL Editor en `https://studiospbsagtimb.cesmark.cl/` (Studio UI). API Kong: `https://spbsagtimb.cesmark.cl`
2. Pegar y ejecutar `supabase_schema.sql` completo
3. En **Settings → API**, copiar `URL`, `anon key` y `service_role key`

### 2. `.env` (backend)
```bash
cp .env.example .env
# Pegar: RETELL_API_KEY, TWILIO_*, SUPABASE_URL/ANON/SERVICE, ANTHROPIC_API_KEY
```

### 3. `dashboard/.env.local` (webapp)
```bash
cp dashboard/.env.local.example dashboard/.env.local
# Pegar: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, MODAL_API_URL
```

### 4. Backend Python
```bash
.venv/Scripts/activate          # Git Bash
# (deps ya instaladas en .venv)
python scripts/test_functions.py   # smoke test contra Supabase
```

### 5. Webapp
```bash
cd dashboard
npm run dev                     # http://localhost:3000
# 1) Crear cuenta en /signup
# 2) En SQL Editor: update perfiles set rol='admin' where email='tu@mail.cl';
# 3) Refrescar y entrar
```

### 6. Modal + Retell (cuando tengas las API keys)
```bash
modal token new
modal secret create sofia-credentials --from-dotenv .env
python scripts/create_retell_agent.py
python scripts/create_outbound_agent.py
# Copiá RETELL_OUTBOUND_AGENT_ID al .env y al secret de Modal
modal deploy app/main.py
# En Twilio: apuntar el +56 al SIP trunk de Retell
```

## Endpoints del backend (FastAPI en Modal)

| Método | Path | Uso |
|---|---|---|
| POST | `/retell-webhook` | Eventos de Retell (`call_started`, `call_ended`, `call_analyzed`) |
| POST | `/search-properties` | Tool de Retell — busca en `propiedades` |
| POST | `/create-lead` | Tool de Retell — upsert en `leads` |
| POST | `/book-visit` | Tool de Retell — inserta en `visitas` |
| POST | `/update-lead-status` | Tool de Retell — actualiza `leads` |
| POST | `/trigger-outbound` | Disparo manual del worker outbound |
| GET | `/health` | Healthcheck |

Cron de Modal (`outbound_cron`): cada hora revisa leads con estatus `Pendiente de llamar` y dispara llamadas Retell.

## Permisos / RLS resumido

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `perfiles` | self / admin | trigger | self | admin |
| `propiedades` | autenticados | admin | admin | admin |
| `leads` | autenticados | autenticados | admin / dueño | admin |
| `llamadas` | autenticados | admin (backend usa service_role) | admin | admin |
| `visitas` | autenticados | autenticados | admin / dueño | admin |

> El backend Modal usa `SUPABASE_SERVICE_KEY` y bypassea RLS (necesario para insertar llamadas desde webhooks de Retell sin sesión de usuario).

## Voz / TODO Chile

- Voz `cartesia-Sofia` es LATAM neutra. Antes de prod revisar voces es-CL en Retell dashboard y reemplazar `voice_id` en `scripts/create_*.py`.
- Número Twilio: conseguir uno `+56` o usar long-code intl. con prefijo.
- HTTPS: el Supabase está en HTTP (`traefik.me`). Para prod considerar reverse proxy con TLS.

## Costos estimados

| Servicio | Free | Pago |
|---|---|---|
| Retell AI | 60 min | ~USD 0.07–0.31/min |
| Twilio | USD 15 crédito | número intl. ~USD 1–15/mes + USD 0.013/min |
| Modal | USD 30/mes compute | pay-per-use |
| Supabase self-hosted | propio | costo de servidor (Easypanel/VPS) |
| Anthropic | USD 5 | pay-per-use |

(Se eliminan: Notion + Cal.com)
