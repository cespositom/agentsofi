"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      setInfo("Cuenta creada. Revisa tu email para confirmar (si está activado).");
    }
  }

  const inputCls =
    "w-full rounded-md px-3 py-2 text-sm outline-none";
  const inputStyle = {
    border: "1px solid var(--sofia-border)",
    background: "var(--sofia-bg)",
    color: "var(--sofia-fg)",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--sofia-bg)" }}
    >
      <div
        className="w-full max-w-sm space-y-6 rounded-2xl p-8"
        style={{
          background: "var(--sofia-surface)",
          border: "1px solid var(--sofia-border)",
        }}
      >
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold">Crear cuenta</h1>
          <p className="text-xs" style={{ color: "var(--sofia-muted)" }}>
            El primer usuario debe ser promovido a admin desde SQL.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <input
              id="nombre"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>
          {error && (
            <p className="text-xs" style={{ color: "var(--sofia-danger)" }}>
              {error}
            </p>
          )}
          {info && (
            <p className="text-xs" style={{ color: "var(--sofia-success)" }}>
              {info}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--sofia-accent)" }}
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-center text-xs" style={{ color: "var(--sofia-muted)" }}>
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            style={{ color: "var(--sofia-accent)" }}
            className="hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
