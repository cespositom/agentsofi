import { Shell } from "@/components/shell";
import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/supabase/types";
import { LeadsView } from "./leads-view";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  const leads = (data ?? []) as Lead[];

  return (
    <Shell email={user?.email}>
      <LeadsView leads={leads} />
    </Shell>
  );
}
