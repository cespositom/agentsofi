import { Shell } from "@/components/shell";
import { createClient } from "@/lib/supabase/server";
import { fmtUSD, fmtFechaCL } from "@/lib/format";
import type { KpiResumen, Llamada } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function CostosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [kpiRes, callsRes] = await Promise.all([
    supabase.from("kpi_resumen").select("*").single(),
    supabase
      .from("llamadas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const kpi = (kpiRes.data ?? null) as KpiResumen | null;
  const calls = (callsRes.data ?? []) as Llamada[];

  const totalMin =
    calls.reduce((s, c) => s + (c.duracion_seg || 0), 0) / 60;

  // Breakdown por carrier
  const byCarrier = calls.reduce(
    (acc, c) => {
      const k = (c.carrier ?? "twilio") as string;
      if (!acc[k]) acc[k] = { count: 0, retell: 0, tel: 0, min: 0 };
      acc[k].count += 1;
      acc[k].retell += Number(c.costo_retell_usd) || 0;
      acc[k].tel += Number(c.costo_twilio_usd) || 0;
      acc[k].min += (c.duracion_seg || 0) / 60;
      return acc;
    },
    {} as Record<
      string,
      { count: number; retell: number; tel: number; min: number }
    >
  );

  return (
    <Shell email={user?.email}>
      <div className="mb-5">
        <h1 className="text-[15px] font-bold leading-tight">
          Registro de uso y costos
        </h1>
        <p className="text-xs" style={{ color: "var(--sofia-muted)" }}>
          Todas las llamadas de Sofia AI · {calls.length} registros
        </p>
      </div>

      {/* KPIs últimas 24h */}
      <div className="mb-2 text-[10px] uppercase tracking-wider font-bold" style={{color:"var(--sofia-muted)"}}>
        Últimas 24 h
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {[
          { lbl: "Llamadas 24h", val: kpi?.llamadas_24h ?? 0 },
          { lbl: "Retell 24h", val: fmtUSD(kpi?.costo_retell_24h_usd ?? 0) },
          { lbl: "Telefonía 24h", val: fmtUSD(kpi?.costo_twilio_24h_usd ?? 0) },
          {
            lbl: "Total 24h",
            val: fmtUSD(kpi?.costo_24h_usd ?? 0),
            accent: true,
          },
        ].map((k) => (
          <div className="sofia-kpi" key={k.lbl}>
            <div className="sofia-kpi-lbl">{k.lbl}</div>
            <div
              className="sofia-kpi-val font-mono"
              style={k.accent ? { color: "var(--sofia-accent)" } : undefined}
            >
              {k.val}
            </div>
          </div>
        ))}
      </div>

      {/* KPIs histórico */}
      <div className="mb-2 text-[10px] uppercase tracking-wider font-bold" style={{color:"var(--sofia-muted)"}}>
        Histórico total
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {[
          { lbl: "Minutos totales", val: totalMin.toFixed(1) },
          { lbl: "Retell total", val: fmtUSD(kpi?.costo_retell_total_usd ?? 0) },
          {
            lbl: "Telefonía total",
            val: fmtUSD(kpi?.costo_twilio_total_usd ?? 0),
          },
          {
            lbl: "Total general",
            val: fmtUSD(kpi?.costo_total_usd ?? 0),
            accent: true,
          },
        ].map((k) => (
          <div className="sofia-kpi" key={k.lbl}>
            <div className="sofia-kpi-lbl">{k.lbl}</div>
            <div
              className="sofia-kpi-val font-mono"
              style={k.accent ? { color: "var(--sofia-accent)" } : undefined}
            >
              {k.val}
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown por carrier */}
      <div className="sofia-card mb-5">
        <div className="text-[13px] font-semibold mb-3">Desglose por carrier</div>
        <div className="overflow-x-auto">
          <table className="sofia-table min-w-[600px]">
            <thead>
              <tr>
                <th>Carrier</th>
                <th>Llamadas</th>
                <th>Minutos</th>
                <th>Retell</th>
                <th>Telefonía</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byCarrier).length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6" style={{ color: "var(--sofia-muted)" }}>
                    Sin llamadas registradas.
                  </td>
                </tr>
              )}
              {Object.entries(byCarrier).map(([carrier, v]) => (
                <tr key={carrier}>
                  <td>
                    <span
                      className="text-[10px] font-mono uppercase px-2 py-1 rounded"
                      style={{
                        background:
                          carrier === "telnyx"
                            ? "var(--sofia-purple-lt)"
                            : "var(--sofia-danger-lt)",
                        color:
                          carrier === "telnyx"
                            ? "var(--sofia-purple)"
                            : "var(--sofia-danger)",
                      }}
                    >
                      {carrier}
                    </span>
                  </td>
                  <td className="font-mono text-[13px]">{v.count}</td>
                  <td className="font-mono text-[13px]">{v.min.toFixed(1)}</td>
                  <td className="font-mono text-[13px]">{fmtUSD(v.retell)}</td>
                  <td className="font-mono text-[13px]">{fmtUSD(v.tel)}</td>
                  <td className="font-mono text-[13px] font-bold" style={{color:"var(--sofia-accent)"}}>
                    {fmtUSD(v.retell + v.tel)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle */}
      <div className="sofia-card">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[13px] font-semibold">Detalle de llamadas</div>
            <div className="text-[11.5px] mt-0.5" style={{ color: "var(--sofia-muted)" }}>
              {calls.length} registros (últimos 500)
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="sofia-table min-w-[700px]">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Fecha</th>
                <th>Duración</th>
                <th>Carrier</th>
                <th>Retell</th>
                <th>Telefonía</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {calls.slice(0, 100).map((c) => {
                const total =
                  (Number(c.costo_retell_usd) || 0) +
                  (Number(c.costo_twilio_usd) || 0);
                return (
                  <tr key={c.id}>
                    <td className="font-semibold">
                      {c.nombre_lead || c.titulo || "—"}
                    </td>
                    <td className="text-[12px]" style={{ color: "var(--sofia-muted)" }}>
                      {fmtFechaCL(c.created_at)}
                    </td>
                    <td className="font-mono text-[12px]">
                      {Math.floor(c.duracion_seg / 60)}:
                      {String(c.duracion_seg % 60).padStart(2, "0")}
                    </td>
                    <td className="text-[11px] font-mono" style={{ color: "var(--sofia-muted)" }}>
                      {c.carrier || "—"}
                    </td>
                    <td className="font-mono text-[12px]">
                      {fmtUSD(c.costo_retell_usd || 0)}
                    </td>
                    <td className="font-mono text-[12px]">
                      {fmtUSD(c.costo_twilio_usd || 0)}
                    </td>
                    <td className="font-mono text-[12px] font-bold" style={{color:"var(--sofia-accent)"}}>
                      {fmtUSD(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
