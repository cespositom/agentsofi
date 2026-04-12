# Sofía — Agente de Voz IA para Inmobiliarias

Sistema completo de agente de voz con inteligencia artificial para negocios inmobiliarios. Sofía contesta llamadas, busca propiedades, registra leads, agenda visitas y genera resúmenes automáticos con IA — todo sin intervención humana.

**Video tutorial completo:** [YouTube — Horizontes IA](https://youtube.com/@horizontesia)

## Qué incluye

- **Agente inbound** — Contesta llamadas, califica leads, busca propiedades en el CRM
- **Agente outbound** — Llama automáticamente a leads pendientes con contexto personalizado
- **CRM en Notion** — Bases de datos de propiedades, leads e historial de llamadas
- **Resumen post-llamada** — Claude analiza la transcripción y genera resumen + lead scoring
- **Worker automático** — Cron cada hora que llama a leads pendientes
- **Dashboard** — Panel de analíticas con Next.js y shadcn/ui

## Stack

| Servicio | Uso |
|----------|-----|
| [Retell AI](https://retellai.com) | Agente de voz (STT + LLM + TTS) |
| [Modal](https://modal.com) | Backend serverless (Python) |
| [Twilio](https://twilio.com) | Número telefónico + SIP trunk |
| [Notion](https://notion.so) | CRM (propiedades, leads, llamadas) |
| [Cal.com](https://cal.com) | Agendado de visitas |
| [Claude](https://anthropic.com) | Análisis post-llamada con Sonnet 4.5 |
| [Next.js](https://nextjs.org) | Dashboard de analíticas |

## Instalación con Claude Code

La forma más rápida de levantar este proyecto es con [Claude Code](https://claude.ai/code).

### 1. Clona el repositorio

```bash
git clone https://github.com/santmun/sofia-voice-agent.git
cd sofia-voice-agent
```

### 2. Abre Claude Code

```bash
claude
```

### 3. Pídele que te guíe

Copia y pega esto en Claude Code:

```
Acabo de clonar el repo sofia-voice-agent. Necesito que me ayudes a configurarlo paso a paso:

1. Ayúdame a crear las cuentas en cada servicio (Retell AI, Twilio, Modal, Notion, Cal.com, Anthropic)
2. Cuando tenga las credenciales, crea el .env
3. Crea las bases de datos del CRM en Notion
4. Crea el agente de voz en Retell
5. Conecta el número de Twilio con el agente
6. Despliega las automatizaciones en Modal
7. Levanta el dashboard

Lee el CLAUDE.md y el .env.example para entender la estructura del proyecto.
```

Claude Code leerá el código, entenderá la arquitectura y te irá pidiendo cada credencial conforme la necesite.

### 4. Cuentas que necesitas crear

| Servicio | URL | Plan gratis |
|----------|-----|-------------|
| Retell AI | [retellai.com/signup](https://app.retellai.com/signup) | 60 min de llamadas |
| Twilio | [twilio.com/try-twilio](https://www.twilio.com/try-twilio) | $15 USD crédito |
| Modal | [modal.com/signup](https://modal.com/signup) | $30/mes en compute |
| Notion | [notion.so/profile/integrations](https://www.notion.so/profile/integrations) | API gratis |
| Cal.com | [cal.com/signup](https://app.cal.com/signup) | Plan gratis |
| Anthropic | [console.anthropic.com](https://console.anthropic.com/) | $5 USD crédito |

## Estructura del proyecto

```
sofia-voice-agent/
├── app/                    # Backend (Python + Modal)
│   ├── main.py             # Endpoints FastAPI en Modal
│   ├── config.py            # Variables de entorno
│   ├── outbound_worker.py   # Worker automático outbound
│   ├── services/            # Servicios (Notion, Retell, Twilio, Cal.com, Claude)
│   └── webhooks/            # Handlers de webhooks (Retell, Twilio)
├── dashboard/              # Frontend (Next.js + shadcn/ui)
│   └── src/
│       ├── app/             # Páginas (analíticas, leads, llamadas, config)
│       └── lib/             # Clientes de Notion y Retell
├── scripts/                # Scripts de setup (crear agentes en Retell)
├── .env.example            # Template de variables de entorno
└── pyproject.toml          # Dependencias Python
```

## Arquitectura

```
Cliente llama → Twilio (SIP) → Retell (Sofía habla) → Modal (busca propiedades, registra lead)
                                     ↓ al colgar
                              Claude Sonnet 4.5
                           (resumen + lead scoring)
                                     ↓
                              Notion CRM se actualiza solo

Worker cada hora → Notion (leads pendientes) → Retell (Sofía llama) → mismas automatizaciones
```

## Comunidad

¿Quieres aprender a vender este sistema a negocios por $2,500+ USD?

Únete a **Horizontes IA** → [iahorizontesacademy.com](https://iahorizontesacademy.com)

---

Hecho con Claude Code por [Santiago Muñoz](https://github.com/santmun) — Horizontes IA
