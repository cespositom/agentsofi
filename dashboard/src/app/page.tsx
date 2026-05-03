import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/shell";
import { fmtFechaCL, fmtUSD } from "@/lib/format";
import type { KpiResumen, Llamada, Lead } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STAGES: { id: Lead["estatus"]; label: string; color: string }[] = [
  { id: "Pendiente de llamar", label: "Pendientes", color: "#2563EB" },
  { id: "En proceso",          label: "En proceso", color: "#D97706" },
  { id: "Cita agendada",       label: "Visitas",    color: "#059669" },
  { id: "Cerrado",             label: "Cerrados",   color: "#14532D" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [kpiRes, leadsRes, callsRes] = await Promise.all([
    supabase.from("kpi_resumen").select("*").single(),
    supabase
      .from("leads")
      .select("id,nombre,telefono,email,estatus,temperatura,comunas_interes,updated_at,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("llamadas")
      .select("id,nombre_lead,tipo,resultado,duracion_seg,sentimiento,costo_retell_usd,costo_twilio_usd,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const kpi = (kpiRes.data ?? null) as KpiResumen | null;
  const leads = (leadsRes.data ?? []) as Lead[];
  const calls = (callsRes.data ?? []) as Llamada[];
  const totalLeads = leads.length;

  const tiles = [
    {
      lbl: "Leads totales",
      val: totalLeads,
      delta: `${kpi?.leads_pendientes ?? 0} pendientes`,
      dir: "neu" as const,
    },
    {
      lbl: "Llamadas 24h",
      val: kpi?.llamadas_24h ?? 0,
      delta: `${kpi?.calls_telnyx_24h ?? 0} Telnyx · ${kpi?.calls_twilio_24h ?? 0} Twilio`,
      dir: "neu" as const,
    },
    {
      lbl: "Visitas próximas",
      val: kpi?.visitas_proximas ?? 0,
      delta: "agendadas",
      dir: "up" as const,
    },
    {
      lbl: "Gasto Sofía 24h",
      val: fmtUSD(kpi?.costo_24h_usd ?? 0),
      delta: `Retell ${fmtUSD(kpi?.costo_retell_24h_usd ?? 0)} · Tel ${fmtUSD(kpi?.costo_twilio_24h_usd ?? 0)}`,
      dir: "neu" as const,
    },
  ];

  return (
    <Shell email={user?.email}>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[15px] font-bold leading-tight">Dashboard</h1>
        <p className="text-xs" style={{ color: "var(--sofia-muted)" }}>
          Resumen del día
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {tiles.map((t) => (
          <div className="sofia-kpi" key={t.lbl}>
            <div className="sofia-kpi-lbl">{t.lbl}</div>
            <div className="sofia-kpi-val font-mono">{t.val}</div>
            <div
              className="text-[11px] mt-1.5"
              style={{
                color:
                  t.dir === "up"
                    ? "var(--sofia-success)"
                    : "var(--sofia-muted)",
              }}
            >
              {t.delta}
            </div>
          </div>
        ))}
      </div>

      {/* 2 columnas: leads + pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Leads recientes */}
        <div className="sofia-card">
          <div className="flex items-start justify-between mb-3.5">
            <div>
              <div className="text-[13px] font-semibold">
                Últimos leads captados
              </div>
              <div
                className="text-[11.5px] mt-0.5"
                style={{ color: "var(--sofia-muted)" }}
              >
                Últimos {Math.min(leads.length, 4)}
              </div>
            </div>
            <Link
              href="/leads"
              className="text-[11px] px-2.5 py-1 rounded-md border"
              style={{
                borderColor: "var(--sofia-border)",
                color: "var(--sofia-fg)",
              }}
            >
              Ver todos
            </Link>
          </div>
          <table className="sofia-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Contacto</th>
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 4).map((l) => (
                <tr key={l.id} className="row-link">
                  <td>
                    <div className="font-semibold">{l.nombre}</div>
                    <div
                      className="text-[12px]"
                      style={{ color: "var(--sofia-muted)" }}
                    >
                      {l.comunas_interes?.join(", ") || "—"}
                    </div>
                  </td>
                  <td>
                    <PillEstatus s={l.estatus} />
                  </td>
                  <td className="text-[12px]" style={{ color: "var(--sofia-muted)" }}>
                    {fmtFechaCL(l.updated_at)}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-6" style={{ color: "var(--sofia-muted)" }}>
                    Sin leads cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pipeline */}
        <div className="sofia-card">
          <div className="text-[13px] font-semibold mb-3.5">Pipeline por etapa</div>
          {STAGES.map((stg) => {
            const cnt = leads.filter((l) => l.estatus === stg.id).length;
            const pct = totalLeads > 0 ? Math.round((cnt / totalLeads) * 100) : 0;
            return (
              <div key={stg.id} className="mb-3">
                <div
                  className="flex items-center justify-between text-[12px]"
                  style={{ color: "var(--sofia-muted)" }}
                >
                  <span>{stg.label}</span>
                  <span className="font-mono">
                    {cnt} leads ({pct}%)
                  </span>
                </div>
                <div className="sofia-pbar">
                  <div
                    className="sofia-pfill"
                    style={{ width: `${pct}%`, background: stg.color }}
                  />
                </div>
              </div>
            );
          })}
          <div
            className="mt-3.5 pt-3 flex items-center gap-2"
            style={{ borderTop: "1px solid var(--sofia-border)" }}
          >
            <span className="sofia-pill sofia-pill-sofia">✦ Sofia activa</span>
            <span className="text-[12px]" style={{ color: "var(--sofia-muted)" }}>
              {kpi?.llamadas_24h ?? 0} llamadas en 24h
            </span>
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="sofia-card">
        <div className="flex items-start justify-between mb-3.5">
          <div>
            <div className="text-[13px] font-semibold">
              Actividad reciente de Sofia
            </div>
            <div
              className="text-[11.5px] mt-0.5"
              style={{ color: "var(--sofia-muted)" }}
            >
              Últimas interacciones del agente IA
            </div>
          </div>
          <Link
            href="/llamadas"
            className="text-[11px] px-2.5 py-1 rounded-md border"
            style={{
              borderColor: "var(--sofia-border)",
              color: "var(--sofia-fg)",
            }}
          >
            Ver registro completo
          </Link>
        </div>
        <table className="sofia-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Fecha</th>
              <th>Duración</th>
              <th>Costo</th>
              <th>Sentimiento</th>
            </tr>
          </thead>
          <tbody>
            {calls.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6" style={{ color: "var(--sofia-muted)" }}>
                  Sin llamadas todavía.
                </td>
              </tr>
            )}
            {calls.map((c) => {
              const total = (c.costo_retell_usd ?? 0) + (c.costo_twilio_usd ?? 0);
              return (
                <tr key={c.id}>
                  <td className="font-semibold">{c.nombre_lead || "—"}</td>
                  <td className="text-[12px]" style={{ color: "var(--sofia-muted)" }}>
                    {fmtFechaCL(c.created_at)}
                  </td>
                  <td className="font-mono text-[12px]">
                    {Math.floor(c.duracion_seg / 60)}:
                    {String(c.duracion_seg % 60).padStart(2, "0")}
                  </td>
                  <td className="font-mono text-[12px]">{fmtUSD(total)}</td>
                  <td>
                    <span
                      className="text-[11px] font-semibold"
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
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

function PillEstatus({ s }: { s: Lead["estatus"] }) {
  const map: Record<string, string> = {
    "Pendiente de llamar": "sofia-pill-nuevo",
    "En proceso": "sofia-pill-proceso",
    "Cita agendada": "sofia-pill-cita",
    "No contestado": "sofia-pill-pendiente",
    "Sin interés": "sofia-pill-perdido",
    "Cerrado": "sofia-pill-cerrado",
  };
  return <span className={`sofia-pill ${map[s] || ""}`}>{s}</span>;
}
