import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtFechaCL, fmtUSD } from "@/lib/format";
import type { KpiResumen, Llamada, Visita } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [kpiRes, llamadasRes, visitasRes] = await Promise.all([
    supabase.from("kpi_resumen").select("*").single(),
    supabase
      .from("llamadas")
      .select(
        "id,titulo,tipo,resultado,nombre_lead,duracion_seg,sentimiento,resumen,cita_agendada,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("visitas")
      .select(
        "id,fecha_hora,estado,lead:leads(id,nombre,telefono),propiedad:propiedades(id,nombre,comuna)"
      )
      .gte("fecha_hora", new Date().toISOString())
      .order("fecha_hora")
      .limit(6),
  ]);

  const kpi = (kpiRes.data ?? null) as KpiResumen | null;
  const llamadas = (llamadasRes.data ?? []) as Llamada[];
  const visitas = (visitasRes.data ?? []) as unknown as Visita[];

  const tiles = [
    { label: "Leads pendientes", value: kpi?.leads_pendientes ?? 0, hint: "para outbound" },
    { label: "Leads Hot", value: kpi?.leads_hot ?? 0, hint: "alta prioridad" },
    { label: "Visitas próximas", value: kpi?.visitas_proximas ?? 0, hint: "agendadas" },
    { label: "Llamadas 24h", value: kpi?.llamadas_24h ?? 0, hint: "últimas" },
    { label: "Propiedades", value: kpi?.propiedades_disponibles ?? 0, hint: "disponibles" },
    { label: "Costo 24h", value: fmtUSD(kpi?.costo_24h_usd ?? 0), hint: "Retell + Twilio" },
    { label: "Costo total", value: fmtUSD(kpi?.costo_total_usd ?? 0), hint: "histórico" },
  ];

  return (
    <Shell email={user?.email}>
      <div className="space-y-8">
        <header>
          <h1 className="font-heading text-3xl italic tracking-tight">Dashboard</h1>
          <p className="text-sm text-neutral-500">
            Estado del CRM — Inmobiliaria Horizontes (Santiago)
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {tiles.map((t) => (
            <Card key={t.label} className="border-white/[0.06] bg-white/[0.02]">
              <CardContent className="p-4">
                <p className="text-[11px] uppercase tracking-wider text-neutral-500">
                  {t.label}
                </p>
                <p className="font-heading text-3xl italic mt-1">{t.value}</p>
                <p className="text-[10px] text-neutral-600 mt-0.5">{t.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="font-heading italic">Últimas llamadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {llamadas.length === 0 && (
                <p className="text-sm text-neutral-500">Sin llamadas todavía.</p>
              )}
              {llamadas.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between border-b border-white/[0.04] py-2 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate">
                      {l.nombre_lead || "Sin nombre"} —{" "}
                      <span className="text-neutral-500">{l.tipo}</span>
                      {l.cita_agendada && (
                        <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                          Cita
                        </Badge>
                      )}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {fmtFechaCL(l.created_at)} ·{" "}
                      {Math.round(l.duracion_seg / 60)}min
                    </p>
                  </div>
                  <Badge variant="outline">{l.sentimiento}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="font-heading italic">Próximas visitas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {visitas.length === 0 && (
                <p className="text-sm text-neutral-500">Sin visitas próximas.</p>
              )}
              {visitas.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between border-b border-white/[0.04] py-2 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate">
                      {v.lead?.nombre || "Sin lead"}
                      {v.propiedad?.nombre && ` · ${v.propiedad.nombre}`}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {fmtFechaCL(v.fecha_hora)}
                    </p>
                  </div>
                  <Badge>{v.estado}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
