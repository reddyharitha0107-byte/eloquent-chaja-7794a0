"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createFixtures } from "@/lib/fixtures";
import type { Snapshot } from "@/lib/types";

export function useNova() {
  const [snapshot, setSnapshot] = useState<Snapshot>(createFixtures);
  const [ready, setReady] = useState(false);
  const [connection, setConnection] = useState<"connecting" | "live" | "reconnecting" | "offline">("connecting");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const actionInProgress = useRef(false);

  const notify = useCallback((text: string, error = false) => {
    setNotice({ text, error });
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), error ? 8000 : 4500);
  }, []);

  const applySnapshot = useCallback((next: Snapshot) => {
    setSnapshot(previous => (next.events[0]?.id ?? 0) >= (previous.events[0]?.id ?? 0) ? next : previous);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/state", { cache: "no-store", signal: AbortSignal.timeout(20_000) });
      if (response.status === 401) { window.dispatchEvent(new Event("nova-session-expired")); return; }
      if (!response.ok) throw new Error("Connection unavailable");
      const state = await response.json() as Snapshot;
      if (!mounted.current) return;
      applySnapshot(state);
      setReady(true);
      setConnection("live");
    } catch {
      if (mounted.current) setConnection(current => current === "connecting" || current === "offline" ? "offline" : "reconnecting");
    }
  }, [applySnapshot]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => { mounted.current = false; if (noticeTimer.current) clearTimeout(noticeTimer.current); };
  }, [refresh]);

  useEffect(() => {
    if (!ready) return;
    let streamHealthy = false;
    const stream = new EventSource("/api/stream");
    stream.onopen = () => { streamHealthy = true; setConnection("live"); };
    stream.addEventListener("snapshot", event => {
      try { applySnapshot(JSON.parse((event as MessageEvent).data) as Snapshot); streamHealthy = true; setConnection("live"); }
      catch { streamHealthy = false; setConnection("reconnecting"); }
    });
    stream.onerror = () => { streamHealthy = false; setConnection("reconnecting"); };
    stream.addEventListener("connection-error", () => { streamHealthy = false; setConnection("reconnecting"); });
    const recovery = setInterval(() => { if (!streamHealthy) void refresh(); }, 12_000);
    return () => { stream.close(); clearInterval(recovery); };
  }, [ready, refresh, applySnapshot]);

  const mutate = useCallback(async <ResultType,>(path: string, body: Record<string, unknown>, successMessage?: string): Promise<ResultType | null> => {
    if (!ready || actionInProgress.current) return null;
    actionInProgress.current = true;
    setBusy(path);
    try {
      const response = await fetch(`/api/v1/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(28_000) });
      if (response.status === 401) { window.dispatchEvent(new Event("nova-session-expired")); return null; }
      const result = await response.json().catch(() => ({ error: "The sync service is temporarily unavailable. Please try again." }));
      if (!response.ok) {
        if (response.status === 409) await refresh();
        throw new Error(result.error || "The action could not be completed.");
      }
      await refresh();
      if (successMessage) notify(successMessage);
      return result as ResultType;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Network error. Please try again.", true);
      return null;
    } finally { actionInProgress.current = false; setBusy(""); }
  }, [ready, refresh, notify]);

  const dismissNotice = useCallback(() => setNotice(null), []);
  return { snapshot, ready, connection, busy, notice, notify, dismissNotice, refresh, mutate };
}

export type NovaEngine = ReturnType<typeof useNova>;
