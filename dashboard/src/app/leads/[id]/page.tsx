import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { createClient } from "@/lib/supabase/server";
import { PillEstatus, PillTemp } from "@/components/lead-pills";
import { fmtFechaCL, fmtUF, fmtCLP, fmtUSD } from "@/lib/format";
import type { Lead, Llamada, Visita } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function presupuesto(l: Lead) {
  if (!l.presupuesto) return "—";
  return l.operacion_buscada === "Arriendo"
    ? `${fmtCLP(l.presupuesto)}/mes`
    : fmtUF(l.presupuesto);
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [leadRes, callsRes, visitasRes] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).single(),
    supabase
      .from("llamadas")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("visitas")
      .select("*,propiedad:propiedades(id,nombre,comuna)")
      .eq("lead_id", id)
      .order("fecha_hora", { ascending: false })
      .limit(20),
  ]);

  const lead = leadRes.data as Lead | null;
  if (!lead) return notFound();

  const calls = (callsRes.data ?? []) as Llamada[];
  const visitas = (visitasRes.data ?? []) as unknown as Visita[];

  const totalRetell = calls.reduce(
    (s, c) => s + (Number(c.costo_retell_usd) || 0),
    0
  );
  const totalTel = calls.reduce(
    (s, c) => s + (Number(c.costo_twilio_usd) || 0),
    0
  );
  const totalAi = calls.reduce(
    (s, c) => s + (Number(c.costo_anthropic_usd) || 0),
    0
  );
  const totalModal = calls.reduce(
    (s, c) => s + (Number(c.costo_modal_usd) || 0),
    0
  );
  const totalCost = totalRetell + totalTel + totalAi + totalModal;
  const totalMin = calls.reduce((s, c) => s + (c.duracion_seg || 0), 0) / 60;

  return (
    <Shell email={user?.email}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <Link
            href="/leads"
            className="px-2.5 py-1 rounded-md border text-[11px]"
            style={{
              borderColor: "var(--sofia-border)",
              color: "var(--sofia-muted)",
            }}
          >
            ← Volver
          </Link>
          <div>
            <h1 className="text-[15px] font-bold leading-tight">
              {lead.nombre}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <PillEstatus s={lead.estatus} />
              <PillTemp t={lead.temperatura} />
              <span
                className="text-[12px]"
                style={{ color: "var(--sofia-muted)" }}
              >
                Fuente: {lead.fuente || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        {/* Columna izquierda */}
        <div className="flex flex-col gap-4">
          {/* Info */}
          <div className="sofia-card">
            <div className="text-[13px] font-semibold mb-3">
              Información del lead
            </div>
            {[
              ["Teléfono", <span key="t" className="font-mono">{lead.telefono}</span>],
              ["Email", lead.email || "—"],
              ["Presupuesto", presupuesto(lead)],
              [
                "Operación",
                lead.operacion_buscada || "—",
              ],
              ["Comunas interés", lead.comunas_interes?.join(", ") || "—"],
              ["Tipos buscados", lead.tipos_buscados?.join(", ") || "—"],
              ["Notas", lead.notas || "—"],
              ["Siguiente acción", lead.siguiente_accion || "—"],
              ["Intentos contacto", String(lead.intentos)],
              ["Creado", fmtFechaCL(lead.created_at)],
              ["Actualizado", fmtFechaCL(lead.updated_at)],
            ].map(([lbl, val]) => (
              <div
                key={lbl as string}
                className="flex items-start gap-3 py-2"
                style={{ borderBottom: "1px solid var(--sofia-border)" }}
              >
                <span
                  className="text-[11.5px] w-32 shrink-0"
                  style={{ color: "var(--sofia-muted)" }}
                >
                  {lbl}
                </span>
                <span className="text-[13px]">{val}</span>
              </div>
            ))}
          </div>

          {/* Resumen IA si existe */}
          {lead.resumen_ia && (
            <div className="sofia-card">
              <div className="text-[13px] font-semibold mb-3">
                Resumen IA (post-llamada)
              </div>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: "var(--sofia-fg)" }}
              >
                {lead.resumen_ia}
              </p>
            </div>
          )}

          {/* Historial llamadas — timeline */}
          <div className="sofia-card">
            <div className="flex items-start justify-between mb-3">
              <div className="text-[13px] font-semibold">
                Historial de llamadas
              </div>
              <span
                className="text-[12px] font-mono"
                style={{ color: "var(--sofia-muted)" }}
              >
                {calls.length} llamadas
              </span>
            </div>
            {calls.length === 0 ? (
              <div
                className="text-[13px]"
                style={{ color: "var(--sofia-muted)" }}
              >
                Sin llamadas registradas todavía.
              </div>
            ) : (
              <ul
                className="relative pl-7"
                style={{}}
              >
                <span
                  aria-hidden
                  className="absolute left-2 top-1.5 bottom-0 w-px"
                  style={{ background: "var(--sofia-border)" }}
                />
                {calls.map((c) => (
                  <li key={c.id} className="relative pb-4 last:pb-0">
                    <span
                      className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2"
                      style={{
                        background: "var(--sofia-purple)",
                        borderColor: "var(--sofia-surface)",
                      }}
                    />
                    <div
                      className="text-[11px] mb-1"
                      style={{ color: "var(--sofia-muted)" }}
                    >
                      {fmtFechaCL(c.created_at)}
                    </div>
                    <div
                      className="rounded-md p-3"
                      style={{
                        background: "var(--sofia-bg)",
                        border: "1px solid var(--sofia-border)",
                      }}
                    >
                      <div className="text-[12px] font-semibold mb-1">
                        ✦ Sofia AI — {c.tipo} ·{" "}
                        <span className="font-mono">
                          {Math.floor(c.duracion_seg / 60)}:
                          {String(c.duracion_seg % 60).padStart(2, "0")}
                        </span>
                        {(c.costo_retell_usd > 0 ||
                          c.costo_twilio_usd > 0 ||
                          c.costo_anthropic_usd > 0 ||
                          c.costo_modal_usd > 0) && (
                          <span
                            className="ml-2 font-mono text-[11px]"
                            style={{ color: "var(--sofia-muted)" }}
                          >
                            ·{" "}
                            {fmtUSD(
                              (c.costo_retell_usd || 0) +
                                (c.costo_twilio_usd || 0) +
                                (c.costo_anthropic_usd || 0) +
                                (c.costo_modal_usd || 0)
                            )}
                          </span>
                        )}
                      </div>
                      {c.resumen && (
                        <p
                          className="text-[11.5px] leading-relaxed"
                          style={{ color: "var(--sofia-muted)" }}
                        >
                          {c.resumen}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {c.resultado && (
                          <span
                            className="text-[11px]"
                            style={{ color: "var(--sofia-muted)" }}
                          >
                            {c.resultado}
                          </span>
                        )}
                        {c.cita_agendada && (
                          <span className="sofia-pill sofia-pill-cita">
                            Cita
                          </span>
                        )}
                        {c.carrier && (
                          <span
                            className="text-[10px] font-mono"
                            style={{ color: "var(--sofia-muted)" }}
                          >
                            {c.carrier}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-4">
          {/* Próxima acción */}
          <div
            className="sofia-card"
            style={{ borderLeft: "3px solid var(--sofia-accent)" }}
          >
            <div className="text-[13px] font-semibold mb-3">Próxima acción</div>
            {lead.estatus === "Cita agendada" ? (
              <div
                className="rounded-md px-3 py-2.5 mb-3"
                style={{ background: "var(--sofia-success-lt)" }}
              >
                <div
                  className="font-semibold text-[13px]"
                  style={{ color: "var(--sofia-success)" }}
                >
                  ✓ Visita agendada
                </div>
                {visitas[0] && (
                  <>
                    <div
                      className="text-[12px] mt-1"
                      style={{ color: "var(--sofia-muted)" }}
                    >
                      {fmtFechaCL(visitas[0].fecha_hora)}
                    </div>
                    {visitas[0].propiedad && (
                      <div
                        className="text-[12px]"
                        style={{ color: "var(--sofia-muted)" }}
                      >
                        {visitas[0].propiedad.nombre} ·{" "}
                        {visitas[0].propiedad.comuna}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div
                className="rounded-md px-3 py-2.5 mb-3"
                style={{ background: "var(--sofia-accent-lt)" }}
              >
                <div
                  className="font-semibold text-[13px]"
                  style={{ color: "var(--sofia-accent)" }}
                >
                  Seguimiento pendiente
                </div>
                <div
                  className="text-[12px] mt-1"
                  style={{ color: "var(--sofia-muted)" }}
                >
                  {lead.siguiente_accion ||
                    "Sofía llamará en el próximo ciclo outbound"}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Link
                href="/visitas/nueva"
                className="px-3 py-1.5 rounded-md text-[11px] font-semibold border"
                style={{
                  borderColor: "var(--sofia-border)",
                  color: "var(--sofia-fg)",
                }}
              >
                Agendar visita
              </Link>
            </div>
          </div>

          {/* Visitas asociadas */}
          {visitas.length > 0 && (
            <div className="sofia-card">
              <div className="text-[13px] font-semibold mb-3">
                Visitas ({visitas.length})
              </div>
              {visitas.map((v) => (
                <div
                  key={v.id}
                  className="py-2"
                  style={{ borderBottom: "1px solid var(--sofia-border)" }}
                >
                  <div className="text-[13px] font-semibold">
                    {v.propiedad?.nombre || "—"}
                  </div>
                  <div
                    className="text-[12px]"
                    style={{ color: "var(--sofia-muted)" }}
                  >
                    {fmtFechaCL(v.fecha_hora)} · {v.estado}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sofia stats para este lead */}
          <div className="sofia-card">
            <div className="text-[13px] font-semibold mb-3">
              Sofia para este lead
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--sofia-purple)" }}
              />
              <span
                className="text-[12px]"
                style={{ color: "var(--sofia-muted)" }}
              >
                {calls.length} llamadas · {totalMin.toFixed(1)} min
              </span>
            </div>
            <div
              className="text-[12px] mb-3"
              style={{ color: "var(--sofia-muted)" }}
            >
              Inversión total:{" "}
              <span
                className="font-mono font-semibold"
                style={{ color: "var(--sofia-fg)" }}
              >
                {fmtUSD(totalCost)}
              </span>
              <div
                className="text-[10px] mt-1"
                style={{ color: "var(--sofia-muted)" }}
              >
                Retell {fmtUSD(totalRetell)} · Telefonía {fmtUSD(totalTel)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
