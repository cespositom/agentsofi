"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function TriggerOutboundButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function trigger() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/trigger-outbound", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setMsg(`OK: ${data.calls_made ?? 0} llamadas disparadas`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setMsg(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-neutral-400">{msg}</span>}
      <Button onClick={trigger} disabled={loading}>
        {loading ? "Disparando..." : "Disparar outbound"}
      </Button>
    </div>
  );
}
