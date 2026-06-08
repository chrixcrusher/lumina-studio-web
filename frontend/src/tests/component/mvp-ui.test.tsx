import { render, screen } from "@testing-library/react";
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

    for (const tool of ["Crop", "Rotate", "Flip", "Text"]) {
      expect(screen.getByRole("button", { name: tool })).toBeInTheDocument();
    }

    for (const filter of ["Vivid", "Black and White", "Vintage", "Warm", "Cool"]) {
      expect(screen.getByRole("button", { name: filter })).toBeInTheDocument();
    }

    expect(screen.getByLabelText(/hugging face api token/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ai restore/i })).toBeEnabled();
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
