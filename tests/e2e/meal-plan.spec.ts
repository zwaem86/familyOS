import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("dashboard and editor share saved demo meals until reload", async ({
  page,
}) => {
  await page.goto("/");
  const widget = page.getByRole("region", { name: "Unser Essensplan" });
  await expect(widget.getByRole("listitem")).toHaveCount(7);
  await expect(widget).toContainText("Heute Abend: Gemüselasagne");
  await expect(widget).toContainText("Noch offen");
  await widget.getByRole("link", { name: "Essensplan bearbeiten" }).click();
  const monday = page.getByRole("form", { name: "Montag, 16. November 2026" });
  await expect(monday.getByRole("textbox")).toBeEnabled();
  await monday.getByRole("textbox").fill("  Linsencurry  ");
  await monday.getByRole("button", { name: /Speichern/ }).click();
  await expect(monday.getByRole("textbox")).toHaveValue("Linsencurry");
  await expect(page.getByRole("status")).toContainText("Gericht gespeichert");
  await page.getByRole("link", { name: "Zur Übersicht" }).click();
  await expect(widget).toContainText("Heute Abend: Linsencurry");
  await widget.getByRole("link", { name: "Essensplan bearbeiten" }).click();
  await expect(monday.getByRole("textbox")).toHaveValue("Linsencurry");
  await monday.getByRole("textbox").fill("");
  await monday.getByRole("button", { name: /Speichern/ }).click();
  await expect(page.getByRole("status")).toContainText("Gericht entfernt");
  await page.getByRole("link", { name: "Zur Übersicht" }).click();
  await expect(widget).toContainText("Heute Abend: Noch offen");
  await page.reload();
  await expect(widget).toContainText("Heute Abend: Gemüselasagne");
});

test("upcoming week stays separate, validates input and confirms discarded drafts", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Nächste Woche planen" }).click();
  const nextMonday = page.getByRole("form", {
    name: "Montag, 23. November 2026",
  });
  await expect(nextMonday.getByRole("textbox")).toBeEnabled();
  await nextMonday.getByRole("textbox").fill("x".repeat(121));
  await nextMonday.getByRole("button", { name: /Speichern/ }).click();
  await expect(nextMonday.getByRole("alert")).toContainText("120 Zeichen");
  await expect(nextMonday.getByRole("textbox")).toHaveValue("x".repeat(121));
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await nextMonday.getByRole("textbox").fill("Abendbrot");
  await nextMonday.getByRole("button", { name: /Speichern/ }).click();
  await page.getByRole("button", { name: "Diese Woche", exact: true }).click();
  const monday = page.getByRole("form", { name: "Montag, 16. November 2026" });
  await expect(monday.getByRole("textbox")).toHaveValue("Gemüselasagne");
  await monday.getByRole("textbox").fill("Ungespeichert");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("button", { name: "Nächste Woche", exact: true })
    .click();
  await expect(monday.getByRole("textbox")).toHaveValue("Ungespeichert");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Nächste Woche", exact: true })
    .click();
  await expect(nextMonday.getByRole("textbox")).toHaveValue("Abendbrot");
  await page.getByRole("button", { name: "Diese Woche", exact: true }).click();
  await expect(monday.getByRole("textbox")).toHaveValue("Gemüselasagne");
  await page.getByRole("button", { name: "Folgende Woche" }).click();
  await page.getByRole("button", { name: "Folgende Woche" }).click();
  await expect(
    page.getByRole("heading", { name: "Noch eine Woche voller Möglichkeiten" }),
  ).toBeVisible();
  await expect(page.getByRole("form")).toHaveCount(7);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
