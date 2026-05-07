-- Sofia Voice Agent — Agregar tracking de costo Modal por llamada.
-- Idempotente. Modal cobra por compute time (CPU/RAM) — esta columna almacena
-- una estimación configurable vía env MODAL_COST_PER_CALL_USD, que después
-- se reconcilia mensualmente contra el billing real de Modal.

ALTER TABLE public.llamadas
  ADD COLUMN IF NOT EXISTS costo_modal_usd numeric(10,4) DEFAULT 0;

COMMENT ON COLUMN public.llamadas.costo_modal_usd IS
  'Estimación de costo USD del compute Modal atribuido a esta llamada (webhooks + tool calls). Configurable via env MODAL_COST_PER_CALL_USD.';

-- Recrear vista kpi_resumen incluyendo Modal en todos los totales.
DROP VIEW IF EXISTS public.kpi_resumen CASCADE;

CREATE VIEW public.kpi_resumen
WITH (security_invoker = on) AS
SELECT
  -- Conteos generales
  (SELECT count(*) FROM public.leads
     WHERE estatus = 'Pendiente de llamar')                              AS leads_pendientes,
  (SELECT count(*) FROM public.leads
     WHERE temperatura = 'Hot')                                          AS leads_hot,
  (SELECT count(*) FROM public.visitas
     WHERE fecha_hora >= now()
       AND estado IN ('Solicitada','Confirmada'))                        AS visitas_proximas,
  (SELECT count(*) FROM public.llamadas
     WHERE created_at >= now() - interval '24 hours')                    AS llamadas_24h,
  (SELECT count(*) FROM public.propiedades
     WHERE disponible)                                                   AS propiedades_disponibles,

  -- Costos últimas 24 h
  (SELECT COALESCE(sum(costo_retell_usd), 0) FROM public.llamadas
     WHERE created_at >= now() - interval '24 hours')                    AS costo_retell_24h_usd,
  (SELECT COALESCE(sum(costo_twilio_usd), 0) FROM public.llamadas
     WHERE created_at >= now() - interval '24 hours')                    AS costo_twilio_24h_usd,
  (SELECT COALESCE(sum(costo_anthropic_usd), 0) FROM public.llamadas
     WHERE created_at >= now() - interval '24 hours')                    AS costo_anthropic_24h_usd,
  (SELECT COALESCE(sum(costo_modal_usd), 0) FROM public.llamadas
     WHERE created_at >= now() - interval '24 hours')                    AS costo_modal_24h_usd,
  (SELECT COALESCE(sum(
              COALESCE(costo_retell_usd, 0)
            + COALESCE(costo_twilio_usd, 0)
            + COALESCE(costo_anthropic_usd, 0)
            + COALESCE(costo_modal_usd, 0)), 0)
     FROM public.llamadas
     WHERE created_at >= now() - interval '24 hours')                    AS costo_24h_usd,

  -- Costos histórico
  (SELECT COALESCE(sum(costo_retell_usd), 0)
     FROM public.llamadas)                                               AS costo_retell_total_usd,
  (SELECT COALESCE(sum(costo_twilio_usd), 0)
     FROM public.llamadas)                                               AS costo_twilio_total_usd,
  (SELECT COALESCE(sum(costo_anthropic_usd), 0)
     FROM public.llamadas)                                               AS costo_anthropic_total_usd,
  (SELECT COALESCE(sum(costo_modal_usd), 0)
     FROM public.llamadas)                                               AS costo_modal_total_usd,
  (SELECT COALESCE(sum(
              COALESCE(costo_retell_usd, 0)
            + COALESCE(costo_twilio_usd, 0)
            + COALESCE(costo_anthropic_usd, 0)
            + COALESCE(costo_modal_usd, 0)), 0)
     FROM public.llamadas)                                               AS costo_total_usd,

  -- Conteo por carrier (últimas 24h)
  (SELECT count(*) FROM public.llamadas
     WHERE carrier = 'twilio'
       AND created_at >= now() - interval '24 hours')                    AS calls_twilio_24h,
  (SELECT count(*) FROM public.llamadas
     WHERE carrier = 'telnyx'
       AND created_at >= now() - interval '24 hours')                    AS calls_telnyx_24h;

COMMENT ON VIEW public.kpi_resumen IS
  'Resumen agregado: leads, visitas, llamadas, propiedades + costos 24h e histórico (Retell + telefonía + Anthropic + Modal).';

SELECT 'kpi_resumen recreada con costo_modal OK' AS resultado;
