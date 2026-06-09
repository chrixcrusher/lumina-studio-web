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

test("guest can apply a browser filter and export the current image", async ({ page }) => {
  await page.goto("/editor");

  await page.getByLabel(/upload image/i).first().setInputFiles({
    name: "valid-transparent.png",
    mimeType: "image/png",
    buffer: transparentPng,
  });

  await page.getByRole("button", { name: "Vivid" }).click();
  await expect(page.getByTestId("workspace-image")).toHaveAttribute("data-filter", /saturate\(1\.380\)/);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /^export$/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("valid-transparent-edited.png");
});

test("guest AI restore displays the restored image through the canonical endpoint", async ({ page }) => {
  await page.route("**/api/v1/ai/restore-face", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.headers()["x-session-id"]).toBeTruthy();

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Face restored successfully",
        restoredImage: transparentPng.toString("base64"),
        historyId: "history-1",
        operationType: "restore_face",
        processingMode: "cloud_ai",
        settingsUsed: {
          model: "CodeFormer",
        },
        outputFormat: "jpeg",
        processingTimeMs: 1200,
      }),
    });
  });

  await page.goto("/editor");

  await page.getByLabel(/upload image/i).first().setInputFiles({
    name: "valid-transparent.png",
    mimeType: "image/png",
    buffer: transparentPng,
  });
  await page.getByLabel(/hugging face api token/i).fill("hf_guest_token_123456");
  await page.getByRole("button", { name: /ai restore/i }).click();

  await expect(page.getByText(/restoration complete/i)).toBeVisible();
  await expect(page.getByAltText("Uploaded workspace image")).toHaveAttribute("src", /data:image\/jpeg;base64,/);
});
