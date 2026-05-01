import Link from "next/link";
import { Shell } from "@/components/shell";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { fmtFechaCL } from "@/lib/format";
import type { Visita } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const estadoColors: Record<string, string> = {
  Solicitada: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Confirmada: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Realizada: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Cancelada: "bg-red-500/20 text-red-400 border-red-500/30",
  "No-show": "bg-orange-500/20 text-orange-400 border-orange-500/30",
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
  const pasadas = visitas.filter((v) => new Date(v.fecha_hora) < new Date());

  return (
    <Shell email={user?.email}>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl italic tracking-tight">Visitas</h1>
          <p className="text-sm text-neutral-500">{visitas.length} totales</p>
        </div>
        <Link href="/visitas/nueva" className={buttonVariants()}>
          + Agendar visita
        </Link>
      </div>

      <Section title={`Próximas (${proximas.length})`} visitas={proximas} />
      <Section title={`Historial (${pasadas.length})`} visitas={pasadas.reverse()} />
    </Shell>
  );
}

function Section({ title, visitas }: { title: string; visitas: Visita[] }) {
  return (
    <div className="mb-8">
      <h2 className="font-heading italic text-lg mb-3">{title}</h2>
      {visitas.length === 0 ? (
        <p className="text-sm text-neutral-600 py-4">Sin visitas.</p>
      ) : (
        <div className="space-y-2">
          {visitas.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm">
                  {v.lead?.nombre || "Sin lead"}
                  {v.propiedad?.nombre && (
                    <span className="text-neutral-500">
                      {" "}
                      · {v.propiedad.nombre} ({v.propiedad.comuna})
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {fmtFechaCL(v.fecha_hora)} · {v.duracion_min}min
                  {v.lead?.telefono && ` · ${v.lead.telefono}`}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] ${estadoColors[v.estado] ?? ""}`}
              >
                {v.estado}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
