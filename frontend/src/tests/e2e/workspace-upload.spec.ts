import { expect, test } from "@playwright/test";

const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

test("guest can enter the workspace and upload an image", async ({ page }) => {
  await page.goto("/");
  await Promise.all([
    page.waitForURL("**/editor"),
    page.getByRole("link", { name: /enhance now/i }).first().click(),
  ]);

  await expect(page.getByText(/upload an image to start/i)).toBeVisible();
  await expect(page.getByText(/guest workspace/i)).toBeVisible();

  await page.getByLabel(/upload image/i).first().setInputFiles({
    name: "valid-transparent.png",
    mimeType: "image/png",
    buffer: transparentPng,
  });

  await expect(page.getByAltText("Uploaded workspace image")).toBeVisible();
  await expect(page.getByText("valid-transparent.png")).toBeVisible();
});

test("guest manual edits update the browser preview", async ({ page }) => {
  await page.goto("/editor");

  await page.getByLabel(/upload image/i).first().setInputFiles({
    name: "valid-transparent.png",
    mimeType: "image/png",
    buffer: transparentPng,
  });

  await expect(page.getByAltText("Uploaded workspace image")).toBeVisible();

  await page.getByRole("button", { name: /light controls/i }).click();
  await page.getByRole("slider", { name: /brightness/i }).fill("40");
  await expect(page.getByTestId("workspace-image")).toHaveAttribute("data-filter", /brightness\(1\.200\)/);

  await page.getByRole("combobox", { name: /crop ratio/i }).click();
  await page.getByRole("option", { name: "1:1" }).click();
  await expect(page.getByTestId("workspace-preview")).toHaveAttribute("data-crop-ratio", "1 / 1");

  await page.getByRole("button", { name: "Rotate" }).click();
  await page.getByRole("button", { name: /rotate right/i }).click();
  await expect(page.getByTestId("workspace-preview")).toHaveAttribute("data-transform", /rotate\(90deg\)/);

  await page.getByRole("button", { name: "Flip" }).click();
  await page.getByRole("button", { name: /flip h/i }).click();
  await expect(page.getByTestId("workspace-preview")).toHaveAttribute("data-transform", /scaleX\(-1\)/);

  await page.getByRole("button", { name: "Text" }).click();
  await page.getByLabel(/text overlay content/i).fill("Studio note");
  await expect(page.getByTestId("text-overlay")).toHaveText("Studio note");
});
