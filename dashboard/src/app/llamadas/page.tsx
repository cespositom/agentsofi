import { Shell } from "@/components/shell";
import { createClient } from "@/lib/supabase/server";
import { fmtFechaCL, fmtUSD } from "@/lib/format";
import type { Llamada } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function LlamadasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("llamadas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const calls = (data ?? []) as Llamada[];

  const totalRetell = calls.reduce(
    (s, c) => s + (Number(c.costo_retell_usd) || 0),
    0
  );
  const totalTel = calls.reduce(
    (s, c) => s + (Number(c.costo_twilio_usd) || 0),
    0
  );
  const totalMin = calls.reduce((s, c) => s + (c.duracion_seg || 0), 0) / 60;

  return (
    <Shell email={user?.email}>
      <div className="mb-5">
        <h1 className="text-[15px] font-bold leading-tight">Llamadas</h1>
        <p className="text-xs" style={{ color: "var(--sofia-muted)" }}>
          {calls.length} registros · {totalMin.toFixed(1)} minutos totales
        </p>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {[
          { lbl: "Llamadas", val: calls.length },
          { lbl: "Minutos totales", val: totalMin.toFixed(1) },
          { lbl: "Retell total", val: fmtUSD(totalRetell) },
          { lbl: "Telefonía total", val: fmtUSD(totalTel) },
        ].map((k) => (
          <div className="sofia-kpi" key={k.lbl}>
            <div className="sofia-kpi-lbl">{k.lbl}</div>
            <div className="sofia-kpi-val font-mono">{k.val}</div>
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-2 mb-4">
        {calls.length === 0 && (
          <div
            className="sofia-card text-center py-6 text-[12px]"
            style={{ color: "var(--sofia-muted)" }}
          >
            Sin llamadas todavía.
          </div>
        )}
        {calls.map((c) => {
          const total =
            (Number(c.costo_retell_usd) || 0) +
            (Number(c.costo_twilio_usd) || 0);
          return (
            <div key={c.id} className="sofia-card" style={{ padding: "14px 16px" }}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">
                    {c.nombre_lead || c.titulo || "—"}
                  </div>
                  <div className="text-[11px] font-mono" style={{ color: "var(--sofia-muted)" }}>
                    {c.telefono}
                  </div>
                </div>
                <span
                  className="sofia-pill"
                  style={{
                    background:
                      c.tipo === "Inbound"
                        ? "var(--sofia-success-lt)"
                        : "var(--sofia-accent-lt)",
                    color:
                      c.tipo === "Inbound"
                        ? "var(--sofia-success)"
                        : "var(--sofia-accent)",
                  }}
                >
                  {c.tipo === "Inbound" ? "📥" : "📤"} {c.tipo}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11.5px] mb-2">
                <span style={{ color: "var(--sofia-muted)" }}>
                  {fmtFechaCL(c.created_at)}
                </span>
                <span className="font-mono">
                  {Math.floor(c.duracion_seg / 60)}:
                  {String(c.duracion_seg % 60).padStart(2, "0")}
                </span>
              </div>
              <div
                className="flex items-center justify-between text-[11.5px] pt-2"
                style={{ borderTop: "1px solid var(--sofia-border)" }}
              >
                <span style={{ color: "var(--sofia-muted)" }}>
                  Retell {fmtUSD(c.costo_retell_usd || 0)} · Tel {fmtUSD(c.costo_twilio_usd || 0)}
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ color: "var(--sofia-accent)" }}
                >
                  {fmtUSD(total)}
                </span>
              </div>
              {(c.cita_agendada || c.carrier) && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {c.cita_agendada && (
                    <span className="sofia-pill sofia-pill-cita">Cita</span>
                  )}
                  {c.carrier && (
                    <span
                      className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded"
                      style={{
                        background:
                          c.carrier === "telnyx"
                            ? "var(--sofia-purple-lt)"
                            : "var(--sofia-danger-lt)",
                        color:
                          c.carrier === "telnyx"
                            ? "var(--sofia-purple)"
                            : "var(--sofia-danger)",
                      }}
                    >
                      {c.carrier}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block sofia-card overflow-x-auto">
        <table className="sofia-table min-w-[860px]">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Duración</th>
              <th>Carrier</th>
              <th>Retell</th>
              <th>Telefonía</th>
              <th>Total</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {calls.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-8"
                  style={{ color: "var(--sofia-muted)" }}
                >
                  Sin llamadas todavía.
                </td>
              </tr>
            )}
            {calls.map((c) => {
              const total =
                (Number(c.costo_retell_usd) || 0) +
                (Number(c.costo_twilio_usd) || 0);
              return (
                <tr key={c.id}>
                  <td className="font-semibold">
                    {c.nombre_lead || c.titulo || "—"}
                    <div
                      className="text-[11px] font-mono"
                      style={{ color: "var(--sofia-muted)" }}
                    >
                      {c.telefono}
                    </div>
                  </td>
                  <td>
                    <span
                      className="sofia-pill"
                      style={{
                        background:
                          c.tipo === "Inbound"
                            ? "var(--sofia-success-lt)"
                            : "var(--sofia-accent-lt)",
                        color:
                          c.tipo === "Inbound"
                            ? "var(--sofia-success)"
                            : "var(--sofia-accent)",
                      }}
                    >
                      {c.tipo === "Inbound" ? "📥" : "📤"} {c.tipo}
                    </span>
                  </td>
                  <td
                    className="text-[12px]"
                    style={{ color: "var(--sofia-muted)" }}
                  >
                    {fmtFechaCL(c.created_at)}
                  </td>
                  <td className="font-mono text-[12px]">
                    {Math.floor(c.duracion_seg / 60)}:
                    {String(c.duracion_seg % 60).padStart(2, "0")}
                  </td>
                  <td>
                    {c.carrier && (
                      <span
                        className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            c.carrier === "telnyx"
                              ? "var(--sofia-purple-lt)"
                              : "var(--sofia-danger-lt)",
                          color:
                            c.carrier === "telnyx"
                              ? "var(--sofia-purple)"
                              : "var(--sofia-danger)",
                        }}
                      >
                        {c.carrier}
                      </span>
                    )}
                  </td>
                  <td className="font-mono text-[12px]">
                    {fmtUSD(c.costo_retell_usd || 0)}
                  </td>
                  <td className="font-mono text-[12px]">
                    {fmtUSD(c.costo_twilio_usd || 0)}
                  </td>
                  <td
                    className="font-mono text-[12px] font-bold"
                    style={{ color: "var(--sofia-accent)" }}
                  >
                    {fmtUSD(total)}
                  </td>
                  <td>
                    {c.cita_agendada && (
                      <span className="sofia-pill sofia-pill-cita">Cita</span>
                    )}
                    {!c.cita_agendada && c.resultado && (
                      <span
                        className="text-[11px]"
                        style={{ color: "var(--sofia-muted)" }}
                      >
                        {c.resultado}
                      </span>
                    )}
                    <div
                      className="text-[10.5px] mt-0.5"
                      style={{
                        color:
                          c.sentimiento === "Positivo"
                            ? "var(--sofia-success)"
                            : c.sentimiento === "Negativo"
                              ? "var(--sofia-danger)"
                              : "var(--sofia-muted)",
                      }}
                    >
                      {c.sentimiento}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div
          className="border-t pt-3 mt-3 flex flex-wrap justify-end gap-5"
          style={{ borderColor: "var(--sofia-border)" }}
        >
          <span
            className="text-[12px]"
            style={{ color: "var(--sofia-muted)" }}
          >
            Total min:{" "}
            <span
              className="font-mono font-semibold"
              style={{ color: "var(--sofia-fg)" }}
            >
              {totalMin.toFixed(1)}
            </span>
          </span>
          <span
            className="text-[12px]"
            style={{ color: "var(--sofia-muted)" }}
          >
            Retell:{" "}
            <span
              className="font-mono font-semibold"
              style={{ color: "var(--sofia-fg)" }}
            >
              {fmtUSD(totalRetell)}
            </span>
          </span>
          <span
            className="text-[12px]"
            style={{ color: "var(--sofia-muted)" }}
          >
            Telefonía:{" "}
            <span
              className="font-mono font-semibold"
              style={{ color: "var(--sofia-fg)" }}
            >
              {fmtUSD(totalTel)}
            </span>
          </span>
          <span
            className="text-[12px]"
            style={{ color: "var(--sofia-muted)" }}
          >
            Total:{" "}
            <span
              className="font-mono font-semibold"
              style={{ color: "var(--sofia-accent)" }}
            >
              {fmtUSD(totalRetell + totalTel)}
            </span>
          </span>
        </div>
      </div>
    </Shell>
  );
}
