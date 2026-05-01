import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const url = process.env.MODAL_API_URL;
  if (!url) {
    return NextResponse.json(
      { error: "MODAL_API_URL no configurado" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${url}/trigger-outbound`, { method: "POST" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
