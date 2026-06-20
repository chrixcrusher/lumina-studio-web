import type { Alignment, DriveStep, Side } from "driver.js";

export interface EditorTourStep {
  id: string;
  selector: string;
  title: string;
  body: string;
  side?: Side;
  align?: Alignment;
}

export const EDITOR_TOUR_STEPS: EditorTourStep[] = [
  {
    id: "upload",
    selector: '[data-tour="upload"]',
    title: "Upload",
    body: "Start with a JPEG, PNG, or WebP. Images stay in the browser for manual edits.",
    side: "top",
    align: "center",
  },
  {
    id: "filters",
    selector: '[data-tour="filters"]',
    title: "Quick Looks",
    body: "Choose a filter, then fine-tune light, color, effects, detail, crop, and text.",
    side: "top",
    align: "start",
  },
  {
    id: "crop",
    selector: '[data-tour="crop"]',
    title: "Crop",
    body: "Use fixed ratios or free crop, then apply when the frame matches the export area.",
    side: "right",
    align: "center",
  },
  {
    id: "ai",
    selector: '[data-tour="ai"]',
    title: "AI Restore",
    body: "Face restoration uses the cloud proxy only when you provide or save a Hugging Face token.",
    side: "left",
    align: "start",
  },
  {
    id: "presets",
    selector: '[data-tour="presets"]',
    title: "Presets",
    body: "Signed-in users can save presets. Guests can import a preset temporarily for the active session.",
    side: "left",
    align: "start",
  },
  {
    id: "export",
    selector: '[data-tour="export"]',
    title: "Export",
    body: "Export renders the current browser edits, crop, filter, effects, and text overlay into a PNG.",
    side: "bottom",
    align: "center",
  },
];

export function createEditorDriverSteps(): DriveStep[] {
  return EDITOR_TOUR_STEPS.map((step) => ({
    element: step.selector,
    popover: {
      title: step.title,
      description: step.body,
      side: step.side,
      align: step.align,
    },
  }));
}
