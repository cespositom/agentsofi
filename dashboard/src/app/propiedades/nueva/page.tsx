"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { PropOperacion, PropTipo } from "@/lib/supabase/types";

const TIPOS: PropTipo[] = [
  "Casa",
  "Departamento",
  "Parcela",
  "Oficina",
  "Local Comercial",
  "Terreno",
  "Bodega",
];
const OPERACIONES: PropOperacion[] = ["Venta", "Arriendo"];

export default function NuevaPropiedadPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    tipo: "Departamento" as PropTipo,
    operacion: "Venta" as PropOperacion,
    precio: "",
    comuna: "Las Condes",
    dormitorios: "",
    banos: "",
    m2: "",
    direccion: "",
    amenidades: "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const payload = {
      nombre: form.nombre,
      tipo: form.tipo,
      operacion: form.operacion,
      precio: Number(form.precio),
      comuna: form.comuna,
      dormitorios: form.dormitorios ? Number(form.dormitorios) : null,
      banos: form.banos ? Number(form.banos) : null,
      m2: form.m2 ? Number(form.m2) : null,
      direccion: form.direccion || null,
      amenidades: form.amenidades
        ? form.amenidades.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      disponible: true,
    };
    const { error } = await supabase.from("propiedades").insert(payload);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/propiedades");
    router.refresh();
  }

  return (
    <Shell>
      <h1 className="font-heading text-3xl italic mb-6">Nueva propiedad</h1>
      <form onSubmit={onSubmit} className="space-y-4 max-w-2xl">
        <Field label="Nombre">
          <input
            required
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo">
            <select
              value={form.tipo}
              onChange={(e) => set("tipo", e.target.value as PropTipo)}
              className={inputCls}
            >
              {TIPOS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Operación">
            <select
              value={form.operacion}
              onChange={(e) => set("operacion", e.target.value as PropOperacion)}
              className={inputCls}
            >
              {OPERACIONES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label={form.operacion === "Venta" ? "Precio (UF)" : "Precio (CLP/mes)"}
          >
            <input
              required
              type="number"
              value={form.precio}
              onChange={(e) => set("precio", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Comuna">
            <input
              required
              value={form.comuna}
              onChange={(e) => set("comuna", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Dormitorios">
            <input
              type="number"
              value={form.dormitorios}
              onChange={(e) => set("dormitorios", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Baños">
            <input
              type="number"
              value={form.banos}
              onChange={(e) => set("banos", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="m²">
            <input
              type="number"
              value={form.m2}
              onChange={(e) => set("m2", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Dirección">
          <input
            value={form.direccion}
            onChange={(e) => set("direccion", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Amenidades (separadas por coma)">
          <input
            value={form.amenidades}
            onChange={(e) => set("amenidades", e.target.value)}
            placeholder="piscina, gimnasio, quincho"
            className={inputCls}
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
