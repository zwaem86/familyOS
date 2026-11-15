import { db } from "../db/client";
import { tokenHash } from "./crypto";
// Atomic fixed windows shared by all app instances. Keys contain no clear email/IP.
export async function consumeLimit(
  scope: string,
  identity: string,
  limit: number,
  seconds = 900,
) {
  const now = Date.now();
  const window = Math.floor(now / (seconds * 1000));
  const key = tokenHash(`${scope}:${identity}:${window}`);
  const row = await db().rateLimit.upsert({
    where: { key },
    create: {
      key,
      count: 1,
      expiresAt: new Date((window + 1) * seconds * 1000),
    },
    update: { count: { increment: 1 } },
  });
  return row.count <= limit;
}
export async function guardPublic(scope: string, identity: string, limit = 8) {
  const globalAllowed = await consumeLimit(scope, "global", 100);
  if (!globalAllowed) throw new Error("Bitte später erneut versuchen");
  const allowed = await consumeLimit(scope, identity, limit);
  if (!allowed) throw new Error("Bitte später erneut versuchen");
}
