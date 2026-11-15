// Only invoked explicitly by the local Podman starter, never by app startup.
import { db } from "../src/lib/db/client";
import {
  setup,
  createInvitation,
  acceptInvitation,
  createChild,
} from "../src/features/family/server/service";
async function main() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (
    process.env.FAMILYOS_DEMO_SEED !== "fictional-local-only" ||
    url.hostname !== "demo-db" ||
    url.pathname !== "/familyos_local_demo"
  )
    throw new Error("Nur isolierte lokale Demo-DB erlaubt");
  if (
    (await db().user.count()) ||
    (await db().family.count()) ||
    (await db().bootstrap.count())
  )
    throw new Error("Demo-Seed benötigt eine leere Datenbank");
  const family = await setup({
    secret: process.env.BOOTSTRAP_SECRET,
    familyName: "Fiktive Testfamilie",
    name: "Anna (fiktiv)",
    email: "anna@example.invalid",
    password: process.env.DEMO_ADMIN_PASSWORD,
  });
  const admin = await db().user.findUniqueOrThrow({
    where: { email: "anna@example.invalid" },
  });
  const principal = { userId: admin.id, familyId: family.id };
  const token = await createInvitation(principal, "ben@example.invalid");
  await acceptInvitation({
    token,
    email: "ben@example.invalid",
    name: "Ben (fiktiv)",
    password: process.env.DEMO_SECOND_PASSWORD,
  });
  await createChild(principal, { name: "Mila (fiktiv)", color: "green" });
  await createChild(principal, { name: "Leo (fiktiv)", color: "purple" });
  console.log(
    "Vier ausdrücklich fiktive Profile angelegt; Bootstrap geschlossen.",
  );
}
main()
  .finally(() => db().$disconnect())
  .catch(() => {
    console.error(
      "Fiktiver Demo-Seed fehlgeschlagen; Testdatenbank und Konfiguration prüfen.",
    );
    process.exitCode = 1;
  });
