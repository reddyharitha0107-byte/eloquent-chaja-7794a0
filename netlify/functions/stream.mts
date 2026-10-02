import type { Config } from "@netlify/functions";
import { and, eq, desc } from "drizzle-orm";
import { database } from "../../db";
import { events, workspaces } from "../../db/schema";
import { workspaceCookie } from "../../server/workspace";
import { readSnapshot } from "../../server/snapshot";

// Short-lived SSE connections reconnect automatically; PostgreSQL is the shared event bus.
export default async function handler(request: Request) {
  const id = workspaceCookie(request.headers.get("cookie"));
  if (!id) return Response.json({ error: "Initialize your workspace first." }, { status: 401 });
  const db = database();
  const [workspace] = await db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.id, id));
  if (!workspace) return Response.json({ error: "Workspace expired. Reload to start a new demo." }, { status: 401 });
  let cancelled = false;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let latestId = -1;
      const deadline = Date.now() + 22_000;
      const send = (message: string) => { if (!cancelled && !request.signal.aborted) controller.enqueue(encoder.encode(message)); };
      try {
        send("retry: 1500\n\n");
        while (!cancelled && !request.signal.aborted && Date.now() < deadline) {
          const [lastEvent] = await db.select({ id: events.id }).from(events).where(eq(events.workspaceId, id)).orderBy(desc(events.id)).limit(1);
          const revision = lastEvent?.id ?? 0;
          if (revision !== latestId) {
            const snapshot = await readSnapshot(id);
            send(`id: ${revision}\nevent: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`);
            latestId = revision;
          } else send(": heartbeat\n\n");
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch { send("event: connection-error\ndata: {\"message\":\"Reconnecting to the sync engine\"}\n\n"); }
      finally { if (!cancelled) controller.close(); }
    },
    cancel() { cancelled = true; },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" } });
}

export const config: Config = { path: "/api/stream", method: "GET" };
