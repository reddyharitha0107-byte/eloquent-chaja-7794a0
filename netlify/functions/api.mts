import type { Config } from "@netlify/functions";
import serverless from "serverless-http";
import { randomUUID } from "node:crypto";
import { createApi } from "../../server/api";
import { ensureWorkspace, workspaceCookie } from "../../server/workspace";

// A modern Netlify function wraps Express, preserving AI Gateway runtime injection.
export default async function handler(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (request.method !== "GET" && origin && origin !== url.origin) return Response.json({ error: "Cross-origin actions are not allowed." }, { status: 403 });
  if (!["GET", "POST"].includes(request.method)) return Response.json({ error: "Method not allowed." }, { status: 405 });
  const previous = workspaceCookie(request.headers.get("cookie"));
  const id = previous ?? randomUUID();
  try {
    const body = request.method === "GET" ? undefined : await request.text();
    if (body && Buffer.byteLength(body) > 8192) return Response.json({ error: "Request is too large." }, { status: 413 });
    await ensureWorkspace(id);
    const proxy = serverless(createApi(id));
    const result = await proxy({
      httpMethod: request.method, path: url.pathname, rawUrl: request.url,
      headers: Object.fromEntries(request.headers), queryStringParameters: Object.fromEntries(url.searchParams),
      body, isBase64Encoded: false, requestContext: { requestId: randomUUID(), identity: {} },
    }, {}) as { statusCode: number; headers: Record<string, string>; body: string; isBase64Encoded?: boolean };
    const headers = new Headers(result.headers);
    const cookiePolicy = url.protocol === "https:" ? "SameSite=None; Secure; Partitioned" : "SameSite=Strict";
    if (!previous) headers.set("Set-Cookie", `nova_workspace=${id}; Path=/; HttpOnly; ${cookiePolicy}; Max-Age=604800`);
    headers.set("Cache-Control", "no-store");
    return new Response(result.isBase64Encoded ? Buffer.from(result.body, "base64") : result.body, { status: result.statusCode, headers });
  } catch {
    return Response.json({ error: "The database is not reachable yet. Please retry in a moment." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export const config: Config = { path: "/api/v1/*" };
