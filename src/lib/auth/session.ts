import "server-only";
import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
import { authEnvironment } from "./config";
import { tokenHash } from "./crypto";
import { db } from "../db/client";
import { requireMember } from "../../features/family/server/service";
export async function requireSession() {
  const env = authEnvironment();
  const token = await getToken({
    req: new NextRequest(env.origin, {
      headers: { cookie: (await headers()).get("cookie") ?? "" },
    }),
    secret: env.secret,
    secureCookie: env.secure,
  });
  if (typeof token?.sid !== "string") redirect("/login");
  const session = await db().appSession.findUnique({
    where: { tokenHash: tokenHash(token.sid) },
  });
  if (
    !session ||
    session.expiresAt <= new Date() ||
    session.userId !== token.sub
  )
    redirect("/login");
  const principal = { userId: session.userId, familyId: session.familyId };
  try {
    await requireMember(principal);
  } catch {
    redirect("/login");
  }
  return principal;
}
