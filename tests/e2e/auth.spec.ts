import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("private routes reject anonymous access and forged origins", async ({
  browser,
}) => {
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const page = await context.newPage();
  for (const route of [
    "/",
    "/settings",
    "/calendar",
    "/tasks",
    "/shopping",
    "/meal-plan",
  ]) {
    await page.goto(`http://127.0.0.1:3000${route}`);
    await expect(page).toHaveURL(/\/login$/);
  }
  const response = await page.request.post(
    "http://127.0.0.1:3000/api/auth/signout",
    {
      headers: {
        origin: "https://evil.example.invalid",
        "x-forwarded-host": "127.0.0.1:3000",
      },
    },
  );
  expect(response.status()).toBe(403);
  await page.screenshot({
    path: `test-results/login-${test.info().project.name}.png`,
    fullPage: true,
  });
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await context.close();
});
test("invited adult and two children persist; logout revokes copied cookie", async ({
  page,
  browser,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Shared test family: run this mutation flow once",
  );
  await page.goto("/setup");
  await expect(
    page.getByRole("heading", { name: "Einrichtung abgeschlossen" }),
  ).toBeVisible();
  await page.goto("/settings");
  await page
    .getByRole("textbox", { name: "E-Mail des zweiten Erwachsenen" })
    .fill("invited@example.invalid");
  await page.getByRole("button", { name: "Einladung erstellen" }).click();
  const link = page.locator(".invite-link a");
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const second = await context.newPage();
  await second.goto(href!);
  await second.getByLabel("Dein Name").fill("Fiktiv Zweitadmin");
  await second
    .getByLabel("E-Mail", { exact: true })
    .fill("invited@example.invalid");
  await second
    .getByLabel("Passwort (mindestens 12 Zeichen)", { exact: true })
    .fill("Fictional-invited-password-123");
  await second.getByRole("button", { name: "Einladung annehmen" }).click();
  await expect(second.getByRole("status")).toHaveText(
    "Konto angelegt. Du kannst dich jetzt anmelden.",
  );
  await second.goto("http://127.0.0.1:3000/login");
  await second
    .getByLabel("E-Mail", { exact: true })
    .fill("invited@example.invalid");
  await second
    .getByLabel("Passwort", { exact: true })
    .fill("Fictional-invited-password-123");
  await second.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(second).toHaveURL("http://127.0.0.1:3000/");
  for (const name of ["Fiktives Kind A", "Fiktives Kind B"]) {
    await page.goto("/settings");
    const form = page.locator("form").filter({
      has: page.getByRole("button", { name: "Kinderprofil anlegen" }),
    });
    await form.getByLabel("Name des Kindes").fill(name);
    const actionRequest = page.waitForRequest(
      (r) => r.method() === "POST" && !!r.headers()["next-action"],
    );
    await form.getByRole("button", { name: "Kinderprofil anlegen" }).click();
    const captured = await actionRequest;
    const anonymous = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const denied = await anonymous.request.post(captured.url(), {
      headers: {
        "next-action": captured.headers()["next-action"],
        "content-type": captured.headers()["content-type"],
        origin: "http://127.0.0.1:3000",
      },
      data: captured.postDataBuffer()!,
    });
    expect(denied.headers()["x-action-redirect"]).toContain("/login");
    await anonymous.close();
    await expect(
      page
        .getByRole("listitem")
        .filter({ hasText: `${name} · Kind · ohne Login` }),
    ).toBeVisible();
  }
  await second.goto("http://127.0.0.1:3000/settings");
  await expect(
    second
      .getByRole("listitem")
      .filter({ hasText: "Fiktives Kind B · Kind · ohne Login" }),
  ).toBeVisible();
  await second.screenshot({
    path: "test-results/settings-desktop.png",
    fullPage: true,
  });
  const copied = await context.storageState();
  await second.getByRole("button", { name: "Abmelden" }).click();
  await expect(second).toHaveURL(/\/login$/);
  const replay = await browser.newContext({ storageState: copied });
  const replayPage = await replay.newPage();
  await replayPage.goto("http://127.0.0.1:3000/settings");
  await expect(replayPage).toHaveURL(/\/login$/);
  await replay.close();
  await context.close();
});

test("invalid login returns generic errors with valid CSRF", async ({
  browser,
}, info) => {
  test.skip(info.project.name !== "desktop", "Exercise shared rate limit once");
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const csrf = await context.request.get("http://127.0.0.1:3000/api/auth/csrf");
  const { csrfToken } = await csrf.json();
  for (let i = 0; i < 9; i++) {
    const response = await context.request.post(
      "http://127.0.0.1:3000/api/auth/callback/credentials",
      {
        headers: { origin: "http://127.0.0.1:3000" },
        form: {
          csrfToken,
          email: "unknown@example.invalid",
          password: "incorrect",
          json: "true",
          callbackUrl: "/",
        },
      },
    );
    expect((await response.json()).url).toContain("error=CredentialsSignin");
  }
  await context.close();
});
