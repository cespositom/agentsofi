import Link from "next/link";
import { Shell } from "@/components/shell";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TriggerOutboundButton } from "./trigger-button";
import { fmtFechaCorta, fmtUF } from "@/lib/format";
import type { Lead } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const tempColors: Record<string, string> = {
  Hot: "bg-red-500/20 text-red-400 border-red-500/30",
  Warm: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Cold: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const statusColors: Record<string, string> = {
  "Pendiente de llamar": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "En proceso": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Cita agendada": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "No contestado": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Sin interés": "bg-red-500/20 text-red-400 border-red-500/30",
  Cerrado: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const leads = (data ?? []) as Lead[];

  return (
    <Shell email={user?.email}>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl italic tracking-tight">Leads</h1>
          <p className="text-sm text-neutral-500">{leads.length} prospectos</p>
        </div>
        <div className="flex gap-2">
          <TriggerOutboundButton />
          <Link href="/leads/nuevo" className={buttonVariants({ variant: "outline" })}>
            + Nuevo lead
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead className="text-neutral-500">Nombre</TableHead>
              <TableHead className="text-neutral-500">Teléfono</TableHead>
              <TableHead className="text-neutral-500">Estatus</TableHead>
              <TableHead className="text-neutral-500">Temp.</TableHead>
              <TableHead className="text-neutral-500">Comuna interés</TableHead>
              <TableHead className="text-neutral-500">Presupuesto</TableHead>
              <TableHead className="text-neutral-500">Última act.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                  Sin leads. Disparalos desde la llamada de Sofía o creá uno manual.
                </TableCell>
              </TableRow>
            )}
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="border-white/[0.06] hover:bg-white/[0.03]"
              >
                <TableCell className="font-medium">{lead.nombre}</TableCell>
                <TableCell className="text-sm text-neutral-400 font-mono">
                  {lead.telefono}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${statusColors[lead.estatus] ?? ""}`}
                  >
                    {lead.estatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${tempColors[lead.temperatura] ?? ""}`}
                  >
                    {lead.temperatura}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-neutral-400">
                  {lead.comunas_interes.length
                    ? lead.comunas_interes.join(", ")
                    : "—"}
                </TableCell>
                <TableCell className="text-sm text-neutral-400">
                  {lead.presupuesto
                    ? lead.operacion_buscada === "Arriendo"
                      ? `$${Math.round(lead.presupuesto).toLocaleString("es-CL")}/mes`
                      : fmtUF(lead.presupuesto)
                    : "—"}
                </TableCell>
                <TableCell className="text-xs text-neutral-500">
                  {fmtFechaCorta(lead.updated_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Shell>
  );
}
