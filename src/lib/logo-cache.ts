import { supabase } from "@/integrations/supabase/client";

const requested = new Set<string>();

export async function ensureCollegeLogoCached(teamName: string, league: "NCAAB" | "NCAAF") {
  const key = `${league}:${teamName.toLowerCase()}`;
  if (requested.has(key)) return;
  requested.add(key);
  try {
    await supabase.functions.invoke("fetch-team-logo", {
      body: { teamName, league },
    });
  } catch (err) {
    // Non-blocking best-effort cache warmup
    console.warn("ensureCollegeLogoCached error", err);
  }
}
