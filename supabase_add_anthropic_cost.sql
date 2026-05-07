-- Sofia Voice Agent — Agregar tracking de costo Anthropic por llamada.
-- Idempotente: usa IF NOT EXISTS, no rompe si ya existe.

ALTER TABLE public.llamadas
  ADD COLUMN IF NOT EXISTS costo_anthropic_usd numeric(10,4) DEFAULT 0;

COMMENT ON COLUMN public.llamadas.costo_anthropic_usd IS
  'Costo USD del análisis post-call con Claude (modelo Sonnet/Haiku via Anthropic API). Computado desde usage tokens del response.';

-- Recrear vista kpi_resumen incluyendo el costo Anthropic en el total.
-- DROP + CREATE porque CREATE OR REPLACE no permite agregar columnas en medio.
DROP VIEW IF EXISTS public.kpi_resumen CASCADE;

CREATE VIEW public.kpi_resumen
WITH (security_invoker = on)
AS
SELECT
  count(*)                                                       AS llamadas_total,
  count(*) FILTER (WHERE tipo = 'Inbound')                       AS llamadas_inbound,
  count(*) FILTER (WHERE tipo = 'Outbound')                      AS llamadas_outbound,
  count(*) FILTER (WHERE cita_agendada = true)                   AS citas_agendadas,
  COALESCE(sum(duracion_seg), 0)                                 AS duracion_total_seg,
  COALESCE(sum(costo_retell_usd), 0)                             AS costo_retell_total_usd,
  COALESCE(sum(costo_twilio_usd), 0)                             AS costo_telefonia_total_usd,
  COALESCE(sum(costo_anthropic_usd), 0)                          AS costo_anthropic_total_usd,
  COALESCE(sum(
    COALESCE(costo_retell_usd, 0) +
    COALESCE(costo_twilio_usd, 0) +
    COALESCE(costo_anthropic_usd, 0)
  ), 0)                                                          AS costo_total_usd,
  count(*) FILTER (WHERE carrier = 'twilio')                     AS llamadas_twilio,
  count(*) FILTER (WHERE carrier = 'telnyx')                     AS llamadas_telnyx
FROM public.llamadas;

COMMENT ON VIEW public.kpi_resumen IS
  'Resumen agregado de llamadas con costos desglosados (Retell + telefonía + Anthropic) y conteos por carrier.';

SELECT 'costo_anthropic_usd y kpi_resumen actualizados OK' AS resultado;
