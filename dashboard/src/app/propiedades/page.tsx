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
import { fmtPrecio } from "@/lib/format";
import type { Propiedad } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function PropiedadesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("propiedades")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const props = (data ?? []) as Propiedad[];

  return (
    <Shell email={user?.email}>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl italic tracking-tight">Propiedades</h1>
          <p className="text-sm text-neutral-500">{props.length} en inventario</p>
        </div>
        <Link href="/propiedades/nueva" className={buttonVariants()}>
          + Nueva propiedad
        </Link>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead className="text-neutral-500">Propiedad</TableHead>
              <TableHead className="text-neutral-500">Tipo</TableHead>
              <TableHead className="text-neutral-500">Operación</TableHead>
              <TableHead className="text-neutral-500">Comuna</TableHead>
              <TableHead className="text-neutral-500">Precio</TableHead>
              <TableHead className="text-neutral-500">Dorm.</TableHead>
              <TableHead className="text-neutral-500">m²</TableHead>
              <TableHead className="text-neutral-500">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-neutral-500">
                  Sin propiedades. Cargá la primera con el botón de arriba.
                </TableCell>
              </TableRow>
            )}
            {props.map((p) => (
              <TableRow
                key={p.id}
                className="border-white/[0.06] hover:bg-white/[0.03]"
              >
                <TableCell className="font-medium">{p.nombre}</TableCell>
                <TableCell className="text-sm">{p.tipo}</TableCell>
                <TableCell className="text-sm">{p.operacion}</TableCell>
                <TableCell className="text-sm">{p.comuna}</TableCell>
                <TableCell className="text-sm">
                  {fmtPrecio(p.precio, p.operacion)}
                </TableCell>
                <TableCell className="text-sm">{p.dormitorios ?? "—"}</TableCell>
                <TableCell className="text-sm">{p.m2 ?? "—"}</TableCell>
                <TableCell>
                  {p.disponible ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                      Disponible
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      No disponible
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Shell>
  );
}
