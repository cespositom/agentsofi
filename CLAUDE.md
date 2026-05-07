# Sofía Voice Agent — Chile + Supabase (proyecto local)

> Guía de contexto para futuras sesiones de Claude Code que abran este proyecto.
> Este es un **fork muy modificado** de `santmun/sofia-voice-agent`. El upstream apunta a México con Notion + Cal.com; este fork apunta a Chile con Supabase self-hosted y webapp propia. **No reintroducir Notion ni Cal.com.**

## 0. Estado actual (al 2026-05-06) — número productivo configurado, smoke test outbound pendiente

**TODO el sistema está desplegado y operativo a nivel software**, incluido el **redesign visual completo** del dashboard basado en el mock `sofia-ai-dashboard-v2-3.html` (en `C:\Users\cesar\Projects\open-design\.od\projects\896f57a4-...\`).

**Twilio fuera del trial**: número productivo chileno **`+566009142119`** (servicio 600) provisionado y configurado como Custom telephony en Retell (SIP Trunk Twilio Elastic). Asignado a:
- Inbound: `Sofía — Inmobiliaria Horizontes` (Allowed Inbound Countries: Chile)
- Outbound: `Sofía Outbound — Inmobiliaria Horizontes` (Allowed Outbound Countries: Chile)

El `.env` y el Modal Secret `sofia-credentials` ya tienen `TWILIO_PHONE_NUMBER=+566009142119`. El Modal app `sofia-voice-agent` fue redeployado desde esta carpeta (opt1) tras detectar que un deploy previo de opt2 había pisado el código → ahora `/trigger-outbound` corre `supabase_service.get_pending_leads()` y devuelve JSON 200 OK.

**Pendiente para cerrar el loop**:
1. Verificar que **Geographic Permissions Chile** estén habilitadas en Twilio (Low Risk + High Risk Special Services).
2. **Smoke test outbound real**: lead "Cesar Test" (`+56982696258`) → trigger desde dashboard → atender en móvil → confirmar fila en `llamadas` con `carrier=twilio` y costos > 0.
3. (En paralelo) **Telnyx Level 2 Verification** para activar fallback más barato (~$0.08/min vs $0.20 Twilio).

⚠ **Footgun confirmado**: opt2 (`sofia-voice-agent-opt2`) usa el mismo `modal.App("sofia-voice-agent")` que opt1. Cualquier `modal deploy` desde una carpeta pisa la otra. Mitigación pendiente: renombrar el App en opt2 a `sofia-voice-agent-twenty`.

### Redesign visual (mayo 2026)
El dashboard fue reescrito completamente con el mock open-design:
- **Tema claro** (paleta `#F4F6FA` bg + accent azul `#2563EB` + sofia purple `#7C3AED` + status pills) — ya NO es dark
- **Topnav horizontal** (reemplazo del antiguo sidebar) con tabs: Dashboard / Leads / Propiedades / Llamadas / Visitas / Costos
- **Mobile**: topnav colapsa a hamburger drawer; tablas se reemplazan por stack de cards (`md:hidden` / `hidden md:block`)
- **Fuente Montserrat** solo en el topnav (`--font-montserrat`); el resto usa Inter
- Tokens CSS globales en `globals.css` con prefijo `--sofia-*` (bg, surface, accent, purple, success, warn, danger, muted, border)
- Helpers CSS: `.sofia-card`, `.sofia-kpi`, `.sofia-table`, `.sofia-pill-*`, `.sofia-pbar`/`.sofia-pfill`, `.sofia-nav-link`
- Páginas nuevas: `/leads/[id]` (LeadDetail con timeline), `/costos` (KPIs + breakdown por carrier)
- Vistas dual: `/leads` y `/propiedades` con switcher Kanban|Tabla / Grilla|Tabla
- Forms (`/leads/nuevo`, `/propiedades/nueva`, `/visitas/nueva`) con inputs claros + botones inline (NO shadcn `Button` — desentona)
- Mock fuente: `C:\Users\cesar\Projects\open-design\.od\projects\896f57a4-3504-4e9c-a518-cbe8fe519396\sofia-ai-dashboard-v2-3.html`

### URLs en producción
- **Webapp**: https://agtimb.cesmark.cl (login: `cesaresposito@gmail.com`, rol admin)
- **Backend Modal**: https://cesaresposito--sofia-voice-agent-api.modal.run
- **Supabase Kong** (API): https://spbsagtimb.cesmark.cl
- **Supabase Studio** (UI): https://studiospbsagtimb.cesmark.cl
- **GitHub repo**: https://github.com/cespositom/agentsofi (público)
- **Modal app**: https://modal.com/apps/cesaresposito/main/deployed/sofia-voice-agent

### Retell agents creados
- **Inbound**: `agent_762f16fc056ae58c5085eb996b` (LLM `llm_2cad643b0ace41c86da16a8fea2c`)
- **Outbound**: `agent_d7c23dcd3f6dbacce469d57174` (LLM `llm_b424138e5ed7a24405e28f36a803`)
- **Modelo**: `claude-4.5-haiku` (cambiado de Sonnet — 30% más barato, calidad suficiente)
- **Voz**: `retell-Claudia` (es-CL nativa)
- **SIP Trunk Twilio Elastic** configurado en Retell como Custom telephony, número productivo chileno `+566009142119` (servicio 600). El antiguo trial US `+16184271591` quedó deprecado.
- Sin restricción de Caller ID verificado: al salir del trial, Twilio permite outbound a cualquier destino habilitado en Geo Permissions.

### Datos de prueba cargados
- 51 propiedades RM (mix venta UF / arriendo CLP) — ver `supabase_seed_propiedades.sql`
- 2 leads de test (Cesar Test +56982696258, Smoke Test +56900000999)

## 1. Descripción

Agente de voz IA para inmobiliaria en **Santiago de Chile**. Recibe y origina llamadas, busca propiedades, registra leads, agenda visitas y genera resúmenes post-llamada. Todo con CRM en Supabase self-hosted y panel web propio.

## 2. Stack actual

| Capa | Tecnología |
|---|---|
| Voz | Retell AI (STT + LLM + TTS) |
| LLM | `claude-4.5-haiku` |
| Voz TTS | `retell-Claudia` (es-CL) |
| Backend | Python 3.11+, FastAPI, Modal (serverless + cron) |
| Telefonía | Twilio (primary) + Telnyx (fallback, opcional) — multi-carrier con failover |
| CRM + Auth | **Supabase self-hosted** en `https://spbsagtimb.cesmark.cl` (Kong API) |
| Webapp | Next 16 (Turbopack) + React 19 + Tailwind 4 + `@supabase/ssr` |
| Análisis post-llamada | Anthropic Claude (modelo del proyecto, no de Retell) |
| Hosting webapp | Dokploy → SSR Next standalone (Dockerfile en raíz) |
| Hosting Supabase | Dokploy template Supabase (13 containers en una sola network) |

**Eliminados del upstream:** Notion (`notion-client`, `lib/notion.ts`, `notion_service.py`) y Cal.com (`calcom_service.py`). No referenciar.

## 3. Estructura del repo

```
sofia-voice-agent/
├── Dockerfile                          # raíz — para que Dokploy pueda buildear
├── .dockerignore                       # excluye app/, scripts/, .venv/
├── app/
│   ├── main.py                         # FastAPI + Modal app + cron outbound
│   ├── config.py                       # env vars
│   ├── outbound_worker.py              # ciclo de llamadas salientes
│   ├── services/
│   │   ├── supabase_service.py         # CRM + cálculo de costo telefonía
│   │   ├── retell_service.py           # multi-carrier outbound + costo Retell
│   │   ├── twilio_service.py           # SDK Twilio wrapper
│   │   └── anthropic_service.py        # análisis post-llamada
│   └── webhooks/
│       └── retell_handler.py           # call_started/ended/analyzed → guarda en DB
├── dashboard/                          # Webapp Next 16 (tema claro post-redesign)
│   ├── Dockerfile                      # multi-stage standalone build
│   ├── src/
│   │   ├── proxy.ts                    # ¡NO middleware.ts! Next 16 usa proxy.ts
│   │   ├── lib/
│   │   │   ├── supabase/{client,server,types}.ts
│   │   │   └── format.ts               # CLP, UF, USD, fechas TZ Santiago, offsetSantiago, toSantiagoISO
│   │   ├── components/
│   │   │   ├── topnav.tsx              # Top nav oscuro con tabs + drawer mobile (Montserrat)
│   │   │   ├── shell.tsx               # Layout = TopNav + main scroll
│   │   │   ├── lead-pills.tsx          # PillEstatus / PillTemp / PillPropEstado + ESTATUS_COLORS
│   │   │   └── ui/*                    # base shadcn (Label etc) — Button casi no se usa post-redesign
│   │   └── app/
│   │       ├── page.tsx                # Dashboard rediseñado: 4 KPIs + leads recientes + pipeline + actividad
│   │       ├── login/, signup/         # Tema claro
│   │       ├── leads/
│   │       │   ├── page.tsx            # Server: fetch leads → LeadsView
│   │       │   ├── leads-view.tsx      # Client: switcher Kanban/Tabla, search, mobile cards
│   │       │   ├── trigger-button.tsx  # Disparar outbound
│   │       │   ├── nuevo/page.tsx      # Form light
│   │       │   └── [id]/page.tsx       # LeadDetail: info + timeline llamadas + visitas + Sofia stats
│   │       ├── propiedades/
│   │       │   ├── page.tsx            # Server
│   │       │   ├── propiedades-view.tsx # Client: grid|tabla, chips de filtros
│   │       │   └── nueva/page.tsx      # Form light
│   │       ├── llamadas/page.tsx       # Tabla 9-col + mobile cards + carrier badge + Retell/Tel/Total
│   │       ├── visitas/{,nueva}/       # Lista + form light
│   │       ├── costos/page.tsx         # KPIs 24h + histórico + breakdown por carrier + detalle
│   │       └── api/trigger-outbound/route.ts
│   └── .env.local.example
├── scripts/
│   ├── create_retell_agent.py          # crea agente inbound (es-CL, Haiku, retell-Claudia)
│   ├── create_outbound_agent.py        # crea agente outbound
│   └── test_functions.py               # smoke test contra Supabase
├── docs/
│   └── TROUBLESHOOTING_SUPABASE_KONG.txt   # bug bridge-nf=1 documentado
├── supabase_schema.sql                 # schema base
├── supabase_fix_search_path.sql        # warning de seguridad de funciones
├── supabase_fix_fk_indexes.sql         # 3 índices FK
├── supabase_set_timezone.sql           # TZ default DB → America/Santiago
├── supabase_add_call_cost.sql          # columnas costo Retell + carrier_telephony
├── supabase_add_carrier.sql            # columna carrier + KPIs por carrier
├── supabase_seed_propiedades.sql       # 51 propiedades de prueba RM
├── DEPLOY_DOKPLOY.md
├── SETUP_CHILE.md
├── pyproject.toml
└── .env.example
```

## 4. Datos clave de localización Chile

- **Idioma**: español de Chile, **tutea por defecto**, sin "po"/"weón"/modismos coloquiales fuertes.
- **Comunas** (zona): Las Condes, Vitacura, Lo Barnechea, Providencia, Ñuñoa, La Reina, Santiago Centro, Huechuraba, Peñalolén, La Florida, Maipú, San Miguel, Macul.
- **Precios**: **UF** para venta, **CLP mensuales** para arriendo. Helpers en `dashboard/src/lib/format.ts` (`fmtUF`, `fmtCLP`, `fmtPrecio`, `fmtUSD`).
- **Teléfonos**: `+56 9 XXXX XXXX`.
- **Timezone**: `America/Santiago` con DST automático
  - Backend: `zoneinfo("America/Santiago")` en `supabase_service.py` (requiere `tzdata` en pip image)
  - Webapp: `toSantiagoISO()` y `offsetSantiago()` en `format.ts`
  - DB: `alter database postgres set timezone to 'America/Santiago'` aplicado
  - Retell agents con `timezone="America/Santiago"`
- **Tipos de propiedad**: Casa, Departamento, Parcela, Oficina, Local Comercial, Terreno, Bodega.
- **Operación**: Venta / Arriendo (NO "Renta").

## 5. Schema Supabase (ya aplicado en producción)

5 tablas + vista + enums tipados:
- `perfiles` (mirror de `auth.users` con `rol`, auto-creado por trigger en signup)
- `propiedades`, `leads`, `llamadas`, `visitas`
- Vista `kpi_resumen` con `security_invoker = on` — incluye 13 columnas (operacionales + costos Retell/Twilio + conteo por carrier)
- `llamadas` extendida con: `costo_retell_usd`, `costo_twilio_usd` (genérico telefonía), `costo_detalle` (jsonb), `carrier`
- Helpers SQL: `auth_rol()`, `es_admin()`, `set_updated_at()`, `handle_new_user()`, `twilio_rate_per_min()` — todas con `set search_path = ''`
- RLS: lectura abierta a autenticados; escritura admin (excepciones para ejecutivo dueño en `leads.update` y `visitas.update`)
- Backend Modal usa `SUPABASE_SERVICE_KEY` y bypassea RLS

## 6. Multi-carrier (Twilio + Telnyx)

Configurado vía env vars en `.env`:
```
PRIMARY_CARRIER=twilio       # twilio | telnyx
FALLBACK_CARRIER=            # vacío hoy; cuando Telnyx esté arriba: twilio
TWILIO_PHONE_NUMBER=+566009142119   # número productivo chileno (servicio 600)
TELNYX_PHONE_NUMBER=         # vacío — se llena cuando Telnyx apruebe Level 2
```

Lógica en `app/services/retell_service.create_outbound_call`: intenta `PRIMARY_CARRIER` y, si falla, retry con `FALLBACK_CARRIER` (si está seteado). Cada llamada queda registrada con su `carrier` real en `llamadas`.

Tarifas estimadas en `app/services/supabase_service.CARRIER_RATES`:
- Twilio: CL móvil $0.20/min · CL fijo $0.05/min
- Telnyx: CL móvil $0.08/min · CL fijo $0.03/min

## 7. Bug crítico ya resuelto: `bridge-nf-call-iptables=1`

Cuando se desplegó el Supabase self-hosted, Kong no podía llegar a PostgREST (`/rest/v1/*` colgaba 15s). La causa fue una combinación de iptables fantasma de UFW (no instalado pero quedaron las chains) + `bridge-nf-call-iptables=1` que enrutaba paquetes inter-container por iptables filter.

**Fix aplicado y persistente** en el host:
```
echo "net.bridge.bridge-nf-call-iptables=0" > /etc/sysctl.d/99-docker-bridge.conf
sysctl -p /etc/sysctl.d/99-docker-bridge.conf
```

Manual completo de troubleshooting en `docs/TROUBLESHOOTING_SUPABASE_KONG.txt` (incluye comandos diagnósticos con tcpdump y soluciones paso a paso para próximas instalaciones).

## 8. Comandos típicos

```bash
# Backend local
.venv/Scripts/activate                  # Git Bash en Windows
python scripts/test_functions.py        # smoke contra Supabase

# Webapp local
cd dashboard && npm run dev             # http://localhost:3000
cd dashboard && NEXT_PUBLIC_SUPABASE_URL=http://x NEXT_PUBLIC_SUPABASE_ANON_KEY=x npx --no-install next build

# Modal redeploy (cuando hay cambios en app/)
PYTHONIOENCODING=utf-8 PYTHONUTF8=1 .venv/Scripts/python.exe -m modal deploy app/main.py::modal_app

# Refresh Modal Secret (después de tocar .env)
modal secret create sofia-credentials --from-dotenv .env --force

# SQL contra Supabase (vía SSH al host Dokploy)
DB=$(docker ps --format '{{.Names}}' | grep "supabase.*db$" | head -1)
PG_PASS=$(grep "^POSTGRES_PASSWORD=" /root/supabase-creds.txt | cut -d= -f2-)
docker exec -e PGPASSWORD="$PG_PASS" $DB psql -U postgres -d postgres -c "..."

# Cargar SQL desde el repo público
curl -fsSL https://raw.githubusercontent.com/cespositom/agentsofi/main/<archivo>.sql -o /tmp/x.sql
docker cp /tmp/x.sql $DB:/tmp/x.sql
docker exec -e PGPASSWORD="$PG_PASS" $DB psql -U postgres -d postgres -f /tmp/x.sql
```

## 9. Convenciones / cosas a respetar en revisiones

### Backend / infra
- **No reintroducir Notion/Cal.com** ni dependencias.
- **Webapp = Next 16**: el archivo es `src/proxy.ts` con `export async function proxy(...)`. NO `middleware.ts`.
- Backend: cuando se agregan endpoints en `main.py`, importar dentro de la función — patrón existente para deferred import en Modal.
- Modal usa `image.add_local_python_source("app", copy=True)` — sin `copy=True` el package no se ve dentro del container.
- Strings en es-CL en prompts y UI; código y nombres de variables en inglés/español neutro.
- Secrets solo en `.env` y Modal Secret. Nunca hardcodear.
- Backend usa `SUPABASE_SERVICE_KEY` (RLS bypass). Webapp usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` (RLS aplica). NO exponer service key al cliente.
- Cron Modal: `outbound_cron` cada hora (`schedule=modal.Cron("0 * * * *")`), 10min timeout.
- **CREATE OR REPLACE VIEW**: solo permite agregar columnas al final, no reordenar. Si hay que cambiar la estructura → `DROP VIEW IF EXISTS ... CASCADE` primero.
- **TZ**: usar `zoneinfo("America/Santiago")` en backend y `toSantiagoISO()` en webapp. NO hardcodear `-04:00`.

### Webapp post-redesign (importante)
- **Tema claro**: usar tokens `var(--sofia-*)` (NO clases tailwind tipo `bg-neutral-950`, `text-amber-400`, `bg-white/[0.02]` — esos quedaron del tema dark viejo).
- **No usar `Button` de shadcn en CTAs principales** — desentona. Usar buttons inline con `style={{ background: "var(--sofia-accent)" }}` y clase `text-white text-sm font-semibold`. shadcn `Button` solo si es un botón secundario muy específico.
- **Pills de estatus**: importar `PillEstatus`, `PillTemp`, `PillPropEstado` desde `@/components/lead-pills`. NO renderizar pills inline.
- **Tablas responsive**: SIEMPRE pareja `hidden md:block` (table desktop) + `md:hidden` (cards mobile). NO dejar solo `overflow-x-auto` — en mobile se ve mal.
- **Cards**: usar clase `.sofia-card` (incluye padding, border, radius) en lugar de re-armar.
- **KPIs**: clase `.sofia-kpi` + estructura `<div className="sofia-kpi-lbl">…</div><div className="sofia-kpi-val font-mono">…</div>`.
- **Forms**: input pattern es `className={inputCls} style={inputStyle}` con `inputStyle = { border: "1px solid var(--sofia-border)", background: "var(--sofia-surface)", color: "var(--sofia-fg)" }`.
- **Topnav fuente**: solo Montserrat (CSS lo aplica vía `.sofia-topnav` selector). NO sobrescribir font-family en items del nav.
- **Headers de página**: `<h1 className="text-[15px] font-bold leading-tight">…</h1>` + subtítulo `<p className="text-xs" style={{ color: "var(--sofia-muted)" }}>`. NO usar `font-heading italic text-3xl` (era del tema viejo).
- **Pages que muestran datos por usuario** deben pasar `email={user?.email}` al `<Shell>` para que el topnav muestre el avatar.

## 10. Pendientes humanos

- [x] ~~**Twilio**: Add Funds USD 20 → habilitar Geo Permissions Chile~~ — cuenta fuera del trial; verificar igual que Geo Permissions Chile (Low + High Risk Special Services) estén habilitadas
- [x] ~~Provisionar número Chile productivo~~ — `+566009142119` (servicio 600) configurado en Twilio Elastic SIP Trunk + Retell Custom telephony
- [ ] **Smoke test outbound real** con lead Cesar Test (`+56982696258`) — confirmar fila en `llamadas` con `carrier=twilio` y costos > 0
- [ ] **Telnyx**: Level 2 Verification + crear SIP Connection + Outbound Voice Profile con Chile habilitado → pegar `TELNYX_PHONE_NUMBER` en `.env` + cambiar `PRIMARY_CARRIER=telnyx` y `FALLBACK_CARRIER=twilio`
- [ ] **Renombrar Modal App de opt2** (`sofia-voice-agent-opt2`) a `sofia-voice-agent-twenty` para eliminar el riesgo de pisar el deploy de opt1
- [ ] (opcional) Configurar Origination URI `sip:sip.retellai.com;transport=tcp` en el SIP trunk Twilio para activar inbound

## 11. Documentos de referencia

- `SETUP_CHILE.md` — guía completa de arranque y deploy
- `DEPLOY_DOKPLOY.md` — pasos exactos para Dokploy
- `docs/TROUBLESHOOTING_SUPABASE_KONG.txt` — bug bridge-nf y diagnóstico tcpdump
- `supabase_schema.sql` — único source-of-truth del schema
- `.env.example` y `dashboard/.env.local.example` — listado de env vars

## 12. Memoria global vinculada

Existe un memo global en `~/.claude/memory/sofia_voice_agent_chile.md` indexado en `~/.claude/MEMORY.md` con la información de alto nivel. Si hay conflicto, **este `CLAUDE.md` manda** (es el más cercano al código).
