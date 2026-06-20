import { describe, expect, it } from "vitest";
import { createEditorDriverSteps, EDITOR_TOUR_STEPS } from "./editor-tour";

describe("editor tour steps", () => {
  it("covers the expected editor workflow anchors", () => {
    expect(EDITOR_TOUR_STEPS.map((step) => step.id)).toEqual([
      "upload",
      "filters",
      "crop",
      "ai",
      "presets",
      "export",
    ]);

    for (const step of EDITOR_TOUR_STEPS) {
      expect(step.selector).toMatch(/^\[data-tour="/);
      expect(step.title).toBeTruthy();
      expect(step.body.length).toBeGreaterThan(24);
    }

    expect(createEditorDriverSteps().map((step) => step.element)).toEqual(EDITOR_TOUR_STEPS.map((step) => step.selector));
  });
});
