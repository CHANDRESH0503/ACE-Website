"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/context/AuthContext";
import type { Tables } from "@/lib/supabase/database.types";

export type AceEvent = Pick<Tables<"Event">, "id" | "name" | "startTime" | "location" | "type" | "status">;

type State =
  | { status: "loading"; events: AceEvent[] }
  | { status: "ready"; events: AceEvent[] }
  | { status: "error"; events: AceEvent[] };

/** Open events, soonest first. Shared by the hero line and the events section. */
export function useOpenEvents(limit = 4): State {
  const { supabase } = useAuth();
  const [state, setState] = useState<State>({ status: "loading", events: [] });

  useEffect(() => {
    let alive = true;
    supabase
      .from("Event")
      .select("id,name,startTime,location,type,status")
      .eq("status", "OPEN")
      .order("startTime", { ascending: true })
      .limit(limit)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setState({ status: "error", events: [] });
        else setState({ status: "ready", events: data ?? [] });
      }, () => alive && setState({ status: "error", events: [] }));
    return () => {
      alive = false;
    };
  }, [supabase, limit]);

  return state;
}

const IST = "Asia/Kolkata";

export function formatEventDate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-GB", { day: "2-digit", timeZone: IST }),
    month: d.toLocaleDateString("en-GB", { month: "short", timeZone: IST }).toUpperCase(),
    weekday: d.toLocaleDateString("en-GB", { weekday: "short", timeZone: IST }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: IST, hour12: false }),
  };
}

export const eventTypeLabel: Record<string, string> = {
  CONTEST: "Contest",
  WORKSHOP: "Workshop",
  TALK: "Talk",
};
