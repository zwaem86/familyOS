import { chromium, type FullConfig } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { db } from "../../src/lib/db/client";
export default async function globalSetup(config: FullConfig) {
  if (!process.env.DATABASE_URL?.endsWith("/familyos_test"))
    throw new Error("E2E requires dedicated familyos_test DB");
  await db().$executeRawUnsafe(
    'TRUNCATE "Family", "User", "Bootstrap", "RateLimit" CASCADE',
  );
  const browser = await chromium.launch();
  const page = await browser.newPage({
    baseURL: config.projects[0].use.baseURL,
  });
  await page.goto("/setup");
  await page
    .getByLabel("Einrichtungsschlüssel")
    .fill(process.env.BOOTSTRAP_SECRET!);
  await page
    .getByLabel("Familienname", { exact: true })
    .fill("Fiktive Browserfamilie");
  await page.getByLabel("Dein Name").fill("Fiktiv Admin");
  await page
    .getByLabel("E-Mail", { exact: true })
    .fill("browser@example.invalid");
  await page
    .getByLabel("Passwort (mindestens 12 Zeichen)", { exact: true })
    .fill("Fictional-browser-password-123");
  await page.getByRole("button", { name: "Familie einrichten" }).click();
  await page
    .getByText("Familie angelegt. Du kannst dich jetzt anmelden.")
    .waitFor();
  await page.goto("/login");
  await page
    .getByLabel("E-Mail", { exact: true })
    .fill("browser@example.invalid");
  await page
    .getByLabel("Passwort", { exact: true })
    .fill("Fictional-browser-password-123");
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await page.waitForURL("/");
  await mkdir("playwright/.auth", { recursive: true });
  await page.context().storageState({ path: "playwright/.auth/admin.json" });
  await browser.close();
  await db().$disconnect();
}
