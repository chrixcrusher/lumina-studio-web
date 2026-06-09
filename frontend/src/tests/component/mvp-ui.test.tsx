import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { AccountSettingsPage } from "@/domains/account/components/AccountSettingsPage";
import { AuthForm } from "@/domains/authentication/components/AuthForm";
import { EditorWorkspace } from "@/domains/editor/components/EditorWorkspace";
import { HistoryPage } from "@/domains/history/components/HistoryPage";
import { LandingPage } from "@/domains/landing/components/LandingPage";
import { OPERATION_TYPES, PROCESSING_MODES } from "@/shared/constants/lumina";
import { AppProviders } from "@/app/providers";

function renderWithProviders(ui: ReactElement) {
  return render(<AppProviders>{ui}</AppProviders>);
}

async function uploadWorkspaceImage(user: ReturnType<typeof userEvent.setup>) {
  const file = new File(["valid image"], "valid-transparent.png", { type: "image/png" });
  await user.upload(screen.getAllByLabelText(/upload image/i)[0], file);

  await waitFor(() => {
    expect(screen.getByAltText("Uploaded workspace image")).toBeInTheDocument();
  });
}

describe("MVP UI alignment", () => {
  it("renders landing entry points without trial or subscription language", () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getAllByText("LuminaStudio Web")[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /enhance now/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /create account/i })[0]).toBeInTheDocument();
    expect(screen.queryByText(/free trial/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pro plan/i)).not.toBeInTheDocument();
  });

  it("shows auth validation feedback", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="register" />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
  });

  it("renders editor tools, filters, and AI restore controls", () => {
    renderWithProviders(<EditorWorkspace />);

    expect(screen.getByText(/upload an image to start/i)).toBeInTheDocument();
    expect(screen.getByText(/guest workspace/i)).toBeInTheDocument();

    for (const tool of ["Crop", "Rotate", "Flip", "Text"]) {
      expect(screen.getByRole("button", { name: tool })).toBeInTheDocument();
    }

    for (const filter of ["Vivid", "Black and White", "Vintage", "Warm", "Cool"]) {
      expect(screen.getByRole("button", { name: filter })).toBeInTheDocument();
    }

    expect(screen.getByLabelText(/hugging face api token/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ai restore/i })).toBeDisabled();
  });

  it("loads a valid uploaded image into the workspace", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditorWorkspace />);

    await uploadWorkspaceImage(user);

    expect(screen.getByText("valid-transparent.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ai restore/i })).toBeEnabled();
  });

  it("updates browser preview state for manual editing tools", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditorWorkspace />);
    await uploadWorkspaceImage(user);

    await user.click(screen.getByRole("button", { name: /light controls/i }));
    fireEvent.change(screen.getByRole("slider", { name: /brightness/i }), { target: { value: "40" } });
    expect(screen.getByTestId("workspace-image")).toHaveAttribute("data-filter", expect.stringContaining("brightness(1.200)"));

    fireEvent.mouseDown(screen.getByRole("combobox", { name: /crop ratio/i }));
    await user.click(screen.getByRole("option", { name: "1:1" }));
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-crop-ratio", "1 / 1");

    await user.click(screen.getByRole("button", { name: "Rotate" }));
    await user.click(screen.getByRole("button", { name: /rotate right/i }));
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-transform", expect.stringContaining("rotate(90deg)"));

    await user.click(screen.getByRole("button", { name: "Flip" }));
    await user.click(screen.getByRole("button", { name: /flip h/i }));
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-transform", expect.stringContaining("scaleX(-1)"));

    await user.click(screen.getByRole("button", { name: "Text" }));
    await user.type(screen.getByLabelText(/text overlay content/i), "Studio note");
    expect(screen.getByTestId("text-overlay")).toHaveTextContent("Studio note");
  });

  it("rejects invalid upload files clearly", () => {
    renderWithProviders(<EditorWorkspace />);

    const uploadInput = screen.getAllByLabelText(/upload image/i)[0];

    fireEvent.change(uploadInput, {
      target: {
        files: [new File(["not an image"], "invalid-text-file.txt", { type: "text/plain" })],
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/unsupported file type/i);

    fireEvent.change(uploadInput, {
      target: {
        files: [new File([new Uint8Array(11 * 1024 * 1024)], "oversized-image.jpg", { type: "image/jpeg" })],
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/too large/i);
    expect(screen.queryByAltText("Uploaded workspace image")).not.toBeInTheDocument();
  });

  it("shows metadata-only history with canonical values", () => {
    renderWithProviders(<HistoryPage />);

    expect(screen.getByText(OPERATION_TYPES.restoreFace)).toBeInTheDocument();
    expect(screen.getByText(PROCESSING_MODES.cloudAi)).toBeInTheDocument();
    expect(screen.queryByAltText(/thumbnail/i)).not.toBeInTheDocument();
  });

  it("does not display a saved Hugging Face token value in settings", () => {
    renderWithProviders(<AccountSettingsPage />);

    expect(screen.getByText(/huggingFaceTokenConfigured: false/i)).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/hf_x/i)).not.toBeInTheDocument();
  });
});
