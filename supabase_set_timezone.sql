-- ═══════════════════════════════════════════════════════════════
-- Configurar zona horaria default del DB a America/Santiago
-- Aplica a:
--  - now() / current_timestamp visualizados en queries (siguen guardándose en UTC)
--  - default cuando insertás un timestamp sin TZ explícita
-- No afecta filas ya guardadas (timestamptz siempre internamente UTC).
-- ═══════════════════════════════════════════════════════════════

alter database postgres set timezone to 'America/Santiago';

-- Para que la sesión actual también lo aplique (sino requiere reconectar):
set time zone 'America/Santiago';

-- Verificación
show timezone;
select now() as ahora_chile, now() at time zone 'utc' as ahora_utc;
