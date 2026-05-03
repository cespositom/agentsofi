"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/propiedades", label: "Propiedades" },
  { href: "/llamadas", label: "Llamadas" },
  { href: "/visitas", label: "Visitas" },
  { href: "/costos", label: "Costos" },
];

export function TopNav({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = (email || "?").charAt(0).toUpperCase();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <>
      <div className="sofia-topnav">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-3 sm:px-4 shrink-0"
          style={{ borderRight: "1px solid var(--sofia-nav-border)" }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: "var(--sofia-accent)" }}
          >
            S
          </div>
          <div className="leading-tight hidden xs:block sm:block">
            <p className="text-white text-[14px] font-semibold tracking-tight">
              Sofía
            </p>
            <p
              className="text-[10px] uppercase tracking-[0.04em]"
              style={{ color: "var(--sofia-nav-text)" }}
            >
              Voice Agent
            </p>
          </div>
        </div>

        {/* Links — desktop */}
        <nav className="hidden md:flex items-stretch flex-1 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sofia-nav-link", isActive(item.href) && "active")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Spacer mobile */}
        <div className="md:hidden flex-1" />

        {/* User + logout — desktop */}
        <div
          className="hidden md:flex items-center gap-3 px-3 sm:px-4 shrink-0"
          style={{ borderLeft: "1px solid var(--sofia-nav-border)" }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: "#1E3A5F", color: "#9BBCD8" }}
          >
            {initial}
          </div>
          <div className="leading-tight hidden lg:block">
            <p className="text-white text-[12px] font-medium truncate max-w-[160px]">
              {email || "—"}
            </p>
            <p
              className="text-[10px]"
              style={{ color: "var(--sofia-nav-text)" }}
            >
              admin
            </p>
          </div>
          <button
            onClick={logout}
            className="text-[11px] hover:text-white transition-colors"
            style={{ color: "var(--sofia-nav-text)" }}
            title="Cerrar sesión"
          >
            Salir
          </button>
        </div>

        {/* Hamburger mobile */}
        <button
          aria-label="Abrir menú"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden flex items-center justify-center w-12 h-full text-white"
          style={{ borderLeft: "1px solid var(--sofia-nav-border)" }}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="md:hidden flex flex-col"
          style={{
            background: "var(--sofia-nav-bg)",
            borderBottom: "1px solid var(--sofia-nav-border)",
          }}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "px-5 py-3 text-[14px] border-b",
                isActive(item.href) ? "text-white" : "text-[#7A8FAD]"
              )}
              style={{ borderColor: "var(--sofia-nav-border)" }}
            >
              {item.label}
            </Link>
          ))}
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ background: "rgba(0,0,0,0.2)" }}
          >
            <span className="text-[12px]" style={{ color: "var(--sofia-nav-text)" }}>
              {email}
            </span>
            <button
              onClick={logout}
              className="text-[12px] text-white"
            >
              Salir →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
