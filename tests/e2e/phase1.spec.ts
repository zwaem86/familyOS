import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("all routes, responsive layout and accessibility", async ({ page }) => {
  const health = await page.request.get("/api/health/live");
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ status: "ok" });
  expect(health.headers()["cache-control"]).toBe("no-store");
  expect(health.headers()["x-content-type-options"]).toBe("nosniff");
  expect(health.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(health.headers()["content-security-policy"]).not.toContain(
    "unsafe-eval",
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [route, title] of [
    ["/", "Eure Übersicht"],
    ["/calendar", "Euer Kalender"],
    ["/tasks", "Aufgaben"],
    ["/shopping", "Einkauf"],
    ["/settings", "Einstellungen"],
  ]) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  }
  expect(errors).toEqual([]);
  await page.keyboard.press("Tab");
  await expect(page.getByText("Zum Inhalt springen")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  const nav = page.getByRole("navigation", {
    name:
      page.viewportSize()!.width <= 700
        ? "Mobile Hauptnavigation"
        : "Hauptnavigation",
    exact: true,
  });
  await nav.getByRole("link", { name: "Kalender", exact: true }).click();
  await expect(page).toHaveURL(/calendar$/);
});
test("calendar views, navigation and empty state", async ({ page }) => {
  await page.goto("/calendar");
  await page.getByRole("button", { name: "Monat", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Monat", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Tag", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Mila hat Schwimmtraining" }),
  ).toBeVisible();
  for (const name of ["Anna", "Ben", "Mila", "Leo"])
    await page.getByRole("checkbox", { name, exact: true }).uncheck();
  await expect(
    page.getByRole("heading", { name: "Zeit für freie Pläne" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nächster Zeitraum" }).click();
  await expect(
    page.getByRole("region", { name: "Dienstag, 17. November 2026" }),
  ).toBeVisible();
});
test("local demo mutations reset on reload", async ({ page }) => {
  await page.goto("/tasks");
  await page
    .getByRole("textbox", { name: "Neue Demo-Aufgabe" })
    .fill("Testaufgabe");
  await page.getByRole("button", { name: "Hinzufügen" }).click();
  await page.getByRole("checkbox", { name: /Testaufgabe/ }).check();
  await expect(
    page.getByRole("checkbox", { name: /Testaufgabe/ }),
  ).toBeChecked();
  await page.reload();
  await expect(page.getByText("Testaufgabe")).toHaveCount(0);
  await page.goto("/shopping");
  await page
    .getByRole("textbox", { name: "Neuer Demo-Artikel" })
    .fill("Birnen");
  await page.getByRole("button", { name: "Hinzufügen" }).click();
  await expect(page.getByText("Birnen")).toBeVisible();
});
test("state previews and retry", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Laden", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("wird geladen");
  await page.getByRole("button", { name: "Leer", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Alles im Blick" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fehler", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Erneut versuchen" }).click();
  await expect(page.getByRole("status")).toContainText("erfolgreich");
});
