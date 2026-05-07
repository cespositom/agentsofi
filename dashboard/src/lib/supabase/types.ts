export type LeadEstatus =
  | "Pendiente de llamar"
  | "En proceso"
  | "Cita agendada"
  | "No contestado"
  | "Sin interés"
  | "Cerrado";

export type LeadTemperatura = "Hot" | "Warm" | "Cold";
export type PropOperacion = "Venta" | "Arriendo";
export type PropTipo =
  | "Casa"
  | "Departamento"
  | "Parcela"
  | "Oficina"
  | "Local Comercial"
  | "Terreno"
  | "Bodega";
export type LlamadaTipo = "Inbound" | "Outbound";
export type LlamadaResultado =
  | "Contestada"
  | "No contestada"
  | "Buzón"
  | "Colgada"
  | "Error";
export type LlamadaSentimiento = "Positivo" | "Neutral" | "Negativo";
export type VisitaEstado =
  | "Solicitada"
  | "Confirmada"
  | "Realizada"
  | "Cancelada"
  | "No-show";
export type UserRol = "admin" | "ejecutivo";

export interface Perfil {
  id: string;
  nombre: string;
  email: string;
  rol: UserRol;
  activo: boolean;
  created_at: string;
}

export interface Propiedad {
  id: string;
  nombre: string;
  tipo: PropTipo;
  operacion: PropOperacion;
  precio: number;
  comuna: string;
  dormitorios: number | null;
  banos: number | null;
  m2: number | null;
  amenidades: string[];
  direccion: string | null;
  disponible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  estatus: LeadEstatus;
  temperatura: LeadTemperatura;
  fuente: string | null;
  presupuesto: number | null;
  comunas_interes: string[];
  tipos_buscados: string[];
  operacion_buscada: string | null;
  notas: string | null;
  siguiente_accion: string | null;
  resumen_ia: string | null;
  intentos: number;
  ejecutivo_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Llamada {
  id: string;
  lead_id: string | null;
  titulo: string | null;
  tipo: LlamadaTipo;
  resultado: LlamadaResultado | null;
  telefono: string;
  nombre_lead: string | null;
  duracion_seg: number;
  resumen: string | null;
  transcripcion: string | null;
  sentimiento: LlamadaSentimiento;
  cita_agendada: boolean;
  retell_call_id: string | null;
  costo_retell_usd: number;
  costo_twilio_usd: number;
  costo_anthropic_usd: number;
  costo_modal_usd: number;
  costo_detalle: { product: string; cost_cents: number }[] | null;
  carrier: "twilio" | "telnyx" | null;
  created_at: string;
}

export interface Visita {
  id: string;
  lead_id: string | null;
  propiedad_id: string | null;
  ejecutivo_id: string | null;
  fecha_hora: string;
  duracion_min: number;
  estado: VisitaEstado;
  notas: string | null;
  created_at: string;
  updated_at: string;
  lead?: Pick<Lead, "id" | "nombre" | "telefono"> | null;
  propiedad?: Pick<Propiedad, "id" | "nombre" | "comuna"> | null;
}

export interface KpiResumen {
  leads_pendientes: number;
  leads_hot: number;
  visitas_proximas: number;
  llamadas_24h: number;
  propiedades_disponibles: number;
  costo_retell_24h_usd: number;
  costo_twilio_24h_usd: number;
  costo_anthropic_24h_usd: number;
  costo_modal_24h_usd: number;
  costo_24h_usd: number;
  costo_retell_total_usd: number;
  costo_twilio_total_usd: number;
  costo_anthropic_total_usd: number;
  costo_modal_total_usd: number;
  costo_total_usd: number;
  calls_twilio_24h: number;
  calls_telnyx_24h: number;
}
