"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Lead } from "@/lib/supabase/types";
import { PillEstatus, PillTemp, ESTATUS_COLORS } from "@/components/lead-pills";
import { fmtFechaCorta, fmtUF, fmtCLP } from "@/lib/format";
import { TriggerOutboundButton } from "./trigger-button";

const STAGES: { id: Lead["estatus"]; label: string }[] = [
  { id: "Pendiente de llamar", label: "Pendientes" },
  { id: "En proceso", label: "En proceso" },
  { id: "Cita agendada", label: "Cita agendada" },
  { id: "No contestado", label: "No contestado" },
  { id: "Sin interés", label: "Sin interés" },
  { id: "Cerrado", label: "Cerrados" },
];

function formatPresupuesto(l: Lead) {
  if (!l.presupuesto) return "—";
  return l.operacion_buscada === "Arriendo"
    ? `${fmtCLP(l.presupuesto)}/mes`
    : fmtUF(l.presupuesto);
}

export function LeadsView({ leads }: { leads: Lead[] }) {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return leads;
    return leads.filter(
      (l) =>
        l.nombre.toLowerCase().includes(t) ||
        l.telefono.toLowerCase().includes(t) ||
        (l.email ?? "").toLowerCase().includes(t) ||
        (l.comunas_interes ?? []).some((c) => c.toLowerCase().includes(t))
    );
  }, [leads, q]);

  return (
    <>
      {/* Header acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[15px] font-bold leading-tight">Leads</h1>
          <p className="text-xs" style={{ color: "var(--sofia-muted)" }}>
            {leads.length} contactos en pipeline
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md min-w-[180px]"
            style={{
              background: "var(--sofia-bg)",
              border: "1px solid var(--sofia-border)",
            }}
          >
            <span style={{ color: "var(--sofia-muted)" }}>⌕</span>
            <input
              placeholder="Buscar nombre, teléfono, email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-transparent border-none outline-none text-[12px] w-full"
            />
          </div>
          <button
            onClick={() => setView("kanban")}
            className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
              view === "kanban"
                ? "text-white"
                : "border"
            }`}
            style={
              view === "kanban"
                ? { background: "var(--sofia-accent)" }
                : {
                    borderColor: "var(--sofia-border)",
                    color: "var(--sofia-fg)",
                  }
            }
          >
            Kanban
          </button>
          <button
            onClick={() => setView("table")}
            className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
              view === "table"
                ? "text-white"
                : "border"
            }`}
            style={
              view === "table"
                ? { background: "var(--sofia-accent)" }
                : {
                    borderColor: "var(--sofia-border)",
                    color: "var(--sofia-fg)",
                  }
            }
          >
            Tabla
          </button>
          <TriggerOutboundButton />
          <Link
            href="/leads/nuevo"
            className="px-3 py-1.5 rounded-md text-[11px] font-semibold text-white"
            style={{ background: "var(--sofia-purple)" }}
          >
            + Nuevo lead
          </Link>
        </div>
      </div>

      {/* Vista */}
      {view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {STAGES.map((stg) => {
            const cards = filtered.filter((l) => l.estatus === stg.id);
            return (
              <div
                key={stg.id}
                className="min-w-[230px] rounded-lg shrink-0"
                style={{
                  background: "var(--sofia-bg)",
                  border: "1px solid var(--sofia-border)",
                }}
              >
                <div
                  className="px-3 py-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    color: "var(--sofia-muted)",
                    borderBottom: "1px solid var(--sofia-border)",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: ESTATUS_COLORS[stg.id] }}
                  />
                  <span>{stg.label}</span>
                  <span
                    className="ml-auto px-1.5 py-px rounded-full text-[10px] font-bold"
                    style={{
                      background: "var(--sofia-border)",
                      color: "var(--sofia-muted)",
                    }}
                  >
                    {cards.length}
                  </span>
                </div>
                <div className="p-2 flex flex-col gap-2 min-h-[100px]">
                  {cards.map((l) => (
                    <Link
                      key={l.id}
                      href={`/leads/${l.id}`}
                      className="block rounded-md p-3 transition-shadow hover:shadow-md"
                      style={{
                        background: "var(--sofia-surface)",
                        border: "1px solid var(--sofia-border)",
                      }}
                    >
                      <div className="text-[12.5px] font-semibold mb-1">
                        {l.nombre}
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ color: "var(--sofia-muted)" }}
                      >
                        {l.comunas_interes?.join(", ") || "—"}
                      </div>
                      <div
                        className="text-[11px] mt-1"
                        style={{ color: "var(--sofia-muted)" }}
                      >
                        {formatPresupuesto(l)}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <PillTemp t={l.temperatura} />
                        <span
                          className="text-[11px] font-mono"
                          style={{ color: "var(--sofia-muted)" }}
                        >
                          {l.intentos} ☎
                        </span>
                      </div>
                    </Link>
                  ))}
                  {cards.length === 0 && (
                    <div
                      className="text-center py-3 text-[11px]"
                      style={{ color: "var(--sofia-muted)" }}
                    >
                      —
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="sofia-card overflow-x-auto">
          <table className="sofia-table min-w-[700px]">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Temp.</th>
                <th>Comuna interés</th>
                <th>Presupuesto</th>
                <th>Última act.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-6"
                    style={{ color: "var(--sofia-muted)" }}
                  >
                    Sin leads para los filtros.
                  </td>
                </tr>
              )}
              {filtered.map((l) => (
                <tr key={l.id} className="row-link">
                  <td>
                    <Link
                      href={`/leads/${l.id}`}
                      className="block"
                      style={{ color: "inherit" }}
                    >
                      <div className="font-semibold">{l.nombre}</div>
                      <div
                        className="text-[12px] font-mono"
                        style={{ color: "var(--sofia-muted)" }}
                      >
                        {l.telefono}
                      </div>
                    </Link>
                  </td>
                  <td>
                    <PillEstatus s={l.estatus} />
                  </td>
                  <td>
                    <PillTemp t={l.temperatura} />
                  </td>
                  <td className="text-[13px]">
                    {l.comunas_interes?.join(", ") || "—"}
                  </td>
                  <td className="text-[13px] font-mono">
                    {formatPresupuesto(l)}
                  </td>
                  <td
                    className="text-[12px]"
                    style={{ color: "var(--sofia-muted)" }}
                  >
                    {fmtFechaCorta(l.updated_at)}
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
