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
