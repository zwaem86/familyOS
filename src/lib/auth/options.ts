import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "../db/client";
import { authEnvironment } from "./config";
import { loginSchema } from "./schemas";
import { newToken, tokenHash, verifyPassword, hashPassword } from "./crypto";
import { guardPublic } from "./rate-limit";
let dummyHash: Promise<string> | undefined;
export function authOptions(): NextAuthOptions {
  const env = authEnvironment();
  return {
    secret: env.secret,
    useSecureCookies: env.secure,
    session: { strategy: "jwt", maxAge: 43200 },
    jwt: { maxAge: 43200 },
    pages: { signIn: "/login", error: "/login" },
    providers: [
      CredentialsProvider({
        name: "E-Mail und Passwort",
        credentials: {
          email: { type: "email" },
          password: { type: "password" },
        },
        async authorize(input) {
          const parsed = loginSchema.safeParse(input);
          if (!parsed.success) return null;
          const { email, password } = parsed.data;
          try {
            await guardPublic("login", email);
          } catch {
            return null;
          }
          const user = await db().user.findUnique({
            where: { email },
            include: {
              memberships: {
                where: { type: "ADULT" },
                orderBy: { createdAt: "asc" },
                take: 1,
              },
            },
          });
          dummyHash ??= hashPassword(newToken());
          const valid = await verifyPassword(
            user?.passwordHash ?? (await dummyHash),
            password,
          );
          if (!valid || !user || !user.memberships[0]) return null;
          return { id: user.id, name: user.name, email: user.email };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          const member = await db().familyMember.findFirstOrThrow({
            where: { userId: user.id, type: "ADULT" },
            orderBy: { createdAt: "asc" },
          });
          const sid = newToken();
          await db().appSession.create({
            data: {
              tokenHash: tokenHash(sid),
              userId: user.id,
              familyId: member.familyId,
              expiresAt: new Date(Date.now() + 43200000),
            },
          });
          token.sid = sid;
        }
        return token;
      },
      async session({ session, token }) {
        // Auth endpoint must not report a stale/revoked session as authenticated.
        const active =
          typeof token.sid === "string"
            ? await db().appSession.findUnique({
                where: { tokenHash: tokenHash(token.sid) },
              })
            : null;
        const member =
          active && active.expiresAt > new Date()
            ? await db().familyMember.findUnique({
                where: {
                  familyId_userId: {
                    familyId: active.familyId,
                    userId: active.userId,
                  },
                },
              })
            : null;
        if (!active || !member || member.type !== "ADULT")
          return { expires: new Date(0).toISOString() };
        return { ...session, expires: active.expiresAt.toISOString() };
      },
      async redirect({ url }) {
        return url === env.origin || url.startsWith(`${env.origin}/`)
          ? url
          : env.origin;
      },
    },
    events: {
      async signOut({ token }) {
        if (typeof token?.sid === "string")
          await db().appSession.deleteMany({
            where: { tokenHash: tokenHash(token.sid) },
          });
      },
    },
    logger: {
      error() {
        console.error("Authentifizierung fehlgeschlagen");
      },
      warn() {},
      debug() {},
    },
  };
}
