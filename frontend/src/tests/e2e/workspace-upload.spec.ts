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
