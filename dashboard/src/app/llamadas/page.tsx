import { Shell } from "@/components/shell";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    .limit(100);
  const calls = (data ?? []) as Llamada[];

  return (
    <Shell email={user?.email}>
      <div className="mb-8">
        <h1 className="font-heading text-3xl italic tracking-tight">Llamadas</h1>
        <p className="text-sm text-neutral-500">{calls.length} registradas</p>
      </div>

      <div className="space-y-3">
        {calls.length === 0 && (
          <p className="text-sm text-neutral-600 py-12 text-center">
            Sin llamadas todavía.
          </p>
        )}
        {calls.map((call) => (
          <Card key={call.id} className="border-white/[0.06] bg-white/[0.02]">
            <CardContent className="py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-base">
                  {call.tipo === "Inbound" ? "📥" : "📤"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium">
                      {call.titulo || call.nombre_lead || "Llamada"}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {call.tipo}
                    </Badge>
                    {call.resultado && (
                      <Badge
                        variant="outline"
                        className={
                          call.resultado === "Contestada"
                            ? "border-emerald-500/30 text-emerald-400 text-[10px]"
                            : "border-neutral-600 text-neutral-500 text-[10px]"
                        }
                      >
                        {call.resultado}
                      </Badge>
                    )}
                    {call.cita_agendada && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                        Cita
                      </Badge>
                    )}
                    <span
                      className={`text-[10px] ${
                        call.sentimiento === "Positivo"
                          ? "text-emerald-400"
                          : call.sentimiento === "Negativo"
                            ? "text-red-400"
                            : "text-neutral-500"
                      }`}
                    >
                      {call.sentimiento}
                    </span>
                  </div>
                  {call.resumen && (
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {call.resumen}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-neutral-600">
                    {call.telefono && <span>Tel: {call.telefono}</span>}
                    {call.duracion_seg > 0 && (
                      <span>
                        Duración: {Math.floor(call.duracion_seg / 60)}:
                        {String(call.duracion_seg % 60).padStart(2, "0")}
                      </span>
                    )}
                    {call.retell_call_id && (
                      <span className="font-mono">
                        ID: {call.retell_call_id.slice(0, 20)}...
                      </span>
                    )}
                    {call.costo_usd > 0 && (
                      <span className="text-amber-400">
                        Costo: {fmtUSD(call.costo_usd)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-neutral-500">
                    {fmtFechaCL(call.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
