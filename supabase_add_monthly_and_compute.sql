-- Sofia Voice Agent — D + E:
-- D) Vista de costos agregados por mes calendario (últimos 12).
-- E) Tracking real de compute time Modal por llamada (segundos acumulados
--    desde los webhooks). costo_modal_usd se actualiza desde compute_modal_seg
--    × MODAL_RATE_USD_PER_CPU_SEC en el handler. Si no hay tracking real,
--    fallback al MODAL_COST_PER_CALL_USD fijo.

-- E) compute time tracking
ALTER TABLE public.llamadas
  ADD COLUMN IF NOT EXISTS compute_modal_seg numeric(10,4) DEFAULT 0;

COMMENT ON COLUMN public.llamadas.compute_modal_seg IS
  'Segundos de compute Modal acumulados por la llamada (suma de webhooks call_started/ended/analyzed). Multiplicar por MODAL_RATE_USD_PER_CPU_SEC para obtener costo USD.';

-- D) Vista costos por mes calendario
DROP VIEW IF EXISTS public.costos_por_mes CASCADE;

CREATE VIEW public.costos_por_mes
WITH (security_invoker = on) AS
SELECT
  to_char(date_trunc('month', created_at AT TIME ZONE 'America/Santiago'), 'YYYY-MM')
                                                              AS mes,
  date_trunc('month', created_at AT TIME ZONE 'America/Santiago')
                                                              AS mes_inicio,
  count(*)                                                    AS llamadas,
  COALESCE(sum(duracion_seg), 0)                              AS duracion_total_seg,
  COALESCE(sum(costo_retell_usd), 0)                          AS costo_retell_usd,
  COALESCE(sum(costo_twilio_usd), 0)                          AS costo_twilio_usd,
  COALESCE(sum(costo_anthropic_usd), 0)                       AS costo_anthropic_usd,
  COALESCE(sum(costo_modal_usd), 0)                           AS costo_modal_usd,
  COALESCE(sum(
      COALESCE(costo_retell_usd, 0)
    + COALESCE(costo_twilio_usd, 0)
    + COALESCE(costo_anthropic_usd, 0)
    + COALESCE(costo_modal_usd, 0)
  ), 0)                                                       AS costo_total_usd
FROM public.llamadas
WHERE created_at >= now() - interval '12 months'
GROUP BY 1, 2
ORDER BY 2 DESC;

COMMENT ON VIEW public.costos_por_mes IS
  'Agregado mensual de llamadas y costos (últimos 12 meses calendario, TZ Santiago).';

SELECT 'compute_modal_seg + costos_por_mes OK' AS resultado;
