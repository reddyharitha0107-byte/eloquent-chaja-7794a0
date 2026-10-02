import type { Config } from "@netlify/functions";
import { lt } from "drizzle-orm";
import { database } from "../../db";
import { workspaces } from "../../db/schema";

export default async function cleanup() {
  await database().delete(workspaces).where(lt(workspaces.createdAt, new Date(Date.now() - 7 * 86_400_000)));
  return new Response(null, { status: 204 });
}

export const config: Config = { schedule: "0 3 * * *" };
