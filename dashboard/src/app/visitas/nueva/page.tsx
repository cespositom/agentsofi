"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Lead, Propiedad } from "@/lib/supabase/types";
import { toSantiagoISO } from "@/lib/format";

export default function NuevaVisitaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [leads, setLeads] = useState<Pick<Lead, "id" | "nombre" | "telefono">[]>([]);
  const [props, setProps] = useState<Pick<Propiedad, "id" | "nombre" | "comuna">[]>([]);
  const [leadId, setLeadId] = useState("");
  const [propId, setPropId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("11:00");
  const [duracion, setDuracion] = useState(60);
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: l }, { data: p }] = await Promise.all([
        supabase.from("leads").select("id,nombre,telefono").order("nombre"),
        supabase
          .from("propiedades")
          .select("id,nombre,comuna")
          .eq("disponible", true)
          .order("nombre"),
      ]);
      setLeads(l ?? []);
      setProps(p ?? []);
    })();
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fechaHora = toSantiagoISO(fecha, hora);
    const { error } = await supabase.from("visitas").insert({
      lead_id: leadId || null,
      propiedad_id: propId || null,
      fecha_hora: fechaHora,
      duracion_min: duracion,
      estado: "Solicitada",
      notas: notas || null,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/visitas");
    router.refresh();
  }

  return (
    <Shell>
      <h1 className="font-heading text-3xl italic mb-6">Agendar visita</h1>
      <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <Label>Lead</Label>
          <select
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            className={inputCls}
          >
            <option value="">— Sin lead —</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre} ({l.telefono})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Propiedad</Label>
          <select
            value={propId}
            onChange={(e) => setPropId(e.target.value)}
            className={inputCls}
          >
            <option value="">— Sin propiedad específica —</option>
            {props.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.comuna})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <input
              required
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hora</Label>
            <input
              required
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Duración (min)</Label>
            <input
              type="number"
              value={duracion}
              onChange={(e) => setDuracion(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Notas</Label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className={`${inputCls} min-h-[80px]`}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Agendar"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </Shell>
  );
}

const inputCls =
  "w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm";
