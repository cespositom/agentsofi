# Sofía Voice Agent — Chile + Supabase (proyecto local)

> Guía de contexto para futuras sesiones de Claude Code que abran este proyecto.
> Este es un **fork muy modificado** de `santmun/sofia-voice-agent`. El upstream apunta a México con Notion + Cal.com; este fork apunta a Chile con Supabase self-hosted y webapp propia. **No reintroducir Notion ni Cal.com.**

## 0. Estado actual (al 2026-05-01) — pausado esperando Twilio

**TODO el sistema está desplegado y operativo a nivel software**. La única razón por la que Sofía no está atendiendo llamadas en producción todavía es que **Twilio Trial bloquea outbound a Chile**. El próximo paso es:

1. **Activar billing en Twilio** (https://console.twilio.com/us1/billing/manage-billing → Add Funds USD 20)
2. **Habilitar Geographic Permissions Chile** (Low Risk + High Risk Special Services) — solo aparece como opción cuando la cuenta sale del trial
3. (En paralelo) Iniciar **Telnyx Level 2 Verification** para tener carrier secundario más barato (~$0.08/min vs $0.20 Twilio)

Una vez activo Twilio paid, el sistema funciona end-to-end sin tocar más código. Multi-carrier ya está implementado y listo para activar Telnyx cuando llegue su aprobación (solo cambiar 3 env vars + redeploy Modal).

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
- **SIP Trunk Twilio configurado** en Retell apuntando al `+16184271591` (Twilio trial US)
- **`+56982696258`** verificado como Caller ID en Twilio Trial

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
├── dashboard/                          # Webapp Next 16
│   ├── Dockerfile                      # multi-stage standalone build
│   ├── src/
│   │   ├── proxy.ts                    # ¡NO middleware.ts! Next 16 usa proxy.ts
│   │   ├── lib/
│   │   │   ├── supabase/{client,server,types}.ts
│   │   │   └── format.ts               # CLP, UF, fechas TZ Santiago, USD, offsetSantiago, toSantiagoISO
│   │   ├── components/{shell,sidebar,ui/*}
│   │   └── app/
│   │       ├── page.tsx                # dashboard KPIs (incluye sección costos)
│   │       ├── login/, signup/
│   │       ├── leads/{,nuevo}/
│   │       ├── propiedades/{,nueva}/
│   │       ├── llamadas/                # con CallCostBreakdown ámbar
│   │       ├── visitas/{,nueva}/
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
TWILIO_PHONE_NUMBER=+1XXXX   # ya configurado
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

- **No reintroducir Notion/Cal.com** ni dependencias.
- **Webapp = Next 16**: el archivo es `src/proxy.ts` con `export async function proxy(...)`. NO `middleware.ts`.
- **Tailwind 4** + base-ui: `Button` no soporta `asChild`. Para enlaces que parecen botón usar `<Link className={buttonVariants(...)}>`.
- Backend: cuando se agregan endpoints en `main.py`, importar dentro de la función — patrón existente para deferred import en Modal.
- Modal usa `image.add_local_python_source("app", copy=True)` — sin `copy=True` el package no se ve dentro del container.
- Strings en es-CL en prompts y UI; código y nombres de variables en inglés/español neutro.
- Secrets solo en `.env` y Modal Secret. Nunca hardcodear.
- Backend usa `SUPABASE_SERVICE_KEY` (RLS bypass). Webapp usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` (RLS aplica). NO exponer service key al cliente.
- Cron Modal: `outbound_cron` cada hora (`schedule=modal.Cron("0 * * * *")`), 10min timeout.
- **CREATE OR REPLACE VIEW**: solo permite agregar columnas al final, no reordenar. Si hay que cambiar la estructura → `DROP VIEW IF EXISTS ... CASCADE` primero.
- **TZ**: usar `zoneinfo("America/Santiago")` en backend y `toSantiagoISO()` en webapp. NO hardcodear `-04:00`.

## 10. Pendientes humanos

- [ ] **Twilio**: Add Funds USD 20 → habilitar Geo Permissions Chile (Low + High Risk Special Services)
- [ ] **Telnyx**: Level 2 Verification + crear SIP Connection + Outbound Voice Profile con Chile habilitado → pegar `TELNYX_PHONE_NUMBER` en `.env` + cambiar `PRIMARY_CARRIER=telnyx` y `FALLBACK_CARRIER=twilio`
- [ ] Probar llamada outbound real una vez activado Twilio paid (lead Cesar Test +56982696258 ya pre-cargado en estado Pendiente de llamar)
- [ ] (opcional) Migrar a un número Chile real para mejor caller-ID (Voiso/Entel/contrato local)
- [ ] (opcional) Configurar Origination URI `sip:sip.retellai.com;transport=tcp` en el SIP trunk Twilio para activar inbound

## 11. Documentos de referencia

- `SETUP_CHILE.md` — guía completa de arranque y deploy
- `DEPLOY_DOKPLOY.md` — pasos exactos para Dokploy
- `docs/TROUBLESHOOTING_SUPABASE_KONG.txt` — bug bridge-nf y diagnóstico tcpdump
- `supabase_schema.sql` — único source-of-truth del schema
- `.env.example` y `dashboard/.env.local.example` — listado de env vars

## 12. Memoria global vinculada

Existe un memo global en `~/.claude/memory/sofia_voice_agent_chile.md` indexado en `~/.claude/MEMORY.md` con la información de alto nivel. Si hay conflicto, **este `CLAUDE.md` manda** (es el más cercano al código).
