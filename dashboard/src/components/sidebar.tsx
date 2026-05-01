"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/leads", label: "Leads", icon: "👥" },
  { href: "/propiedades", label: "Propiedades", icon: "🏠" },
  { href: "/llamadas", label: "Llamadas", icon: "📞" },
  { href: "/visitas", label: "Visitas", icon: "📅" },
];

export function Sidebar({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-white/[0.06] bg-neutral-950">
      <div className="flex h-20 items-center gap-3 px-6 border-b border-white/[0.06]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-black">
          S
        </div>
        <div>
          <p className="font-heading text-lg font-semibold italic tracking-tight">
            Sofía
          </p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            Voice Agent
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] px-4 py-4 space-y-2">
        {email && (
          <p className="text-[11px] text-neutral-400 truncate" title={email}>
            {email}
          </p>
        )}
        <button
          onClick={logout}
          className="w-full text-left text-[12px] text-neutral-500 hover:text-neutral-300"
        >
          Cerrar sesión →
        </button>
      </div>
    </aside>
  );
}
