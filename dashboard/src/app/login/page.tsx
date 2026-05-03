"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

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
        <div className="text-center space-y-2">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white"
            style={{ background: "var(--sofia-accent)" }}
          >
            S
          </div>
          <h1 className="text-xl font-bold">Sofía</h1>
          <p className="text-xs" style={{ color: "var(--sofia-muted)" }}>
            Inicia sesión en el panel
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{
                border: "1px solid var(--sofia-border)",
                background: "var(--sofia-bg)",
                color: "var(--sofia-fg)",
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{
                border: "1px solid var(--sofia-border)",
                background: "var(--sofia-bg)",
                color: "var(--sofia-fg)",
              }}
            />
          </div>
          {error && (
            <p className="text-xs" style={{ color: "var(--sofia-danger)" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--sofia-accent)" }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p
          className="text-center text-xs"
          style={{ color: "var(--sofia-muted)" }}
        >
          ¿Sin cuenta?{" "}
          <Link
            href="/signup"
            style={{ color: "var(--sofia-accent)" }}
            className="hover:underline"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
