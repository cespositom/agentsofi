import type { Lead, Propiedad } from "@/lib/supabase/types";

const ESTATUS_CLASS: Record<Lead["estatus"], string> = {
  "Pendiente de llamar": "sofia-pill-nuevo",
  "En proceso": "sofia-pill-proceso",
  "Cita agendada": "sofia-pill-cita",
  "No contestado": "sofia-pill-pendiente",
  "Sin interés": "sofia-pill-perdido",
  "Cerrado": "sofia-pill-cerrado",
};

export const ESTATUS_COLORS: Record<Lead["estatus"], string> = {
  "Pendiente de llamar": "#2563EB",
  "En proceso": "#D97706",
  "Cita agendada": "#059669",
  "No contestado": "#9A3412",
  "Sin interés": "#DC2626",
  "Cerrado": "#14532D",
};

const TEMP_CLASS: Record<Lead["temperatura"], string> = {
  Hot: "sofia-pill-hot",
  Warm: "sofia-pill-warm",
  Cold: "sofia-pill-cold",
};

export function PillEstatus({ s }: { s: Lead["estatus"] }) {
  return <span className={`sofia-pill ${ESTATUS_CLASS[s] ?? ""}`}>{s}</span>;
}

export function PillTemp({ t }: { t: Lead["temperatura"] }) {
  return <span className={`sofia-pill ${TEMP_CLASS[t] ?? ""}`}>{t}</span>;
}

export function PillPropEstado({ disponible }: { disponible: boolean }) {
  return (
    <span className={`sofia-pill ${disponible ? "sofia-pill-disponible" : "sofia-pill-vendido"}`}>
      {disponible ? "Disponible" : "No disponible"}
    </span>
  );
}

export type AnyPill = Lead | Propiedad;
