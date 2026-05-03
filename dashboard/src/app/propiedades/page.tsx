import { Shell } from "@/components/shell";
import { createClient } from "@/lib/supabase/server";
import type { Propiedad } from "@/lib/supabase/types";
import { PropiedadesView } from "./propiedades-view";

export const dynamic = "force-dynamic";

export default async function PropiedadesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("propiedades")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  const props = (data ?? []) as Propiedad[];

  return (
    <Shell email={user?.email}>
      <PropiedadesView items={props} />
    </Shell>
  );
}
