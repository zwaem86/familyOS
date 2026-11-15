import { Prisma } from "@prisma/client";
import { db } from "../../../lib/db/client";
import {
  equalSecret,
  hashPassword,
  newToken,
  tokenHash,
} from "../../../lib/auth/crypto";
import {
  setupSchema,
  acceptSchema,
  childSchema,
  emailSchema,
} from "../../../lib/auth/schemas";
import { guardPublic } from "../../../lib/auth/rate-limit";
export type Principal = { userId: string; familyId: string };
const invalid = () =>
  new Error("Aktion nicht möglich. Angaben oder Berechtigung prüfen.");
// Family row locking serializes invitation, acceptance and profile capacity checks.
async function lockFamily(tx: Prisma.TransactionClient, familyId: string) {
  await tx.$queryRaw`SELECT id FROM "Family" WHERE id = ${familyId}::uuid FOR UPDATE`;
}
export async function requireMember(
  p: Principal,
  tx: Prisma.TransactionClient = db(),
  admin = false,
) {
  const member = await tx.familyMember.findUnique({
    where: { familyId_userId: { familyId: p.familyId, userId: p.userId } },
  });
  if (!member || member.type !== "ADULT" || (admin && member.role !== "ADMIN"))
    throw invalid();
  return member;
}
export async function setup(input: unknown) {
  await guardPublic("setup", "bootstrap", 5);
  const data = setupSchema.parse(input);
  const secret = process.env.BOOTSTRAP_SECRET;
  if (!secret || secret.length < 32 || !equalSecret(data.secret, secret))
    throw invalid();
  const passwordHash = await hashPassword(data.password);
  return db().$transaction(async (tx) => {
    // Unique singleton and user/family creation commit or roll back together.
    await tx.bootstrap.create({ data: { id: 1 } });
    const user = await tx.user.create({
      data: { email: data.email, name: data.name, passwordHash },
    });
    return tx.family.create({
      data: {
        name: data.familyName,
        members: {
          create: {
            userId: user.id,
            name: data.name,
            color: "blue",
            role: "ADMIN",
            type: "ADULT",
          },
        },
      },
    });
  });
}
export async function createInvitation(p: Principal, input: unknown) {
  const email = emailSchema.parse(input);
  await requireMember(p, db(), true);
  await guardPublic("invitation", p.userId, 10);
  const token = newToken();
  await db().$transaction(async (tx) => {
    await lockFamily(tx, p.familyId);
    await requireMember(p, tx, true);
    if (
      (await tx.familyMember.count({
        where: { familyId: p.familyId, type: "ADULT" },
      })) >= 2
    )
      throw invalid();
    // Reissuing invalidates earlier unconsumed invitations for this family.
    await tx.invitation.updateMany({
      where: { familyId: p.familyId, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.invitation.create({
      data: {
        familyId: p.familyId,
        email,
        tokenHash: tokenHash(token),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
  });
  return token;
}
export async function acceptInvitation(input: unknown) {
  const data = acceptSchema.parse(input);
  await guardPublic("accept", data.email);
  const passwordHash = await hashPassword(data.password);
  await db().$transaction(async (tx) => {
    const invite = await tx.invitation.findUnique({
      where: { tokenHash: tokenHash(data.token) },
    });
    if (!invite || invite.email !== data.email) throw invalid();
    await lockFamily(tx, invite.familyId);
    const consumed = await tx.invitation.updateMany({
      where: { id: invite.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (
      consumed.count !== 1 ||
      (await tx.familyMember.count({
        where: { familyId: invite.familyId, type: "ADULT" },
      })) >= 2
    )
      throw invalid();
    const user = await tx.user.create({
      data: { email: data.email, name: data.name, passwordHash },
    });
    await tx.familyMember.create({
      data: {
        familyId: invite.familyId,
        userId: user.id,
        name: data.name,
        color: "pink",
        role: "ADMIN",
        type: "ADULT",
      },
    });
  });
}
export async function createChild(p: Principal, input: unknown) {
  const data = childSchema.parse(input);
  return db().$transaction(async (tx) => {
    await lockFamily(tx, p.familyId);
    await requireMember(p, tx, true);
    if (
      (await tx.familyMember.count({
        where: { familyId: p.familyId, type: "CHILD" },
      })) >= 2
    )
      throw invalid();
    return tx.familyMember.create({
      data: { ...data, familyId: p.familyId, role: "CHILD", type: "CHILD" },
    });
  });
}
export async function updateChild(p: Principal, id: string, input: unknown) {
  const data = childSchema.parse(input);
  await requireMember(p, db(), true);
  const updated = await db().familyMember.updateMany({
    where: { id, familyId: p.familyId, type: "CHILD", userId: null },
    data,
  });
  if (updated.count !== 1) throw invalid();
}
export async function readFamily(p: Principal) {
  await requireMember(p);
  return db().family.findUniqueOrThrow({
    where: { id: p.familyId },
    select: {
      name: true,
      timezone: true,
      members: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, color: true, role: true, type: true },
      },
    },
  });
}
