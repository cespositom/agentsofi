"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Durante prerender en build, las env pueden no estar.
  // Usamos placeholders inertes para que createBrowserClient no tire;
  // en runtime real Next reemplaza con los valores reales.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  return createBrowserClient(url, key);
}
