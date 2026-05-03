"use client";

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

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = (email || "?").charAt(0).toUpperCase();

  return (
    <div className="sofia-topnav">
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 shrink-0"
        style={{ borderRight: "1px solid var(--sofia-nav-border)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: "var(--sofia-accent)" }}
        >
          S
        </div>
        <div className="leading-tight">
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

      {/* Links */}
      <nav className="flex items-stretch flex-1 overflow-x-auto">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sofia-nav-link", active && "active")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div
        className="flex items-center gap-3 px-4 shrink-0"
        style={{ borderLeft: "1px solid var(--sofia-nav-border)" }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ background: "#1E3A5F", color: "#9BBCD8" }}
        >
          {initial}
        </div>
        <div className="leading-tight hidden sm:block">
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
          className="text-[11px]"
          style={{ color: "var(--sofia-nav-text)" }}
          title="Cerrar sesión"
        >
          Salir
        </button>
      </div>
    </div>
  );
}
