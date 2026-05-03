"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shell } from "@/components/shell";
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
      <h1 className="text-[15px] font-bold leading-tight mb-1">Nuevo lead</h1>
      <p className="text-xs mb-5" style={{ color: "var(--sofia-muted)" }}>
        Cargá un prospecto manualmente
      </p>
      <form onSubmit={onSubmit} className="space-y-4 max-w-xl sofia-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre">
            <input
              required
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </Field>
          <Field label="Teléfono (+56...)">
            <input
              required
              value={form.telefono}
              onChange={(e) => set("telefono", e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </Field>
        </div>
        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Operación">
            <select
              value={form.operacion_buscada}
              onChange={(e) => set("operacion_buscada", e.target.value)}
              className={inputCls}
              style={inputStyle}
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
              style={inputStyle}
            />
          </Field>
        </div>
        <Field label="Comunas de interés (separadas por coma)">
          <input
            value={form.comunas_interes}
            onChange={(e) => set("comunas_interes", e.target.value)}
            placeholder="Las Condes, Providencia"
            className={inputCls}
            style={inputStyle}
          />
        </Field>
        <Field label="Notas">
          <textarea
            value={form.notas}
            onChange={(e) => set("notas", e.target.value)}
            className={`${inputCls} min-h-[80px]`}
            style={inputStyle}
          />
        </Field>
        {error && (
          <p className="text-xs" style={{ color: "var(--sofia-danger)" }}>
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--sofia-accent)" }}
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-md text-sm font-semibold border"
            style={{
              borderColor: "var(--sofia-border)",
              color: "var(--sofia-fg)",
              background: "var(--sofia-surface)",
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </Shell>
  );
}

const inputCls =
  "w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30";

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--sofia-border)",
  background: "var(--sofia-surface)",
  color: "var(--sofia-fg)",
};

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
