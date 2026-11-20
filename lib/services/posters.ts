import { createClient } from "@supabase/supabase-js";

export interface PosterEvent {
  id: string;
  name: string;
  type: string;
  startTime: string;
  src: string;
}

/**
 * Recent event posters and the number of completed events, for the landing page.
 * Uses the public anon client (no cookies) so the landing page can stay cached.
 */
export async function fetchLandingEvents(limit = 12): Promise<{ posters: PosterEvent[]; doneCount: number | null; since: number | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { posters: [], doneCount: null, since: null };
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const [{ data }, { count }, { data: first }] = await Promise.all([
      supabase
        .from("Event")
        .select("id,name,type,startTime,imgUrl")
        .not("imgUrl", "is", null)
        .order("startTime", { ascending: false })
        .limit(limit),
      supabase.from("Event").select("id", { count: "exact", head: true }).eq("status", "DONE"),
      supabase.from("Event").select("startTime").order("startTime", { ascending: true }).limit(1),
    ]);
    const posters = (data ?? [])
      .filter((e) => e.imgUrl && e.imgUrl.trim())
      .map((e) => ({
        id: e.id,
        name: e.name.trim(),
        type: e.type,
        startTime: e.startTime,
        src: /^https?:\/\//.test(e.imgUrl!)
          ? e.imgUrl!
          : supabase.storage.from("event-images").getPublicUrl(e.imgUrl!.trim()).data.publicUrl,
      }));
    const since = first?.[0]?.startTime ? new Date(first[0].startTime).getFullYear() : null;
    return { posters, doneCount: count ?? null, since };
  } catch {
    return { posters: [], doneCount: null, since: null };
  }
}
