"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function NuevoLeadPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    nombre: "",
    telefono: "+569",
    email: "",
    comunas_interes: "",
    operacion_buscada: "Compra",
    presupuesto: "",
    notas: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.from("leads").upsert(
      {
        nombre: form.nombre,
        telefono: form.telefono,
        email: form.email || null,
        operacion_buscada: form.operacion_buscada,
        presupuesto: form.presupuesto ? Number(form.presupuesto) : null,
        comunas_interes: form.comunas_interes
          ? form.comunas_interes.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        notas: form.notas || null,
        fuente: "Manual",
        estatus: "Pendiente de llamar",
        temperatura: "Warm",
      },
      { onConflict: "telefono" }
    );
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/leads");
    router.refresh();
  }

  return (
    <Shell>
      <h1 className="font-heading text-3xl italic mb-6">Nuevo lead</h1>
      <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre">
            <input
              required
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Teléfono (+56...)">
            <input
              required
              value={form.telefono}
              onChange={(e) => set("telefono", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Operación">
            <select
              value={form.operacion_buscada}
              onChange={(e) => set("operacion_buscada", e.target.value)}
              className={inputCls}
            >
              <option>Compra</option>
              <option>Arriendo</option>
              <option>Ambas</option>
            </select>
          </Field>
          <Field label="Presupuesto (UF venta / CLP arriendo)">
            <input
              type="number"
              value={form.presupuesto}
              onChange={(e) => set("presupuesto", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Comunas de interés (separadas por coma)">
          <input
            value={form.comunas_interes}
            onChange={(e) => set("comunas_interes", e.target.value)}
            placeholder="Las Condes, Providencia"
            className={inputCls}
          />
        </Field>
        <Field label="Notas">
          <textarea
            value={form.notas}
            onChange={(e) => set("notas", e.target.value)}
            className={`${inputCls} min-h-[80px]`}
          />
        </Field>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
