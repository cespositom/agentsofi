# Deploy en Dokploy

Guía para desplegar la webapp `dashboard/` en Dokploy. El backend Python (`app/`) NO va en Dokploy — corre en Modal serverless aparte.

## Arquitectura

```
GitHub (cespositom/agentsofi)
         │
         └─► Dokploy ──► Webapp Next 16 (dashboard/Dockerfile)
                               │
                               ├──► Supabase self-hosted (CRM + Auth)
                               │
                               └──► Modal app (backend Sofía) — POST /trigger-outbound

Modal (deploy aparte vía CLI):
  modal deploy app/main.py
```

## Pasos en Dokploy

### 1. Crear aplicación
- **New → Application → Docker** (no Nixpacks, usamos nuestro Dockerfile)
- Nombre: `sofia-dashboard` (o el que prefieras)

### 2. Source
- **Provider**: GitHub
- **Repository**: `cespositom/agentsofi`
- **Branch**: `main`
- **Build context / Path**: `dashboard` ← importante, el Dockerfile vive ahí
- **Dockerfile**: `Dockerfile` (relativo al build context)
- **Auto-deploy**: ✅ on push a `main`

### 3. Build args (NEXT_PUBLIC_*)
> ⚠️ Las vars `NEXT_PUBLIC_*` se inlinean en el bundle del cliente, así que tienen que llegar como **build args**, no solo como env de runtime.

| Build Arg | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://spbsagtimb.cesmark.cl` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<anon key del Supabase>` |

### 4. Environment variables (runtime)
Solo las que usa el server (no expuestas al cliente):

| Env | Valor |
|---|---|
| `SUPABASE_SERVICE_KEY` | `<service_role key>` (solo si algún endpoint server lo necesitara — hoy ninguno lo usa) |
| `MODAL_API_URL` | URL del backend Modal, ej: `https://innovandohorizontes--sofia-voice-agent-api.modal.run` |
| `NEXT_PUBLIC_SUPABASE_URL` | misma de arriba (algunos paths la leen en runtime) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | misma de arriba |

### 5. Networking
- **Port**: `3000`
- **Domain**: el que te dé Dokploy (subdominio `traefik.me`) o uno propio
- **HTTPS**: activá Let's Encrypt si usas dominio propio

### 6. Deploy
- Click **Deploy**
- El primer build tarda ~3-5 min (npm ci + next build)
- Si falla por falta de los build args, revisá paso 3

## Verificación post-deploy

1. Abrir la URL → debería redirigir a `/login`
2. Crear cuenta en `/signup`
3. En SQL Editor del Supabase: `update public.perfiles set rol='admin' where email='tu@mail.cl';`
4. Refrescar → ver el dashboard con KPIs en cero

## Backend Modal (no es Dokploy)

```bash
# desde local
modal token new
modal secret create sofia-credentials --from-dotenv .env
modal deploy app/main.py
```

Después en Dokploy actualizar `MODAL_API_URL` con la URL que imprime `modal deploy` y redeploy.

## Re-deploy

Cualquier `git push` a `main` dispara build automático en Dokploy si dejaste auto-deploy activo. Para deploy manual: botón **Redeploy** en la UI de Dokploy.

## Troubleshooting

| Síntoma | Causa probable | Fix |
|---|---|---|
| Build falla "module not found @supabase/ssr" | `npm ci` falló por lockfile desactualizado | borrar `package-lock.json` local, `npm install`, commit, push |
| App carga pero `/login` muestra error de Supabase | Build args mal configurados (vars `undefined`) | revisar paso 3, redeploy con build cache invalidado |
| Trigger outbound da 502 | `MODAL_API_URL` no apunta al backend desplegado | verificar URL en runtime envs |
| 401 al iniciar sesión | Supabase Auth no permite ese email/password | revisar Auth → Providers en Supabase, habilitar Email |
| Image build falla por out-of-memory | Build de Next pesado en VPS chico | usar VPS con ≥2GB RAM o limitar workers en `next.config.ts` |
