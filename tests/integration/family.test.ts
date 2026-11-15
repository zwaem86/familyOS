import type { CredentialsConfig } from "next-auth/providers/credentials";
import { beforeAll, afterAll, test, expect } from "vitest";
import { db } from "../../src/lib/db/client";
import {
  setup,
  createInvitation,
  acceptInvitation,
  createChild,
  updateChild,
  readFamily,
  requireMember,
} from "../../src/features/family/server/service";
import {
  hashPassword,
  verifyPassword,
  tokenHash,
} from "../../src/lib/auth/crypto";
import { consumeLimit, guardPublic } from "../../src/lib/auth/rate-limit";
import { authOptions } from "../../src/lib/auth/options";
import { assertOrigin } from "../../src/lib/auth/config";
const password = "Fictional-test-password-123";
const secret = "fictional-bootstrap-test-secret-32-characters";
let p: { userId: string; familyId: string };
let foreign: { userId: string; familyId: string };
beforeAll(async () => {
  if (!process.env.DATABASE_URL?.endsWith("/familyos_test"))
    throw new Error("Dedicated familyos_test DB required");
  process.env.BOOTSTRAP_SECRET = secret;
  process.env.AUTH_SECRET = "fictional-auth-test-secret-at-least-32-characters";
  process.env.NEXTAUTH_URL = "http://127.0.0.1:3000";
  await db().$executeRawUnsafe(
    'TRUNCATE "Family", "User", "Bootstrap", "RateLimit" CASCADE',
  );
});
afterAll(async () => {
  await db().$disconnect();
});
test("setup is secret-protected and atomic under parallel initialization", async () => {
  const input = {
    name: "Fiktiv Admin",
    familyName: "Fiktive Testfamilie",
    email: "admin@example.invalid",
    password,
    secret,
  };
  await expect(
    setup({ ...input, secret: "wrong-secret-that-is-long-enough-123" }),
  ).rejects.toThrow();
  const results = await Promise.allSettled([setup(input), setup(input)]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(await db().family.count()).toBe(1);
  const user = await db().user.findUniqueOrThrow({
    where: { email: input.email },
  });
  expect(user.passwordHash).toContain("$argon2id$");
  expect(await verifyPassword(user.passwordHash, password)).toBe(true);
  expect(await verifyPassword(user.passwordHash, "incorrect")).toBe(false);
  const family = await db().family.findFirstOrThrow();
  p = { userId: user.id, familyId: family.id };
  await expect(setup(input)).rejects.toThrow();
});
test("invitation is hashed, email-bound, expiring, and single-use even concurrently", async () => {
  const token = await createInvitation(p, "second@example.invalid");
  const stored = await db().invitation.findUniqueOrThrow({
    where: { tokenHash: tokenHash(token) },
  });
  expect(stored.tokenHash).not.toBe(token);
  const input = {
    token,
    email: "second@example.invalid",
    name: "Fiktiv Zweitadmin",
    password,
  };
  await expect(
    acceptInvitation({ ...input, email: "other@example.invalid" }),
  ).rejects.toThrow();
  await db().invitation.update({
    where: { id: stored.id },
    data: { expiresAt: new Date(0) },
  });
  await expect(acceptInvitation(input)).rejects.toThrow();
  const fresh = await createInvitation(p, input.email);
  await expect(acceptInvitation(input)).rejects.toThrow();
  const results = await Promise.allSettled([
    acceptInvitation({ ...input, token: fresh }),
    acceptInvitation({ ...input, token: fresh }),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const adults = await db().familyMember.findMany({
    where: { familyId: p.familyId, type: "ADULT" },
  });
  expect(adults).toHaveLength(2);
  expect(adults.every((m) => m.role === "ADMIN")).toBe(true);
  await expect(createInvitation(p, "third@example.invalid")).rejects.toThrow();
  await expect(acceptInvitation({ ...input, token: fresh })).rejects.toThrow();
});
test("children persist without login and profile capacity is serialized", async () => {
  const results = await Promise.allSettled(
    [1, 2, 3].map((i) =>
      createChild(p, { name: `Fiktives Kind ${i}`, color: "green" }),
    ),
  );
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
  const kids = await db().familyMember.findMany({
    where: { familyId: p.familyId, type: "CHILD" },
  });
  expect(kids.every((m) => m.userId === null && m.role === "CHILD")).toBe(true);
  await db().$disconnect();
  expect((await readFamily(p)).members).toHaveLength(4);
});
test("cross-family reads and object-ID writes fail; MEMBER cannot administer", async () => {
  const user = await db().user.create({
    data: {
      email: "foreign@example.invalid",
      name: "Fiktiv Fremd",
      passwordHash: await hashPassword(password),
    },
  });
  const family = await db().family.create({
    data: {
      name: "Fiktive Fremdfamilie",
      members: {
        create: {
          name: user.name,
          userId: user.id,
          color: "purple",
          role: "MEMBER",
          type: "ADULT",
        },
      },
    },
  });
  foreign = { userId: user.id, familyId: family.id };
  await expect(readFamily({ ...p, familyId: family.id })).rejects.toThrow();
  await expect(requireMember({ ...p, userId: user.id })).rejects.toThrow();
  const child = await db().familyMember.findFirstOrThrow({
    where: { familyId: p.familyId, type: "CHILD" },
  });
  await db().familyMember.updateMany({
    where: { userId: user.id },
    data: { role: "ADMIN" },
  });
  await expect(
    updateChild(foreign, child.id, { name: "Attack", color: "blue" }),
  ).rejects.toThrow();
  expect(
    (await db().familyMember.findUniqueOrThrow({ where: { id: child.id } }))
      .name,
  ).not.toBe("Attack");
  await db().familyMember.updateMany({
    where: { userId: user.id },
    data: { role: "MEMBER" },
  });
  await expect(
    createChild(foreign, { name: "Kind", color: "blue" }),
  ).rejects.toThrow();
  await expect(
    createInvitation(foreign, "attack@example.invalid"),
  ).rejects.toThrow();
});
test("persistent rate limit is atomic and origin ignores spoofed proxy headers", async () => {
  const results = await Promise.all(
    Array.from({ length: 12 }, () => consumeLimit("test", "fictional", 5)),
  );
  expect(results.filter(Boolean)).toHaveLength(5);
  await Promise.all(
    Array.from({ length: 100 }, () =>
      consumeLimit("bounded-keys", "global", 100),
    ),
  );
  const rows = await db().rateLimit.count();
  await expect(
    guardPublic("bounded-keys", "attacker-changes-email@example.invalid"),
  ).rejects.toThrow();
  expect(await db().rateLimit.count()).toBe(rows);

  expect(() => assertOrigin("https://evil.example.invalid")).toThrow();
  expect(() => assertOrigin(null)).toThrow();
  expect(() => assertOrigin("http://127.0.0.1:3000")).not.toThrow();
});
test("Auth.js session callback rejects revoked and expired sessions", async () => {
  const options = authOptions();
  const jwt = options.callbacks!.jwt!;
  const result = await jwt({
    token: { sub: p.userId },
    user: { id: p.userId },
    account: null,
    trigger: "signIn",
  });
  expect(typeof result.sid).toBe("string");
  const sessionCallback = options.callbacks!.session!;
  const session = {
    expires: new Date(Date.now() + 10000).toISOString(),
    user: { name: "Fiktiv" },
  };
  // Callback signatures are unions covering both adapter and JWT strategies.
  const call = () =>
    sessionCallback({ session, token: result } as Parameters<
      typeof sessionCallback
    >[0]);
  expect((await call()).user).toBeDefined();
  await db().appSession.updateMany({
    where: { userId: p.userId },
    data: { expiresAt: new Date(0) },
  });
  expect((await call()).user).toBeUndefined();
  await options.events!.signOut!({ token: result, session });
  expect(await db().appSession.count({ where: { userId: p.userId } })).toBe(0);
});

test("Credentials verifies passwords and denies valid password after rate limit", async () => {
  const provider = authOptions().providers[0] as CredentialsConfig & {
    options: CredentialsConfig;
  };
  const authorize = provider.options.authorize;
  const request = { body: {}, query: {}, headers: {}, method: "POST" };
  const email = "admin@example.invalid";
  expect((await authorize({ email, password }, request))?.id).toBe(p.userId);
  for (let i = 0; i < 7; i++)
    expect(
      await authorize({ email, password: "incorrect" }, request),
    ).toBeNull();
  await db().$disconnect();
  expect(await authorize({ email, password }, request)).toBeNull();
});
