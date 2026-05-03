"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Propiedad } from "@/lib/supabase/types";
import { fmtPrecio } from "@/lib/format";

const TIPOS = [
  "Todos",
  "Departamento",
  "Casa",
  "Parcela",
  "Oficina",
  "Local Comercial",
  "Terreno",
  "Bodega",
] as const;

// Color de fondo de la tarjeta según tipo
const TYPE_COLOR: Record<string, string> = {
  Departamento: "linear-gradient(135deg,#1E3A5F,#2563EB)",
  Casa: "linear-gradient(135deg,#1F4D38,#059669)",
  Parcela: "linear-gradient(135deg,#3F2F0E,#A16207)",
  Oficina: "linear-gradient(135deg,#312E81,#7C3AED)",
  "Local Comercial": "linear-gradient(135deg,#7C2D12,#DC2626)",
  Terreno: "linear-gradient(135deg,#374151,#6B7280)",
  Bodega: "linear-gradient(135deg,#1F2937,#475569)",
};

const TYPE_ICON: Record<string, string> = {
  Departamento: "🏢",
  Casa: "🏡",
  Parcela: "🌳",
  Oficina: "🏛",
  "Local Comercial": "🏪",
  Terreno: "📐",
  Bodega: "📦",
};

export function PropiedadesView({ items }: { items: Propiedad[] }) {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>("Todos");
  const [estado, setEstado] = useState<"Todos" | "Disponible" | "No disponible">(
    "Todos"
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return items.filter((p) => {
      const qOk =
        !t ||
        p.nombre.toLowerCase().includes(t) ||
        p.comuna.toLowerCase().includes(t);
      const tipoOk = tipo === "Todos" || p.tipo === tipo;
      const stOk =
        estado === "Todos" ||
        (estado === "Disponible" ? p.disponible : !p.disponible);
      return qOk && tipoOk && stOk;
    });
  }, [items, q, tipo, estado]);

  const disponibles = items.filter((p) => p.disponible).length;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[15px] font-bold leading-tight">Propiedades</h1>
          <p className="text-xs" style={{ color: "var(--sofia-muted)" }}>
            {items.length} en cartera · {disponibles} disponibles
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md min-w-[200px]"
            style={{
              background: "var(--sofia-bg)",
              border: "1px solid var(--sofia-border)",
            }}
          >
            <span style={{ color: "var(--sofia-muted)" }}>⌕</span>
            <input
              placeholder="Buscar dirección o comuna…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-transparent border-none outline-none text-[12px] w-full"
            />
          </div>
          <button
            onClick={() => setView("grid")}
            className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors"
            style={
              view === "grid"
                ? { background: "var(--sofia-accent)", color: "#fff" }
                : {
                    border: "1px solid var(--sofia-border)",
                    color: "var(--sofia-fg)",
                  }
            }
          >
            Grilla
          </button>
          <button
            onClick={() => setView("table")}
            className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors"
            style={
              view === "table"
                ? { background: "var(--sofia-accent)", color: "#fff" }
                : {
                    border: "1px solid var(--sofia-border)",
                    color: "var(--sofia-fg)",
                  }
            }
          >
            Tabla
          </button>
          <Link
            href="/propiedades/nueva"
            className="px-3 py-1.5 rounded-md text-[11px] font-semibold text-white"
            style={{ background: "var(--sofia-accent)" }}
          >
            + Nueva propiedad
          </Link>
        </div>
      </div>

      {/* Filtros chip */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <span
          className="text-[12px] mr-1"
          style={{ color: "var(--sofia-muted)" }}
        >
          Tipo:
        </span>
        {TIPOS.map((t) => (
          <button
            key={t}
            onClick={() => setTipo(t)}
            className="px-3 py-1 rounded-full text-[11.5px] font-medium border transition-colors"
            style={
              tipo === t
                ? {
                    background: "var(--sofia-accent-lt)",
                    borderColor: "var(--sofia-accent)",
                    color: "var(--sofia-accent)",
                  }
                : {
                    background: "var(--sofia-surface)",
                    borderColor: "var(--sofia-border)",
                    color: "var(--sofia-muted)",
                  }
            }
          >
            {t}
          </button>
        ))}
        <span
          className="text-[12px] ml-2 mr-1"
          style={{ color: "var(--sofia-muted)" }}
        >
          Estado:
        </span>
        {(["Todos", "Disponible", "No disponible"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setEstado(s)}
            className="px-3 py-1 rounded-full text-[11.5px] font-medium border transition-colors"
            style={
              estado === s
                ? {
                    background: "var(--sofia-accent-lt)",
                    borderColor: "var(--sofia-accent)",
                    color: "var(--sofia-accent)",
                  }
                : {
                    background: "var(--sofia-surface)",
                    borderColor: "var(--sofia-border)",
                    color: "var(--sofia-muted)",
                  }
            }
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div
          className="text-center py-10 text-[12px]"
          style={{ color: "var(--sofia-muted)" }}
        >
          Sin resultados para los filtros seleccionados.
        </div>
      )}

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="rounded-lg overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
              style={{
                background: "var(--sofia-surface)",
                border: "1px solid var(--sofia-border)",
              }}
            >
              <div
                className="h-32 flex items-center justify-center text-3xl relative"
                style={{ background: TYPE_COLOR[p.tipo] || "#374151" }}
              >
                <span aria-hidden>{TYPE_ICON[p.tipo] || "🏠"}</span>
                <span
                  className="absolute top-2.5 left-2.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    color: "#fff",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {p.tipo}
                </span>
                {!p.disponible && (
                  <span
                    className="absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: "var(--sofia-danger)",
                      color: "#fff",
                    }}
                  >
                    NO DISP.
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <div className="text-[12.5px] font-semibold">{p.nombre}</div>
                <div
                  className="text-[11px] mb-2"
                  style={{ color: "var(--sofia-muted)" }}
                >
                  {p.comuna}
                </div>
                <div className="text-[14px] font-bold font-mono mb-2">
                  {fmtPrecio(p.precio, p.operacion)}
                </div>
                <div
                  className="flex gap-3 text-[11px]"
                  style={{ color: "var(--sofia-muted)" }}
                >
                  {p.dormitorios !== null && <span>🛏 {p.dormitorios}</span>}
                  {p.banos !== null && <span>🛁 {p.banos}</span>}
                  {p.m2 !== null && <span>📐 {p.m2}m²</span>}
                </div>
                {p.amenidades && p.amenidades.length > 0 && (
                  <div
                    className="mt-2 pt-2 text-[10.5px] truncate"
                    style={{
                      color: "var(--sofia-muted)",
                      borderTop: "1px solid var(--sofia-border)",
                    }}
                  >
                    {p.amenidades.slice(0, 3).join(" · ")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="sofia-card overflow-x-auto">
          <table className="sofia-table min-w-[700px]">
            <thead>
              <tr>
                <th>Propiedad</th>
                <th>Tipo</th>
                <th>Comuna</th>
                <th>Operación</th>
                <th>Precio</th>
                <th>Dorm</th>
                <th>m²</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold">{p.nombre}</td>
                  <td className="text-[13px]">{p.tipo}</td>
                  <td className="text-[13px]">{p.comuna}</td>
                  <td className="text-[13px]">{p.operacion}</td>
                  <td className="font-mono text-[13px]">
                    {fmtPrecio(p.precio, p.operacion)}
                  </td>
                  <td className="font-mono text-[13px]">
                    {p.dormitorios ?? "—"}
                  </td>
                  <td className="font-mono text-[13px]">{p.m2 ?? "—"}</td>
                  <td>
                    <span
                      className={`sofia-pill ${p.disponible ? "sofia-pill-disponible" : "sofia-pill-vendido"}`}
                    >
                      {p.disponible ? "Disponible" : "No disp."}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
