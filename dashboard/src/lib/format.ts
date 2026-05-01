export function fmtCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtUF(n: number) {
  return `UF ${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(n)}`;
}

export function fmtPrecio(precio: number, operacion: string) {
  return operacion === "Venta" ? fmtUF(precio) : `${fmtCLP(precio)}/mes`;
}

export function fmtFechaCL(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtFechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "short",
  });
}

// Devuelve el offset actual de Santiago en formato "+HH:MM" o "-HH:MM"
// Maneja automáticamente CLT (-04:00) vs CLST (-03:00) según DST.
export function offsetSantiago(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    timeZoneName: "longOffset",
  }).formatToParts(date);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value || "GMT-04:00";
  // tz viene como "GMT-04:00" o "GMT-03:00"
  return tz.replace("GMT", "") || "-04:00";
}

// Convierte fecha (YYYY-MM-DD) + hora (HH:MM) interpretadas en TZ Santiago
// a un ISO con offset correcto para insertar en Supabase (timestamptz).
export function toSantiagoISO(fecha: string, hora: string): string {
  const refDate = new Date(`${fecha}T${hora}:00`);
  const off = offsetSantiago(refDate);
  return `${fecha}T${hora}:00${off}`;
}
