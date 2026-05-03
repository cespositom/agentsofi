import Link from "next/link";
import { Shell } from "@/components/shell";
import { createClient } from "@/lib/supabase/server";
import { fmtFechaCL } from "@/lib/format";
import type { Visita } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const ESTADO_PILL: Record<string, string> = {
  Solicitada: "sofia-pill-pendiente",
  Confirmada: "sofia-pill-disponible",
  Realizada: "sofia-pill-cita",
  Cancelada: "sofia-pill-perdido",
  "No-show": "sofia-pill-warm",
};

export default async function VisitasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("visitas")
    .select(
      "*,lead:leads(id,nombre,telefono),propiedad:propiedades(id,nombre,comuna)"
    )
    .order("fecha_hora", { ascending: true })
    .limit(200);
  const visitas = (data ?? []) as unknown as Visita[];

  const proximas = visitas.filter((v) => new Date(v.fecha_hora) >= new Date());
  const pasadas = visitas
    .filter((v) => new Date(v.fecha_hora) < new Date())
    .reverse();

  return (
    <Shell email={user?.email}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[15px] font-bold leading-tight">Visitas</h1>
          <p className="text-xs" style={{ color: "var(--sofia-muted)" }}>
            {visitas.length} totales · {proximas.length} próximas
          </p>
        </div>
        <Link
          href="/visitas/nueva"
          className="px-3 py-1.5 rounded-md text-[11px] font-semibold text-white"
          style={{ background: "var(--sofia-accent)" }}
        >
          + Agendar visita
        </Link>
      </div>

      <Section title="Próximas" visitas={proximas} highlight />
      <Section title="Historial" visitas={pasadas} />
    </Shell>
  );
}

function Section({
  title,
  visitas,
  highlight,
}: {
  title: string;
  visitas: Visita[];
  highlight?: boolean;
}) {
  return (
    <div className="mb-5">
      <h2
        className="text-[13px] font-semibold mb-3"
        style={highlight ? {} : { color: "var(--sofia-muted)" }}
      >
        {title} ({visitas.length})
      </h2>
      {visitas.length === 0 ? (
        <p
          className="text-[12px] py-4"
          style={{ color: "var(--sofia-muted)" }}
        >
          Sin visitas.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {visitas.map((v) => (
            <div
              key={v.id}
              className="rounded-md px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              style={{
                background: "var(--sofia-surface)",
                border: "1px solid var(--sofia-border)",
              }}
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium truncate">
                  {v.lead?.nombre || "Sin lead"}
                  {v.propiedad?.nombre && (
                    <span style={{ color: "var(--sofia-muted)" }}>
                      {" "}
                      · {v.propiedad.nombre} ({v.propiedad.comuna})
                    </span>
                  )}
                </p>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--sofia-muted)" }}
                >
                  {fmtFechaCL(v.fecha_hora)} · {v.duracion_min}min
                  {v.lead?.telefono && (
                    <span className="font-mono"> · {v.lead.telefono}</span>
                  )}
                </p>
              </div>
              <span
                className={`sofia-pill ${ESTADO_PILL[v.estado] ?? ""}`}
              >
                {v.estado}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
