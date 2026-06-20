"use client";

import AddIcon from "@mui/icons-material/Add";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CodeIcon from "@mui/icons-material/Code";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import ColorizeIcon from "@mui/icons-material/Colorize";
import CropIcon from "@mui/icons-material/Crop";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import DownloadIcon from "@mui/icons-material/Download";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import FlipIcon from "@mui/icons-material/Flip";
import GridViewIcon from "@mui/icons-material/GridView";
import HistoryIcon from "@mui/icons-material/History";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import LinkIcon from "@mui/icons-material/Link";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import RemoveIcon from "@mui/icons-material/Remove";
import RedoIcon from "@mui/icons-material/Redo";
import Rotate90DegreesCcwIcon from "@mui/icons-material/Rotate90DegreesCcw";
import SettingsIcon from "@mui/icons-material/Settings";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import TuneIcon from "@mui/icons-material/Tune";
import UndoIcon from "@mui/icons-material/Undo";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { Driver } from "driver.js";
import Link from "next/link";
import type { ChangeEvent, CSSProperties, MouseEvent, PointerEvent, ReactNode, WheelEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createEditorDriverSteps } from "@/domains/editor/tour/editor-tour";
import { restoreFace } from "@/domains/enhancement/services/restore-face-api";
import { presetsApi } from "@/domains/presets/services/presets-api";
import {
  createPresetEnhancementSettings,
  migratePresetEnhancementSettings,
  parsePresetJsonPayload,
  PresetSchemaError,
  toEditorPresetSettings,
  type EditorPresetAdjustments,
} from "@/domains/presets/services/preset-schema";
import type { Preset, SavePresetRequest } from "@/domains/presets/types/preset";
import { ApiError, getApiAuthToken } from "@/infrastructure/api/api-client";
import { clearBrowserPreferences, getBrowserPreferences, setBrowserPreference } from "@/shared/browser-preferences";
import { APP_ROUTES } from "@/shared/constants/routes";
import { getOrCreateGuestSessionId } from "@/shared/guest-session";

interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropperInstance {
  open: () => Promise<EyeDropperResult>;
}

interface EyeDropperConstructor {
  new (): EyeDropperInstance;
}

declare global {
  interface Window {
    EyeDropper?: EyeDropperConstructor;
  }
}

type Adjustments = EditorPresetAdjustments;

interface FilterPreset {
  id: string;
  name: string;
  adj: Partial<Adjustments>;
  css?: string[];
}

interface FilterPreviewTone {
  background: string;
  overlay?: string;
  imageOverlay?: string;
  imageFilter?: string;
  imageOpacity?: number;
  overlayOpacity?: number;
  overlayMixBlendMode?: CSSProperties["mixBlendMode"];
}

interface CropPreset {
  id: string;
  label: string;
  ratio: string | null;
  exportRatio: number | null;
}

interface TextOverlayState {
  id: string;
  text: string;
  color: string;
  size: number;
  x: number;
  y: number;
}

interface FreeCropState {
  x: number;
  y: number;
  width: number;
  height: number;
}

type FreeCropDragMode = "move" | "n" | "e" | "s" | "w" | "ne" | "se" | "sw" | "nw";

interface FreeCropDragState {
  mode: FreeCropDragMode;
  startX: number;
  startY: number;
  startCrop: FreeCropState;
  boundsWidth: number;
  boundsHeight: number;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface HslColor {
  h: number;
  s: number;
  l: number;
}

interface CmykColor {
  c: number;
  m: number;
  y: number;
  k: number;
}

type ColorPickerMode = "swatches" | "wheel" | "sliders" | "codes";

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  saturation: 0,
  vibrance: 0,
  warmth: 0,
  temperature: 0,
  tint: 0,
  texture: 0,
  clarity: 0,
  vignetteAmount: 0,
  vignetteMidpoint: 50,
  vignetteRoundness: 0,
  vignetteFeather: 50,
  vignetteHighlights: 0,
  grainAmount: 0,
  grainSize: 25,
  grainRoughness: 50,
  sharpeningAmount: 0,
  sharpeningRadius: 1,
  sharpeningDetail: 25,
  sharpeningMasking: 0,
};

const DEFAULT_TEXT_OVERLAY_VALUES = {
  text: "",
  color: "#ffffff",
  size: 34,
  x: 50,
  y: 50,
};

const DEFAULT_FREE_CROP: FreeCropState = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

const DEFAULT_EXPANDED_SECTIONS = {
  ai: true,
  light: false,
  color: false,
  effects: false,
  detail: false,
  presets: false,
};

const EDITOR_LAYOUT = {
  appRows: { xs: "auto minmax(0, 1fr)", md: "66px 1fr", lg: "70px 1fr" },
  shellColumns: {
    xs: "1fr",
    md: "74px minmax(0, 1fr) minmax(340px, 24vw)",
    lg: "78px minmax(0, 1fr) minmax(366px, 22vw)",
    xl: "80px minmax(0, 1fr) 382px",
  },
  workspaceRows: { md: "minmax(0, 1fr) clamp(178px, 19vh, 214px)" },
  uploadCardWidth: {
    xs: "100%",
    md: "min(480px, calc(100% - 48px))",
    lg: "min(520px, calc(100% - 64px))",
  },
  filterCardWidth: { xs: "108px", sm: "122px", md: "124px", lg: "132px", xl: "138px" },
} as const;

const CROP_PRESETS = [
  { id: "none", label: "No Crop", ratio: null, exportRatio: null },
  { id: "free", label: "Free", ratio: null, exportRatio: null },
  { id: "square", label: "1:1", ratio: "1 / 1", exportRatio: 1 },
  { id: "portrait", label: "4:5", ratio: "4 / 5", exportRatio: 4 / 5 },
  { id: "wide", label: "16:9", ratio: "16 / 9", exportRatio: 16 / 9 },
] as const satisfies readonly CropPreset[];

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_SIZE_MB = MAX_UPLOAD_SIZE_BYTES / (1024 * 1024);
const SUPPORTED_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const FILTER_PRESETS: FilterPreset[] = [
  { id: "original", name: "Original", adj: {} },
  { id: "vivid", name: "Vivid", adj: { exposure: 5, contrast: 28, saturation: 38 } },
  { id: "bw", name: "Black & White", adj: { contrast: 18, saturation: -100 } },
  { id: "vintage", name: "Vintage", adj: { warmth: 28, saturation: -24, contrast: 6 } },
  { id: "warm", name: "Warm", adj: { warmth: 35, saturation: 10, exposure: 8 } },
  { id: "cool", name: "Cool", adj: { warmth: -30, saturation: 5, contrast: 12 } },
  { id: "sepia", name: "Sepia", adj: { temperature: 36, saturation: -18, contrast: 8 }, css: ["sepia(0.55)"] },
  { id: "vignette", name: "Vignette", adj: { contrast: 12, vignetteAmount: -58 } },
  { id: "blur", name: "Blur", adj: { exposure: 2, saturation: -6 }, css: ["blur(1.4px)"] },
  { id: "sharpen", name: "Sharpen", adj: { contrast: 10, texture: 18, clarity: 22, sharpeningAmount: 70 } },
  { id: "high-contrast", name: "High Contrast", adj: { contrast: 55, blacks: -18, whites: 18, highlights: 12, shadows: -10 } },
  { id: "vibrant", name: "Vibrant", adj: { saturation: 28, vibrance: 46, contrast: 12 } },
  { id: "matte", name: "Matte", adj: { contrast: -18, blacks: 22, shadows: 18, saturation: -8 } },
  { id: "hdr", name: "HDR", adj: { contrast: 34, highlights: -24, shadows: 28, texture: 26, clarity: 30, vibrance: 18 } },
  { id: "invert", name: "Invert", adj: {}, css: ["invert(1)"] },
  { id: "duotone", name: "Duotone", adj: { contrast: 18, saturation: 18 }, css: ["sepia(0.85)", "hue-rotate(245deg)", "saturate(1.35)"] },
  { id: "polaroid", name: "Polaroid", adj: { exposure: 10, temperature: 22, saturation: -8, contrast: -8, vignetteAmount: -28 } },
  { id: "grain", name: "Grain", adj: { grainAmount: 46, grainSize: 38, grainRoughness: 62, contrast: 8, saturation: -8 } },
];

const FILTER_PREVIEW_TONES: Record<string, FilterPreviewTone> = {
  original: {
    background: "linear-gradient(135deg, #202038 0%, #4b4a6c 54%, #747391 100%)",
    imageFilter: "saturate(1) contrast(1)",
  },
  vivid: {
    background: "linear-gradient(135deg, #312e81 0%, #7e22ce 48%, #ec4899 100%)",
    imageOverlay: "linear-gradient(135deg, rgba(124,58,237,0.34), rgba(236,72,153,0.38))",
    overlayMixBlendMode: "screen",
  },
  bw: {
    background: "linear-gradient(135deg, #0f1018 0%, #60606e 46%, #e5e7eb 100%)",
    imageFilter: "grayscale(1) contrast(1.18)",
  },
  vintage: {
    background: "linear-gradient(135deg, #2f2418 0%, #8a704b 48%, #d6bd8a 100%)",
    imageOverlay: "linear-gradient(135deg, rgba(111,78,55,0.35), rgba(214,188,138,0.22))",
  },
  warm: {
    background: "linear-gradient(135deg, #5b1d0a 0%, #d97706 52%, #fbbf24 100%)",
    imageOverlay: "linear-gradient(135deg, rgba(251,146,60,0.28), rgba(250,204,21,0.3))",
    overlayMixBlendMode: "screen",
  },
  cool: {
    background: "linear-gradient(135deg, #081a35 0%, #075985 52%, #22d3ee 100%)",
    imageOverlay: "linear-gradient(135deg, rgba(14,165,233,0.3), rgba(45,212,191,0.2))",
    overlayMixBlendMode: "screen",
  },
  sepia: {
    background: "linear-gradient(135deg, #26160c 0%, #8b5e34 54%, #c58f4d 100%)",
    imageFilter: "sepia(0.72) contrast(1.06)",
  },
  vignette: {
    background: "radial-gradient(circle at center, #7c6d92 0%, #4b4267 45%, #090912 100%)",
    overlay: "radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.78) 100%)",
    imageOverlay: "radial-gradient(circle at center, rgba(255,255,255,0) 38%, rgba(0,0,0,0.72) 100%)",
  },
  blur: {
    background: "linear-gradient(135deg, #4338ca 0%, #8b5cf6 48%, #c4b5fd 100%)",
    imageFilter: "blur(1.8px) saturate(0.92)",
    imageOpacity: 0.86,
  },
  sharpen: {
    background: "linear-gradient(135deg, #111827 0%, #e0e7ff 48%, #4338ca 52%, #0f172a 100%)",
    imageOverlay: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(15,23,42,0.18))",
    overlayMixBlendMode: "overlay",
  },
  "high-contrast": {
    background: "linear-gradient(135deg, #020617 0%, #0f172a 38%, #f8fafc 39%, #f8fafc 62%, #111827 63%, #000 100%)",
    imageFilter: "contrast(1.55) saturate(1.05)",
  },
  vibrant: {
    background: "linear-gradient(135deg, #dc2626 0%, #f97316 28%, #22c55e 54%, #2563eb 78%, #a855f7 100%)",
    imageOverlay: "linear-gradient(135deg, rgba(236,72,153,0.18), rgba(34,197,94,0.18), rgba(59,130,246,0.22))",
    overlayMixBlendMode: "screen",
  },
  matte: {
    background: "linear-gradient(135deg, #334155 0%, #8b879d 52%, #d8cfc0 100%)",
    imageOverlay: "linear-gradient(135deg, rgba(226,232,240,0.18), rgba(148,163,184,0.2))",
    imageOpacity: 0.9,
  },
  hdr: {
    background: "linear-gradient(135deg, #0f172a 0%, #38bdf8 32%, #f8fafc 52%, #f59e0b 74%, #312e81 100%)",
    imageFilter: "contrast(1.22) brightness(1.08) saturate(1.16)",
    imageOverlay: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(14,165,233,0.12))",
    overlayMixBlendMode: "screen",
  },
  invert: {
    background: "linear-gradient(135deg, #f8fafc 0%, #22d3ee 32%, #f472b6 58%, #111827 100%)",
    imageFilter: "invert(1) hue-rotate(180deg) saturate(1.15)",
  },
  duotone: {
    background: "linear-gradient(135deg, #220a45 0%, #7c3aed 46%, #f97316 100%)",
    imageOverlay: "linear-gradient(135deg, rgba(124,58,237,0.42), rgba(249,115,22,0.42))",
    overlayMixBlendMode: "color",
  },
  polaroid: {
    background: "linear-gradient(135deg, #efe4c8 0%, #c08457 48%, #5b4636 100%)",
    imageOverlay: "linear-gradient(135deg, rgba(255,247,237,0.18), rgba(194,120,73,0.24))",
  },
  grain: {
    background:
      "repeating-radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22) 0 1px, rgba(0,0,0,0.16) 1px 2px, transparent 2px 5px), linear-gradient(135deg, #1f2937 0%, #6b5f73 54%, #a78b72 100%)",
    imageOverlay:
      "repeating-radial-gradient(circle at 18% 28%, rgba(255,255,255,0.16) 0 1px, rgba(0,0,0,0.12) 1px 2px, transparent 2px 5px)",
    overlayMixBlendMode: "overlay",
    overlayOpacity: 0.75,
  },
};

const TEXT_COLOR_SWATCHES = [
  "#ffffff",
  "#f8fafc",
  "#111827",
  "#f87171",
  "#fb923c",
  "#facc15",
  "#22c55e",
  "#2dd4bf",
  "#38bdf8",
  "#818cf8",
  "#a78bfa",
  "#f472b6",
];

const tools = [
  { id: "select", label: "Select", mobileLabel: "Edit", icon: <TuneIcon /> },
  { id: "crop", label: "Crop", icon: <CropIcon /> },
  { id: "rotate", label: "Rotate", icon: <Rotate90DegreesCcwIcon /> },
  { id: "text", label: "Text", icon: <TextFieldsIcon /> },
  { id: "flip", label: "Flip", icon: <FlipIcon /> },
];

const FREE_CROP_HANDLES: Array<{
  mode: Exclude<FreeCropDragMode, "move">;
  sx: Record<string, string | number>;
  cursor: string;
}> = [
  { mode: "nw", sx: { left: -5, top: -5 }, cursor: "nwse-resize" },
  { mode: "n", sx: { left: "50%", top: -5, transform: "translateX(-50%)" }, cursor: "ns-resize" },
  { mode: "ne", sx: { right: -5, top: -5 }, cursor: "nesw-resize" },
  { mode: "e", sx: { right: -5, top: "50%", transform: "translateY(-50%)" }, cursor: "ew-resize" },
  { mode: "se", sx: { right: -5, bottom: -5 }, cursor: "nwse-resize" },
  { mode: "s", sx: { left: "50%", bottom: -5, transform: "translateX(-50%)" }, cursor: "ns-resize" },
  { mode: "sw", sx: { left: -5, bottom: -5 }, cursor: "nesw-resize" },
  { mode: "w", sx: { left: -5, top: "50%", transform: "translateY(-50%)" }, cursor: "ew-resize" },
];

let textOverlaySequence = 0;

function fmtVal(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function validateImageUpload(file: File) {
  if (!SUPPORTED_UPLOAD_TYPES.has(file.type)) {
    return "Unsupported file type. Upload a JPEG, PNG, or WebP image.";
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return `Image is too large. Upload an image up to ${MAX_UPLOAD_SIZE_MB} MB.`;
  }

  return null;
}

function buildCSSFilter(adjustments: Adjustments, preset: FilterPreset, showOriginal: boolean) {
  if (showOriginal) return "none";
  const merged = mergePresetAdjustments(adjustments, preset);
  const temperature = (merged.temperature ?? 0) + (merged.warmth ?? 0);
  const brightness = Math.max(
    0.15,
    1 +
      merged.brightness * 0.005 +
      merged.exposure * 0.006 +
      merged.highlights * 0.002 +
      merged.shadows * 0.0015 +
      merged.whites * 0.0018 -
      merged.blacks * 0.0015,
  );
  const contrast = Math.max(
    0.15,
    1 +
      merged.contrast * 0.007 +
      merged.highlights * 0.0015 -
      merged.shadows * 0.001 +
      merged.texture * 0.0015 +
      merged.clarity * 0.002 +
      merged.sharpeningAmount * 0.001,
  );
  const saturate = Math.max(0, 1 + merged.saturation / 100 + merged.vibrance / 180);
  const hueRotate = temperature * -0.14 + merged.tint * 0.09;
  const sepia = temperature > 0 ? (temperature / 100) * 0.22 : 0;
  return [
    `brightness(${brightness.toFixed(3)})`,
    `contrast(${contrast.toFixed(3)})`,
    `saturate(${saturate.toFixed(3)})`,
    sepia > 0.008 ? `sepia(${sepia.toFixed(3)})` : "",
    Math.abs(hueRotate) > 0.3 ? `hue-rotate(${hueRotate.toFixed(1)}deg)` : "",
    ...(preset.css ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function mergePresetAdjustments(adjustments: Adjustments, preset: FilterPreset): Adjustments {
  return { ...adjustments, ...preset.adj };
}

function getFilterEffectValues(adjustments: Adjustments, showOriginal: boolean) {
  if (showOriginal) {
    return { vignette: 0, grain: 0 };
  }

  return {
    vignette: clamp(-adjustments.vignetteAmount, 0, 100) / 100,
    grain: clamp(adjustments.grainAmount, 0, 100) / 100,
  };
}

function getFilterEffectOverlaySx(adjustments: Adjustments, showOriginal: boolean) {
  const { vignette, grain } = getFilterEffectValues(adjustments, showOriginal);

  if (vignette === 0 && grain === 0) return null;

  const backgrounds = [
    vignette > 0
      ? `radial-gradient(circle at center, rgba(0,0,0,0) ${42 + adjustments.vignetteMidpoint * 0.22}%, rgba(0,0,0,${(0.62 * vignette).toFixed(3)}) 100%)`
      : "",
    grain > 0
      ? `repeating-radial-gradient(circle at 20% 30%, rgba(255,255,255,${(0.1 * grain).toFixed(3)}) 0 1px, rgba(0,0,0,${(0.08 * grain).toFixed(3)}) 1px 2px, transparent 2px 5px)`
      : "",
  ].filter(Boolean);

  return {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 1,
    backgroundImage: backgrounds.join(", "),
    mixBlendMode: grain > 0 ? "overlay" : "normal",
    opacity: grain > 0 && vignette === 0 ? 0.72 : 1,
  };
}

function drawFilterEffects(context: CanvasRenderingContext2D, width: number, height: number, adjustments: Adjustments) {
  const { vignette, grain } = getFilterEffectValues(adjustments, false);

  if (vignette > 0 && typeof context.createRadialGradient === "function") {
    const radius = Math.max(width, height) * 0.72;
    const gradient = context.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.22, width / 2, height / 2, radius);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, `rgba(0,0,0,${(0.62 * vignette).toFixed(3)})`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  if (grain > 0 && typeof context.fillRect === "function") {
    const step = Math.max(2, Math.round(9 - clamp(adjustments.grainSize, 0, 100) / 18));
    const alpha = 0.11 * grain;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const seed = (x * 13 + y * 17) % 29;
        context.fillStyle = seed % 2 === 0 ? `rgba(255,255,255,${alpha.toFixed(3)})` : `rgba(0,0,0,${(alpha * 0.8).toFixed(3)})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  }
}

function buildPreviewTransform(rotation: number, flipHorizontal: boolean, flipVertical: boolean) {
  return `rotate(${rotation}deg) scaleX(${flipHorizontal ? -1 : 1}) scaleY(${flipVertical ? -1 : 1})`;
}

function getCenteredCrop(width: number, height: number, ratio: number | null) {
  if (!ratio) {
    return { sourceX: 0, sourceY: 0, sourceWidth: width, sourceHeight: height };
  }

  const imageRatio = width / height;
  if (imageRatio > ratio) {
    const sourceWidth = Math.round(height * ratio);
    return {
      sourceX: Math.round((width - sourceWidth) / 2),
      sourceY: 0,
      sourceWidth,
      sourceHeight: height,
    };
  }

  const sourceHeight = Math.round(width / ratio);
  return {
    sourceX: 0,
    sourceY: Math.round((height - sourceHeight) / 2),
    sourceWidth: width,
    sourceHeight,
  };
}

function getFreeCrop(width: number, height: number, crop: FreeCropState) {
  const sourceX = Math.round((width * crop.x) / 100);
  const sourceY = Math.round((height * crop.y) / 100);
  const sourceWidth = Math.max(1, Math.round((width * crop.width) / 100));
  const sourceHeight = Math.max(1, Math.round((height * crop.height) / 100));

  return {
    sourceX: Math.min(sourceX, width - 1),
    sourceY: Math.min(sourceY, height - 1),
    sourceWidth: Math.min(sourceWidth, width - sourceX),
    sourceHeight: Math.min(sourceHeight, height - sourceY),
  };
}

function getExportCrop(width: number, height: number, cropPreset: CropPreset, freeCrop: FreeCropState) {
  if (cropPreset.id === "free") {
    return getFreeCrop(width, height, freeCrop);
  }

  return getCenteredCrop(width, height, cropPreset.exportRatio);
}

function readTextFile(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("File could not be read."));
    reader.readAsText(file);
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, finiteNumber(value, min)));
}

function finiteNumber(value: number | undefined, fallback: number = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clampFreeCrop(crop: FreeCropState): FreeCropState {
  const x = clamp(crop.x, 0, 95);
  const y = clamp(crop.y, 0, 95);
  const width = clamp(crop.width, 5, 100 - x);
  const height = clamp(crop.height, 5, 100 - y);

  return { x, y, width, height };
}

function transformFreeCrop(start: FreeCropState, mode: FreeCropDragMode, deltaX: number, deltaY: number) {
  const minSize = 10;
  let left = start.x;
  let top = start.y;
  let right = start.x + start.width;
  let bottom = start.y + start.height;

  if (mode === "move") {
    return clampFreeCrop({
      ...start,
      x: clamp(start.x + deltaX, 0, 100 - start.width),
      y: clamp(start.y + deltaY, 0, 100 - start.height),
    });
  }

  if (mode.includes("w")) {
    left = clamp(left + deltaX, 0, right - minSize);
  }

  if (mode.includes("e")) {
    right = clamp(right + deltaX, left + minSize, 100);
  }

  if (mode.includes("n")) {
    top = clamp(top + deltaY, 0, bottom - minSize);
  }

  if (mode.includes("s")) {
    bottom = clamp(bottom + deltaY, top + minSize, 100);
  }

  return clampFreeCrop({
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  });
}

function normalizeHexColor(value: string) {
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  return match ? `#${match[1].toLowerCase()}` : null;
}

function clampColorChannel(value: number, min: number, max: number) {
  return Math.round(clamp(Number.isFinite(value) ? value : min, min, max));
}

function hexToRgb(value: string): RgbColor {
  const normalized = normalizeHexColor(value) ?? DEFAULT_TEXT_OVERLAY_VALUES.color;
  const colorValue = Number.parseInt(normalized.slice(1), 16);

  return {
    r: (colorValue >> 16) & 255,
    g: (colorValue >> 8) & 255,
    b: colorValue & 255,
  };
}

function rgbToHex(color: RgbColor) {
  const r = clampColorChannel(color.r, 0, 255);
  const g = clampColorChannel(color.g, 0, 255);
  const b = clampColorChannel(color.b, 0, 255);
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const red = clampColorChannel(r, 0, 255) / 255;
  const green = clampColorChannel(g, 0, 255) / 255;
  const blue = clampColorChannel(b, 0, 255) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, l: Math.round(lightness * 100) };
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;

  if (max === red) {
    hue = ((green - blue) / delta) % 6;
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return {
    h: Math.round((hue * 60 + 360) % 360),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const hue = ((clampColorChannel(h, 0, 360) % 360) + 360) % 360;
  const saturation = clampColorChannel(s, 0, 100) / 100;
  const lightness = clampColorChannel(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) {
    red = chroma;
    green = x;
  } else if (hue < 120) {
    red = x;
    green = chroma;
  } else if (hue < 180) {
    green = chroma;
    blue = x;
  } else if (hue < 240) {
    green = x;
    blue = chroma;
  } else if (hue < 300) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return {
    r: Math.round((red + m) * 255),
    g: Math.round((green + m) * 255),
    b: Math.round((blue + m) * 255),
  };
}

function rgbToCmyk({ r, g, b }: RgbColor): CmykColor {
  const red = clampColorChannel(r, 0, 255) / 255;
  const green = clampColorChannel(g, 0, 255) / 255;
  const blue = clampColorChannel(b, 0, 255) / 255;
  const key = 1 - Math.max(red, green, blue);

  if (key === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  return {
    c: Math.round(((1 - red - key) / (1 - key)) * 100),
    m: Math.round(((1 - green - key) / (1 - key)) * 100),
    y: Math.round(((1 - blue - key) / (1 - key)) * 100),
    k: Math.round(key * 100),
  };
}

function cmykToRgb({ c, m, y, k }: CmykColor): RgbColor {
  const cyan = clampColorChannel(c, 0, 100) / 100;
  const magenta = clampColorChannel(m, 0, 100) / 100;
  const yellow = clampColorChannel(y, 0, 100) / 100;
  const key = clampColorChannel(k, 0, 100) / 100;

  return {
    r: Math.round(255 * (1 - cyan) * (1 - key)),
    g: Math.round(255 * (1 - magenta) * (1 - key)),
    b: Math.round(255 * (1 - yellow) * (1 - key)),
  };
}

function parseColorNumber(value: string, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return clampColorChannel(Number.isFinite(parsed) ? parsed : fallback, min, max);
}

function getUniqueColors(colors: string[]) {
  return colors.reduce<string[]>((uniqueColors, color) => {
    const normalized = normalizeHexColor(color);

    if (normalized && !uniqueColors.includes(normalized)) {
      uniqueColors.push(normalized);
    }

    return uniqueColors;
  }, []);
}

function getWheelPointer(hsl: HslColor) {
  const angle = (hsl.h * Math.PI) / 180;
  const radius = clamp(hsl.s, 0, 100) * 0.46;

  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  };
}

function colorFromWheelPointer(element: HTMLElement, clientX: number, clientY: number, lightness: number) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const deltaX = clientX - centerX;
  const deltaY = clientY - centerY;
  const radius = Math.min(rect.width, rect.height) / 2;
  const hue = Math.round(((Math.atan2(deltaY, deltaX) * 180) / Math.PI + 360) % 360);
  const saturation = Math.round(clamp(Math.sqrt(deltaX ** 2 + deltaY ** 2) / radius, 0, 1) * 100);

  return rgbToHex(hslToRgb({ h: hue, s: saturation, l: lightness }));
}

function sampleImageColorAt(
  imageUrl: string,
  xPercent: number,
  yPercent: number,
  filter: string,
  cropPreset: CropPreset,
  freeCrop: FreeCropState,
) {
  return new Promise<string>((resolve, reject) => {
    const sourceImage = new Image();

    if (/^https?:/i.test(imageUrl)) {
      sourceImage.crossOrigin = "anonymous";
    }

    sourceImage.onload = () => {
      const sourceWidth = sourceImage.naturalWidth || sourceImage.width;
      const sourceHeight = sourceImage.naturalHeight || sourceImage.height;

      if (!sourceWidth || !sourceHeight) {
        reject(new Error("Image pixel could not be sampled."));
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Image pixel could not be sampled."));
        return;
      }

      context.filter = filter || "none";
      context.drawImage(sourceImage, 0, 0, sourceWidth, sourceHeight);

      const sampleCrop =
        cropPreset.id === "free"
          ? { sourceX: 0, sourceY: 0, sourceWidth, sourceHeight }
          : getExportCrop(sourceWidth, sourceHeight, cropPreset, freeCrop);
      const sampleX = clampColorChannel(sampleCrop.sourceX + (sampleCrop.sourceWidth * xPercent) / 100, 0, sourceWidth - 1);
      const sampleY = clampColorChannel(sampleCrop.sourceY + (sampleCrop.sourceHeight * yPercent) / 100, 0, sourceHeight - 1);
      const [r, g, b] = context.getImageData(sampleX, sampleY, 1, 1).data;
      resolve(rgbToHex({ r, g, b }));
    };

    sourceImage.onerror = () => reject(new Error("Image pixel could not be sampled."));
    sourceImage.src = imageUrl;
  });
}

function formatExportDate(date = new Date()) {
  const year = date.getFullYear().toString().slice(-2);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}

function makeExportFileName(fileName: string | null) {
  const baseName = fileName?.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "");
  return `LS-Web-${formatExportDate()}-${baseName || "image"}.png`;
}

function normalizeOutputFormat(value: string | undefined) {
  if (value === "png" || value === "webp") {
    return value;
  }

  return "jpeg";
}

function toRestoredDataUrl(imageBase64: string, outputFormat: string | undefined) {
  return `data:image/${normalizeOutputFormat(outputFormat)};base64,${imageBase64}`;
}

async function loadImageAsBase64(imageUrl: string) {
  if (imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error("Image could not be prepared for AI restore.");
  }

  return readBlobAsDataUrl(await response.blob());
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Image could not be prepared for AI restore."));
    };
    reader.onerror = () => reject(new Error("Image could not be prepared for AI restore."));
    reader.readAsDataURL(blob);
  });
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return "AI face restoration failed.";
}

function createTextOverlay(existingCount: number): TextOverlayState {
  textOverlaySequence += 1;
  const offset = Math.min(existingCount * 6, 18);

  return {
    id: `text-${Date.now()}-${textOverlaySequence}`,
    ...DEFAULT_TEXT_OVERLAY_VALUES,
    x: Math.min(82, DEFAULT_TEXT_OVERLAY_VALUES.x + offset),
    y: Math.min(82, DEFAULT_TEXT_OVERLAY_VALUES.y + offset),
  };
}

function getStatusColor(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("failed") || normalized.includes("required") || normalized.includes("error")) {
    return "#fca5a5";
  }

  if (normalized.includes("processing") || normalized.includes("exporting")) {
    return "#fbbf24";
  }

  if (normalized.includes("complete") || normalized.includes("exported")) {
    return "#86efac";
  }

  return "#a9a5ff";
}

function getExportButtonLabel(status: string, isHovered: boolean) {
  if (status === "Export") {
    return isHovered ? "Ready" : "Export";
  }

  return status;
}

function Brand() {
  return (
    <Stack direction="row" spacing={{ xs: 1, sm: 1.35, md: 1.4 }} alignItems="center" sx={{ minWidth: 0 }}>
      <Box
        component="img"
        src="/ls-logo.png"
        alt=""
        sx={{
          width: { xs: 38, sm: 44, md: 48, lg: 52 },
          height: { xs: 38, sm: 44, md: 48, lg: 52 },
          borderRadius: { xs: 1.8, sm: 2, md: 2.2 },
          display: "block",
          objectFit: "cover",
          flexShrink: 0,
          boxShadow: "0 0 16px rgba(124,102,255,0.45)",
        }}
      />
      <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 0.05, md: 0.6 }} alignItems={{ xs: "flex-start", md: "baseline" }} sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: 22, sm: 26, md: 27, lg: 30 },
            fontWeight: 700,
            color: "#e4e4f2",
            lineHeight: 1,
            maxWidth: { xs: 88, sm: 118, md: "none" },
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Lumina
        </Typography>
        <Typography sx={{ fontSize: { xs: 11, sm: 13, md: 13, lg: 14 }, color: "#6868a0", letterSpacing: { xs: "0.2em", md: "0.12em" }, lineHeight: 1 }}>
          STUDIO
        </Typography>
      </Stack>
    </Stack>
  );
}

function ToolButton({
  active,
  label,
  mobileLabel,
  hideOnMobile,
  dataTour,
  children,
  onClick,
}: {
  active?: boolean;
  label: string;
  mobileLabel?: string;
  hideOnMobile?: boolean;
  dataTour?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <IconButton
      aria-label={label}
      title={label}
      data-tour={dataTour}
      onClick={onClick}
      sx={{
        display: { xs: hideOnMobile ? "none" : "inline-flex", md: "inline-flex" },
        width: { xs: 70, md: 50, lg: 52 },
        height: { xs: 64, md: 50, lg: 52 },
        borderRadius: { xs: 2, md: 1.7 },
        flexDirection: { xs: "column", md: "row" },
        gap: { xs: 0.55, md: 0 },
        color: active ? "#a78bfa" : "#52527a",
        bgcolor: active ? "rgba(124,102,255,0.18)" : "transparent",
        outline: active ? "1px solid rgba(124,102,255,0.35)" : "none",
        "& svg": { fontSize: { xs: 24, md: 26, lg: 28 } },
        "&:hover": { bgcolor: "rgba(124,102,255,0.12)", color: "#a78bfa" },
      }}
    >
      {children}
      <Box
        component="span"
        sx={{
          display: { xs: "block", md: "none" },
          color: active ? "#c4b5fd" : "#8888b8",
          fontSize: 11,
          fontWeight: active ? 800 : 600,
          lineHeight: 1,
        }}
      >
        {mobileLabel ?? label}
      </Box>
    </IconButton>
  );
}

function FilterPresetCarousel({
  presets,
  selectedPreset,
  previewUrl,
  onSelect,
}: {
  presets: FilterPreset[];
  selectedPreset: FilterPreset;
  previewUrl: string | null;
  onSelect: (preset: FilterPreset) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    setCanScrollPrevious(scroller.scrollLeft > 2);
    setCanScrollNext(scroller.scrollLeft < maxScrollLeft - 2);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;

    updateScrollState();
    scroller.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateScrollState) : null;
    resizeObserver?.observe(scroller);

    return () => {
      scroller.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      resizeObserver?.disconnect();
    };
  }, [updateScrollState]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const selectedButton = Array.from(scroller.querySelectorAll<HTMLElement>("[data-filter-id]")).find(
      (element) => element.dataset.filterId === selectedPreset.id,
    );
    if (selectedButton && typeof selectedButton.scrollIntoView === "function") {
      selectedButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
    window.setTimeout(updateScrollState, 180);
  }, [selectedPreset.id, updateScrollState]);

  const scrollByGroup = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction * Math.max(scroller.clientWidth * 0.82, 180),
      behavior: "smooth",
    });
    window.setTimeout(updateScrollState, 240);
  };

  const arrowSx = {
    width: { xs: 42, md: 50, lg: 54 },
    height: { xs: 72, md: 92, lg: 100 },
    flexShrink: 0,
    borderRadius: 2.1,
    color: "#a78bfa",
    border: "1px solid rgba(124,102,255,0.24)",
    bgcolor: "rgba(16,16,30,0.86)",
    boxShadow: "inset 0 0 18px rgba(124,102,255,0.08), 0 12px 30px rgba(0,0,0,0.26)",
    transition: "opacity 0.18s ease, color 0.18s ease, border-color 0.18s ease, background-color 0.18s ease",
    "&:hover": {
      color: "#ffffff",
      borderColor: "rgba(167,139,250,0.52)",
      bgcolor: "rgba(124,102,255,0.18)",
    },
    "&.Mui-disabled": {
      color: "rgba(104,104,160,0.42)",
      borderColor: "rgba(255,255,255,0.055)",
      bgcolor: "rgba(255,255,255,0.025)",
      boxShadow: "none",
      opacity: 0.55,
    },
  };

  return (
    <Stack direction="row" alignItems="center" spacing={{ xs: 0.8, md: 1.25 }} sx={{ flex: "1 1 auto", width: "100%", minWidth: 0 }}>
      <IconButton aria-label="Previous filters" disabled={!canScrollPrevious} onClick={() => scrollByGroup(-1)} sx={arrowSx}>
        <KeyboardArrowLeftIcon sx={{ fontSize: { xs: 36, md: 44, lg: 48 } }} />
      </IconButton>
      <Box
        ref={scrollerRef}
        role="list"
        aria-label="Filter presets"
        sx={{
          "--filter-card-width": EDITOR_LAYOUT.filterCardWidth,
          flex: 1,
          minWidth: 0,
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "var(--filter-card-width)",
          gap: { xs: 1.45, md: 1.9, lg: 2.15 },
          px: { xs: 0.4, md: 0.65 },
          py: { xs: 0.65, md: 0.8 },
          overflowX: "auto",
          overscrollBehaviorX: "contain",
          scrollBehavior: "smooth",
          scrollPaddingInline: { xs: 8, md: 12 },
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {presets.map((preset) => {
          const active = selectedPreset.id === preset.id;
          const tone = FILTER_PREVIEW_TONES[preset.id] ?? FILTER_PREVIEW_TONES.original;
          const previewFilter = [buildCSSFilter({ ...DEFAULT_ADJUSTMENTS }, preset, false), tone.imageFilter].filter(Boolean).join(" ");
          const overlayBackground = previewUrl ? tone.imageOverlay ?? tone.overlay ?? "transparent" : tone.overlay ?? "transparent";

          return (
            <Box key={preset.id} role="listitem" sx={{ minWidth: 0 }}>
              <Box
                component="button"
                type="button"
                data-filter-id={preset.id}
                aria-label={preset.name}
                onClick={() => onSelect(preset)}
                sx={{
                  width: "100%",
                  p: 0,
                  border: 0,
                  bgcolor: "transparent",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: { xs: 0.85, md: 1 },
                  opacity: active ? 1 : 0.94,
                  cursor: "pointer",
                  textAlign: "center",
                  "&:focus-visible .filter-preview-card": {
                    outline: "2px solid #c4b5fd",
                    outlineOffset: 3,
                  },
                }}
              >
                <Box
                  className="filter-preview-card"
                  sx={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: { xs: "1.14 / 1", md: "1.46 / 1" },
                    borderRadius: { xs: 1.9, md: 1.55 },
                    overflow: "hidden",
                    background: tone.background,
                    border: active ? "3px solid #7c66ff" : "2px solid rgba(255,255,255,0.085)",
                    boxShadow: active
                      ? "0 0 0 2px rgba(124,102,255,0.18), 0 14px 34px rgba(124,102,255,0.18)"
                      : "inset 0 0 0 1px rgba(0,0,0,0.32), 0 10px 24px rgba(0,0,0,0.2)",
                    transition: "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
                    ".MuiBox-root:hover &": { transform: "translateY(-1px)" },
                  }}
                >
                  {previewUrl && (
                    <Box
                      component="img"
                      src={previewUrl}
                      alt=""
                      aria-hidden="true"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        filter: previewFilter,
                        opacity: tone.imageOpacity ?? 1,
                      }}
                    />
                  )}
                  {overlayBackground !== "transparent" && (
                    <Box
                      aria-hidden="true"
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background: overlayBackground,
                        mixBlendMode: tone.overlayMixBlendMode ?? "normal",
                        opacity: tone.overlayOpacity ?? 1,
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </Box>
                <Typography
                  component="span"
                  noWrap
                  sx={{
                    width: "100%",
                    color: active ? "#a78bfa" : "#6f6aa3",
                    fontSize: { xs: 12.5, md: 13.5, lg: 14 },
                    fontWeight: active ? 800 : 650,
                    lineHeight: 1.05,
                  }}
                >
                  {preset.name}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
      <IconButton aria-label="Next filters" disabled={!canScrollNext} onClick={() => scrollByGroup(1)} sx={arrowSx}>
        <KeyboardArrowRightIcon sx={{ fontSize: { xs: 36, md: 44, lg: 48 } }} />
      </IconButton>
    </Stack>
  );
}

function SectionHeader({
  label,
  expanded,
  onClick,
}: {
  label: string;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      fullWidth
      onClick={onClick}
      endIcon={expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
      sx={{
        justifyContent: "space-between",
        px: 0,
        py: { xs: 1.25, md: 1.45 },
        color: expanded ? "#a9a5ff" : "#6868a0",
        fontSize: { xs: 12, md: 13 },
        fontWeight: 800,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        "&:hover": { bgcolor: "transparent", color: "#a9a5ff" },
      }}
    >
      {label}
    </Button>
  );
}

function AdjSlider({
  label,
  value,
  onChange,
  icon,
  min = -100,
  max = 100,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon?: ReactNode;
  min?: number;
  max?: number;
}) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.15 }}>
        <Stack direction="row" spacing={1.1} alignItems="center">
          <Box sx={{ display: "flex", color: "#6868a0", "& svg": { fontSize: 16 } }}>{icon}</Box>
          <Typography
            sx={{
              color: "#8888d8",
              fontSize: { xs: 12, md: 13 },
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}
          >
            {label}
          </Typography>
        </Stack>
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: { xs: 11, md: 12 },
            color: value === 0 ? "#6868a0" : "#a78bfa",
          }}
        >
          {fmtVal(value)}
        </Typography>
      </Stack>
      <Slider
        min={min}
        max={max}
        value={value}
        onChange={(_, next) => onChange(next as number)}
        aria-label={label}
        size="small"
        sx={{
          height: 24,
          py: 0.8,
          px: 0,
          color: "#7c66ff",
          "& .MuiSlider-rail": {
            height: 3,
            bgcolor: "rgba(255,255,255,0.12)",
            opacity: 1,
          },
          "& .MuiSlider-track": { height: 3 },
          "& .MuiSlider-thumb": {
            width: 16,
            height: 16,
            bgcolor: value === 0 ? "rgba(255,255,255,0.28)" : "#a78bfa",
            boxShadow: value === 0 ? "none" : "0 0 10px rgba(124,102,255,0.5)",
          },
        }}
      />
    </Box>
  );
}

function ColorSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  track,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  track?: string;
}) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.7 }}>
        <Typography sx={{ color: "#8888d8", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {label}
        </Typography>
        <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', color: "#c4b5fd", fontSize: 11 }}>
          {Math.round(value)}
        </Typography>
      </Stack>
      <Slider
        min={min}
        max={max}
        value={value}
        onChange={(_, next) => onChange(next as number)}
        aria-label={label}
        size="small"
        sx={{
          height: 18,
          p: 0,
          color: "#a78bfa",
          "& .MuiSlider-rail": {
            height: 5,
            opacity: 1,
            bgcolor: "rgba(255,255,255,0.14)",
            background: track,
            borderRadius: 99,
          },
          "& .MuiSlider-track": {
            height: 5,
            border: "none",
            bgcolor: track ? "transparent" : "#a78bfa",
          },
          "& .MuiSlider-thumb": {
            width: 14,
            height: 14,
            bgcolor: "#f8fafc",
            border: "2px solid #a78bfa",
            boxShadow: "0 0 12px rgba(167,139,250,0.55)",
          },
        }}
      />
    </Box>
  );
}

function ColorNumberField({
  label,
  ariaLabel,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  ariaLabel: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: string) => void;
}) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      type="number"
      inputProps={{ "aria-label": ariaLabel, min, max, inputMode: "numeric" }}
      size="small"
      sx={{
        "& .MuiInputBase-input": {
          color: "#f8fafc",
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 12,
          px: 1,
          py: 1,
        },
        "& .MuiInputLabel-root": { color: "#6868a0", fontSize: 11 },
        "& .MuiInputLabel-root.Mui-focused": { color: "#a78bfa" },
        "& .MuiOutlinedInput-root": {
          bgcolor: "rgba(0,0,0,0.34)",
          borderRadius: 1.1,
          "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
          "&:hover fieldset": { borderColor: "rgba(167,139,250,0.35)" },
          "&.Mui-focused fieldset": { borderColor: "rgba(167,139,250,0.65)" },
        },
      }}
    />
  );
}

function TextColorPickerPanel({
  color,
  recentColors,
  eyedropperActive,
  onColorChange,
  onRequestEyedropper,
}: {
  color: string;
  recentColors: string[];
  eyedropperActive: boolean;
  onColorChange: (color: string) => void;
  onRequestEyedropper: () => void;
}) {
  const normalizedColor = normalizeHexColor(color) ?? DEFAULT_TEXT_OVERLAY_VALUES.color;
  const rgb = hexToRgb(normalizedColor);
  const hsl = rgbToHsl(rgb);
  const cmyk = rgbToCmyk(rgb);
  const wheelPointer = getWheelPointer(hsl);
  const swatchColors = getUniqueColors([...recentColors, ...TEXT_COLOR_SWATCHES]);
  const [mode, setMode] = useState<ColorPickerMode>("swatches");
  const [hexDraft, setHexDraft] = useState(normalizedColor);
  const [wheelDragging, setWheelDragging] = useState(false);

  useEffect(() => {
    setHexDraft(normalizedColor);
  }, [normalizedColor]);

  const applyRgb = (patch: Partial<RgbColor>) => {
    onColorChange(rgbToHex({ ...rgb, ...patch }));
  };

  const applyHsl = (patch: Partial<HslColor>) => {
    onColorChange(rgbToHex(hslToRgb({ ...hsl, ...patch })));
  };

  const applyCmyk = (patch: Partial<CmykColor>) => {
    onColorChange(rgbToHex(cmykToRgb({ ...cmyk, ...patch })));
  };

  const applyWheelColor = (event: PointerEvent<HTMLElement>) => {
    event.preventDefault();
    onColorChange(colorFromWheelPointer(event.currentTarget, event.clientX, event.clientY, hsl.l));
  };

  const modeOptions: Array<{ id: ColorPickerMode; label: string; icon: ReactNode }> = [
    { id: "swatches", label: "Swatches", icon: <GridViewIcon fontSize="small" /> },
    { id: "wheel", label: "Color wheel", icon: <DonutLargeIcon fontSize="small" /> },
    { id: "sliders", label: "Color sliders", icon: <TuneIcon fontSize="small" /> },
    { id: "codes", label: "Color codes", icon: <CodeIcon fontSize="small" /> },
  ];

  return (
    <Box sx={{ width: 316, p: 1.5 }}>
      <Stack spacing={1.4}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              data-testid="text-color-current"
              data-color={normalizedColor}
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1,
                bgcolor: normalizedColor,
                border: "1px solid rgba(255,255,255,0.42)",
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.42)",
              }}
            />
            <Typography
              sx={{
                color: "#f8fafc",
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {normalizedColor}
            </Typography>
          </Stack>
          <Tooltip title="Eyedropper">
            <IconButton
              aria-label="Eyedropper"
              aria-pressed={eyedropperActive}
              onClick={onRequestEyedropper}
              size="small"
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1.1,
                color: eyedropperActive ? "#ffffff" : "#a9a5ff",
                bgcolor: eyedropperActive ? "rgba(124,102,255,0.45)" : "rgba(255,255,255,0.05)",
                border: eyedropperActive ? "1px solid rgba(255,255,255,0.46)" : "1px solid rgba(255,255,255,0.08)",
                "&:hover": { bgcolor: "rgba(124,102,255,0.25)" },
              }}
            >
              <ColorizeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={0.75} aria-label="Text color modes">
          {modeOptions.map((option) => (
            <Tooltip key={option.id} title={option.label}>
              <IconButton
                aria-label={option.label}
                aria-pressed={mode === option.id}
                onClick={() => setMode(option.id)}
                size="small"
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.1,
                  color: mode === option.id ? "#ffffff" : "#8888d8",
                  bgcolor: mode === option.id ? "rgba(124,102,255,0.34)" : "rgba(255,255,255,0.04)",
                  border: mode === option.id ? "1px solid rgba(167,139,250,0.72)" : "1px solid rgba(255,255,255,0.07)",
                  "&:hover": { bgcolor: "rgba(124,102,255,0.2)", color: "#ffffff" },
                }}
              >
                {option.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Stack>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        {mode === "swatches" && (
          <Box role="group" aria-label="Text color swatches" sx={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 0.9 }}>
            {swatchColors.map((swatch) => (
              <Box
                key={swatch}
                component="button"
                type="button"
                aria-label={`Select ${swatch}`}
                onClick={() => onColorChange(swatch)}
                sx={{
                  width: 36,
                  height: 32,
                  borderRadius: 1,
                  bgcolor: swatch,
                  border: swatch === normalizedColor ? "2px solid #ffffff" : "1px solid rgba(255,255,255,0.18)",
                  boxShadow: swatch === normalizedColor ? "0 0 0 2px rgba(124,102,255,0.58)" : "inset 0 0 0 1px rgba(0,0,0,0.28)",
                  cursor: "pointer",
                }}
              />
            ))}
          </Box>
        )}

        {mode === "wheel" && (
          <Stack spacing={1.7} alignItems="center">
            <Box
              role="slider"
              aria-label="Color wheel"
              aria-valuetext={`Hue ${hsl.h}, saturation ${hsl.s}`}
              tabIndex={0}
              onPointerDown={(event) => {
                setWheelDragging(true);
                event.currentTarget.setPointerCapture(event.pointerId);
                applyWheelColor(event);
              }}
              onPointerMove={(event) => {
                if (wheelDragging) applyWheelColor(event);
              }}
              onPointerUp={(event) => {
                setWheelDragging(false);
                event.currentTarget.releasePointerCapture(event.pointerId);
              }}
              onPointerCancel={() => setWheelDragging(false)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                  applyHsl({ h: (hsl.h + 3) % 360 });
                }
                if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                  applyHsl({ h: (hsl.h - 3 + 360) % 360 });
                }
              }}
              sx={{
                position: "relative",
                width: 166,
                height: 166,
                borderRadius: "50%",
                cursor: "crosshair",
                background:
                  "radial-gradient(circle, #ffffff 0%, rgba(255,255,255,0) 68%), conic-gradient(from 0deg, #f87171, #facc15, #22c55e, #06b6d4, #6366f1, #d946ef, #f87171)",
                border: "1px solid rgba(255,255,255,0.22)",
                boxShadow: "0 18px 45px rgba(0,0,0,0.34), inset 0 0 18px rgba(0,0,0,0.35)",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  left: `${wheelPointer.x}%`,
                  top: `${wheelPointer.y}%`,
                  width: 14,
                  height: 14,
                  transform: "translate(-50%, -50%)",
                  borderRadius: "50%",
                  border: "2px solid #ffffff",
                  bgcolor: normalizedColor,
                  boxShadow: "0 0 0 2px rgba(0,0,0,0.45), 0 0 18px rgba(255,255,255,0.3)",
                  pointerEvents: "none",
                }}
              />
            </Box>
            <Box sx={{ width: "100%" }}>
              <ColorSlider label="Lightness" value={hsl.l} onChange={(value) => applyHsl({ l: value })} min={0} max={100} />
            </Box>
          </Stack>
        )}

        {mode === "sliders" && (
          <Stack spacing={1.35}>
            <ColorSlider label="Red" value={rgb.r} onChange={(value) => applyRgb({ r: value })} min={0} max={255} track="linear-gradient(90deg, #000000, #ef4444)" />
            <ColorSlider label="Green" value={rgb.g} onChange={(value) => applyRgb({ g: value })} min={0} max={255} track="linear-gradient(90deg, #000000, #22c55e)" />
            <ColorSlider label="Blue" value={rgb.b} onChange={(value) => applyRgb({ b: value })} min={0} max={255} track="linear-gradient(90deg, #000000, #3b82f6)" />
            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
            <ColorSlider label="Hue" value={hsl.h} onChange={(value) => applyHsl({ h: value })} min={0} max={360} track="linear-gradient(90deg, #ef4444, #facc15, #22c55e, #06b6d4, #6366f1, #d946ef, #ef4444)" />
            <ColorSlider label="Saturation" value={hsl.s} onChange={(value) => applyHsl({ s: value })} min={0} max={100} />
            <ColorSlider label="Lightness" value={hsl.l} onChange={(value) => applyHsl({ l: value })} min={0} max={100} />
          </Stack>
        )}

        {mode === "codes" && (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 1 }}>
            <TextField
              label="Hex"
              value={hexDraft}
              onChange={(event) => {
                setHexDraft(event.target.value);
                const normalized = normalizeHexColor(event.target.value);
                if (normalized) onColorChange(normalized);
              }}
              inputProps={{ "aria-label": "Hex code" }}
              size="small"
              sx={{
                gridColumn: "1 / -1",
                "& .MuiInputBase-input": {
                  color: "#f8fafc",
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 12,
                  textTransform: "uppercase",
                },
                "& .MuiInputLabel-root": { color: "#6868a0", fontSize: 11 },
                "& .MuiInputLabel-root.Mui-focused": { color: "#a78bfa" },
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(0,0,0,0.34)",
                  borderRadius: 1.1,
                  "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
                  "&:hover fieldset": { borderColor: "rgba(167,139,250,0.35)" },
                  "&.Mui-focused fieldset": { borderColor: "rgba(167,139,250,0.65)" },
                },
              }}
            />
            <ColorNumberField label="R" ariaLabel="RGB red" value={rgb.r} min={0} max={255} onChange={(value) => applyRgb({ r: parseColorNumber(value, rgb.r, 0, 255) })} />
            <ColorNumberField label="G" ariaLabel="RGB green" value={rgb.g} min={0} max={255} onChange={(value) => applyRgb({ g: parseColorNumber(value, rgb.g, 0, 255) })} />
            <ColorNumberField label="B" ariaLabel="RGB blue" value={rgb.b} min={0} max={255} onChange={(value) => applyRgb({ b: parseColorNumber(value, rgb.b, 0, 255) })} />
            <Box />
            <ColorNumberField label="H" ariaLabel="HSL hue" value={hsl.h} min={0} max={360} onChange={(value) => applyHsl({ h: parseColorNumber(value, hsl.h, 0, 360) })} />
            <ColorNumberField label="S" ariaLabel="HSL saturation" value={hsl.s} min={0} max={100} onChange={(value) => applyHsl({ s: parseColorNumber(value, hsl.s, 0, 100) })} />
            <ColorNumberField label="L" ariaLabel="HSL lightness" value={hsl.l} min={0} max={100} onChange={(value) => applyHsl({ l: parseColorNumber(value, hsl.l, 0, 100) })} />
            <Box />
            <ColorNumberField label="C" ariaLabel="CMYK cyan" value={cmyk.c} min={0} max={100} onChange={(value) => applyCmyk({ c: parseColorNumber(value, cmyk.c, 0, 100) })} />
            <ColorNumberField label="M" ariaLabel="CMYK magenta" value={cmyk.m} min={0} max={100} onChange={(value) => applyCmyk({ m: parseColorNumber(value, cmyk.m, 0, 100) })} />
            <ColorNumberField label="Y" ariaLabel="CMYK yellow" value={cmyk.y} min={0} max={100} onChange={(value) => applyCmyk({ y: parseColorNumber(value, cmyk.y, 0, 100) })} />
            <ColorNumberField label="K" ariaLabel="CMYK key" value={cmyk.k} min={0} max={100} onChange={(value) => applyCmyk({ k: parseColorNumber(value, cmyk.k, 0, 100) })} />
          </Box>
        )}
      </Stack>
    </Box>
  );
}

function Histogram({ adjustments }: { adjustments: Adjustments }) {
  const width = 292;
  const height = 84;
  const makePath = (shift: number, spread: number) => {
    const points: string[] = [];
    const peak = 0.44 + shift + adjustments.exposure * 0.002;
    const sp = spread + Math.abs(adjustments.contrast) * 0.0006;
    for (let i = 0; i <= 70; i += 1) {
      const t = i / 70;
      const y = Math.exp(-Math.pow((t - peak) / sp, 2));
      points.push(`${(t * width).toFixed(1)},${(height - y * height * 0.78).toFixed(1)}`);
    }
    return `M 0,${height} L ${points.join(" L ")} L ${width},${height} Z`;
  };

  return (
    <Box
      sx={{
        border: "1px solid rgba(255,255,255,0.055)",
        bgcolor: "#0a0a14",
        borderRadius: 2,
        p: 2,
      }}
    >
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: 10, color: "#4a4a78", fontWeight: 800, letterSpacing: "0.14em" }}>
          HISTOGRAM
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Typography sx={{ fontFamily: '"JetBrains Mono"', color: "#ef4444", fontSize: 10 }}>R</Typography>
          <Typography sx={{ fontFamily: '"JetBrains Mono"', color: "#22c55e", fontSize: 10 }}>G</Typography>
          <Typography sx={{ fontFamily: '"JetBrains Mono"', color: "#3b82f6", fontSize: 10 }}>B</Typography>
        </Stack>
      </Stack>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 74, display: "block" }}>
        {[
          { d: makePath(-0.07, 0.17), color: "#ef4444" },
          { d: makePath(0.0, 0.19), color: "#22c55e" },
          { d: makePath(0.06, 0.15), color: "#3b82f6" },
        ].map((channel) => (
          <path
            key={channel.color}
            d={channel.d}
            fill={channel.color}
            fillOpacity={0.22}
            stroke={channel.color}
            strokeOpacity={0.65}
            strokeWidth={1}
          />
        ))}
      </svg>
    </Box>
  );
}

export function EditorWorkspace() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [hasAuthToken, setHasAuthToken] = useState(false);
  const [selectedTool, setSelectedTool] = useState("select");
  const [selectedPreset, setSelectedPreset] = useState(FILTER_PRESETS[0]);
  const [adjustments, setAdjustments] = useState<Adjustments>({ ...DEFAULT_ADJUSTMENTS });
  const [cropPresetId, setCropPresetId] = useState<(typeof CROP_PRESETS)[number]["id"]>("none");
  const [freeCrop, setFreeCrop] = useState<FreeCropState>({ ...DEFAULT_FREE_CROP });
  const [draftFreeCrop, setDraftFreeCrop] = useState<FreeCropState>({ ...DEFAULT_FREE_CROP });
  const [freeCropEditing, setFreeCropEditing] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [textOverlays, setTextOverlays] = useState<TextOverlayState[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [colorPickerAnchorEl, setColorPickerAnchorEl] = useState<HTMLElement | null>(null);
  const [recentTextColors, setRecentTextColors] = useState<string[]>([]);
  const [eyedropperActive, setEyedropperActive] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [hfToken, setHfToken] = useState("");
  const [useSavedHfToken, setUseSavedHfToken] = useState(false);
  const [aiRestoring, setAiRestoring] = useState(false);
  const [aiStatus, setAiStatus] = useState("Ready");
  const [exportStatus, setExportStatus] = useState("Export");
  const [cropStatus, setCropStatus] = useState("No crop selected");
  const [exportHovered, setExportHovered] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);
  const [savedPresets, setSavedPresets] = useState<Preset[]>([]);
  const [selectedSavedPresetId, setSelectedSavedPresetId] = useState("none");
  const [presetLoading, setPresetLoading] = useState(false);
  const [presetError, setPresetError] = useState<string | null>(null);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetSaving, setPresetSaving] = useState(false);
  const [expanded, setExpanded] = useState(DEFAULT_EXPANDED_SECTIONS);
  const exportStatusTimeoutRef = useRef<number | null>(null);
  const aiStatusTimeoutRef = useRef<number | null>(null);
  const resetTimeoutRef = useRef<number | null>(null);
  const tourDriverRef = useRef<Driver | null>(null);
  const tourPersistOnDestroyRef = useRef(true);
  const freeCropDragRef = useRef<FreeCropDragState | null>(null);
  const colorPickerReturnAnchorRef = useRef<HTMLElement | null>(null);

  const loadSavedPresets = useCallback(async () => {
    setPresetLoading(true);
    setPresetError(null);
    try {
      setSavedPresets(await presetsApi.list());
    } catch (error) {
      setPresetError(getApiErrorMessage(error));
    } finally {
      setPresetLoading(false);
    }
  }, []);

  const startEditorTour = useCallback(async () => {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    try {
      const { driver } = await import("driver.js");

      tourPersistOnDestroyRef.current = false;
      tourDriverRef.current?.destroy();
      tourPersistOnDestroyRef.current = true;
      const tour = driver({
        steps: createEditorDriverSteps(),
        animate: !prefersReducedMotion,
        smoothScroll: true,
        allowClose: true,
        allowKeyboardControl: true,
        overlayColor: "#08080e",
        overlayOpacity: 0.72,
        overlayClickBehavior: "close",
        stagePadding: 8,
        stageRadius: 10,
        popoverClass: "lumina-driver-tour",
        showButtons: ["previous", "next", "close"],
        showProgress: true,
        progressText: "{{current}} / {{total}}",
        prevBtnText: "Back",
        nextBtnText: "Next",
        doneBtnText: "Done",
        onDestroyed: () => {
          if (tourPersistOnDestroyRef.current) {
            setBrowserPreference("editorTourShown", true);
          }
          tourDriverRef.current = null;
        },
      });

      tourDriverRef.current = tour;
      tour.drive();
    } catch {
      tourDriverRef.current = null;
    }
  }, []);

  useEffect(() => {
    setGuestSessionId(getOrCreateGuestSessionId());
    setHasAuthToken(Boolean(getApiAuthToken()));
    const preferences = getBrowserPreferences();
    let tourFrame: number | null = null;

    if (preferences.editorExpandedSections) {
      setExpanded((current) => ({
        ...current,
        ...preferences.editorExpandedSections,
      }));
    }

    if (!preferences.editorTourShown) {
      tourFrame = window.requestAnimationFrame(() => {
        void startEditorTour();
      });
    }

    return () => {
      if (tourFrame) {
        window.cancelAnimationFrame(tourFrame);
      }

      tourPersistOnDestroyRef.current = false;
      tourDriverRef.current?.destroy();
      tourDriverRef.current = null;
      tourPersistOnDestroyRef.current = true;

      if (exportStatusTimeoutRef.current) {
        window.clearTimeout(exportStatusTimeoutRef.current);
      }

      if (aiStatusTimeoutRef.current) {
        window.clearTimeout(aiStatusTimeoutRef.current);
      }

      if (resetTimeoutRef.current) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    };
  }, [startEditorTour]);

  useEffect(() => {
    if (!hasAuthToken) {
      setSavedPresets([]);
      setSelectedSavedPresetId("none");
      setPresetError("Sign in to save and sync presets.");
      return;
    }

    void loadSavedPresets();
  }, [hasAuthToken, loadSavedPresets]);

  const imageUrl = uploadedImage;
  const filterPreviewUrl = imageUrl;
  const imageAlt = uploadedImage ? "Uploaded workspace image" : "";
  const cssFilter = useMemo(
    () => buildCSSFilter(adjustments, selectedPreset, showOriginal),
    [adjustments, selectedPreset, showOriginal],
  );
  const activeFilterAdjustments = useMemo(() => mergePresetAdjustments(adjustments, selectedPreset), [adjustments, selectedPreset]);
  const filterEffectOverlaySx = useMemo(() => getFilterEffectOverlaySx(activeFilterAdjustments, showOriginal), [activeFilterAdjustments, showOriginal]);
  const cropPreset = CROP_PRESETS.find((preset) => preset.id === cropPresetId) ?? CROP_PRESETS[0];
  const freeCropPreviewActive = !showOriginal && cropPreset.id === "free" && !freeCropEditing;
  const activeCropRatio = showOriginal || cropPreset.id === "none" || cropPreset.id === "free" ? null : cropPreset.ratio;
  const appliedFreeCropRatio = freeCropPreviewActive ? `${freeCrop.width} / ${freeCrop.height}` : null;
  const previewCropRatio = activeCropRatio ?? appliedFreeCropRatio;
  const cropMode = showOriginal ? "none" : freeCropPreviewActive ? "free-applied" : cropPreset.id === "free" ? "free-editing" : activeCropRatio ?? "none";
  const previewTransform = showOriginal ? "none" : buildPreviewTransform(rotation, flipHorizontal, flipVertical);
  const selectedTextOverlay = textOverlays.find((overlay) => overlay.id === selectedTextId) ?? null;
  const selectedTextColor = selectedTextOverlay?.color ?? DEFAULT_TEXT_OVERLAY_VALUES.color;
  const exportButtonLabel = getExportButtonLabel(exportStatus, exportHovered);
  const colorPickerOpen = Boolean(colorPickerAnchorEl);
  const selectedSavedPreset = savedPresets.find((preset) => preset.id === selectedSavedPresetId) ?? null;

  useEffect(() => {
    if (!selectedTextOverlay) {
      setColorPickerAnchorEl(null);
      setEyedropperActive(false);
      colorPickerReturnAnchorRef.current = null;
    }
  }, [selectedTextOverlay]);

  useEffect(() => {
    if (selectedTool !== "text") {
      setColorPickerAnchorEl(null);
      setEyedropperActive(false);
      colorPickerReturnAnchorRef.current = null;
    }
  }, [selectedTool]);

  useEffect(() => {
    if (!eyedropperActive) return undefined;

    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "crosshair";

    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [eyedropperActive]);

  const updateAdj = (key: keyof Adjustments, value: number) => {
    setAdjustments((current) => ({ ...current, [key]: value }));
    setSelectedPreset(FILTER_PRESETS[0]);
  };

  const resetManualState = () => {
    setAdjustments({ ...DEFAULT_ADJUSTMENTS });
    setSelectedPreset(FILTER_PRESETS[0]);
    setCropPresetId("none");
    setCropStatus("No crop selected");
    setFreeCrop({ ...DEFAULT_FREE_CROP });
    setDraftFreeCrop({ ...DEFAULT_FREE_CROP });
    setFreeCropEditing(false);
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setTextOverlays([]);
    setSelectedTextId(null);
    setDraggingTextId(null);
    setColorPickerAnchorEl(null);
    setEyedropperActive(false);
    colorPickerReturnAnchorRef.current = null;
    setShowOriginal(false);
  };

  const serializeCurrentPreset = (): SavePresetRequest => ({
    presetName: presetName.trim(),
    enhancementSettings: createPresetEnhancementSettings({
      adjustments,
      filterPresetId: selectedPreset.id,
      cropPresetId,
      freeCrop,
      rotation,
      flipHorizontal,
      flipVertical,
      textOverlays,
    }),
  });

  const applyPresetSettings = (settings: unknown) => {
    const normalized = toEditorPresetSettings(settings);
    setAdjustments({ ...DEFAULT_ADJUSTMENTS, ...normalized.adjustments });
    setSelectedPreset(FILTER_PRESETS.find((preset) => preset.id === normalized.filterPresetId) ?? FILTER_PRESETS[0]);
    const nextCropPreset = CROP_PRESETS.find((preset) => preset.id === normalized.cropPresetId) ?? CROP_PRESETS[0];
    const nextFreeCrop = clampFreeCrop({ ...DEFAULT_FREE_CROP, ...normalized.freeCrop });
    setCropPresetId(nextCropPreset.id as (typeof CROP_PRESETS)[number]["id"]);
    setCropStatus(nextCropPreset.id === "none" ? "No crop selected" : `${nextCropPreset.label} crop applied`);
    setFreeCrop(nextFreeCrop);
    setDraftFreeCrop(nextFreeCrop);
    setFreeCropEditing(false);
    setRotation(normalized.rotation ?? 0);
    setFlipHorizontal(Boolean(normalized.flipHorizontal));
    setFlipVertical(Boolean(normalized.flipVertical));
    setTextOverlays(normalized.textOverlays ?? []);
    setSelectedTextId(normalized.textOverlays?.[0]?.id ?? null);
    setShowOriginal(false);
  };

  const handleSavedPresetChange = (id: string) => {
    setSelectedSavedPresetId(id);
    const preset = savedPresets.find((item) => item.id === id);
    if (!preset) return;
    applyPresetSettings(preset.enhancementSettings);
    setPresetError(null);
  };

  const handleSavePreset = async () => {
    const trimmedName = presetName.trim();
    if (!hasAuthToken) {
      setPresetError("Sign in to save presets.");
      return;
    }
    if (!trimmedName) {
      setPresetError("Preset name is required.");
      return;
    }
    if (savedPresets.some((preset) => preset.presetName.toLowerCase() === trimmedName.toLowerCase())) {
      setPresetError("A preset with this name already exists.");
      return;
    }

    setPresetSaving(true);
    setPresetError(null);
    try {
      const created = await presetsApi.create(serializeCurrentPreset());
      setSavedPresets((current) => [...current, created]);
      setSelectedSavedPresetId(created.id);
      applyPresetSettings(created.enhancementSettings);
      setSavePresetOpen(false);
      setPresetName("");
    } catch (error) {
      setPresetError(getApiErrorMessage(error));
    } finally {
      setPresetSaving(false);
    }
  };

  const handleImportPreset = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed = parsePresetJsonPayload(JSON.parse(await readTextFile(file)));

      if (hasAuthToken) {
        const imported = await presetsApi.import({
          presetName: parsed.presetName,
          enhancementSettings: parsed.enhancementSettings,
        });
        setSavedPresets((current) => [...current.filter((preset) => preset.id !== imported.id), imported]);
        setSelectedSavedPresetId(imported.id);
        applyPresetSettings(imported.enhancementSettings);
      } else {
        setSelectedSavedPresetId("none");
        applyPresetSettings(parsed.enhancementSettings);
        setPresetError(`${parsed.presetName} imported for this session only.`);
        return;
      }
      setPresetError(null);
    } catch (error) {
      setPresetError(
        error instanceof SyntaxError
          ? "Preset JSON could not be parsed."
          : error instanceof PresetSchemaError
            ? error.message
            : getApiErrorMessage(error),
      );
    }
  };

  const downloadPresetJson = (payload: SavePresetRequest) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${payload.presetName.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "lumina-preset"}.json`;
    document.body.append(link);
    link.click();
    URL.revokeObjectURL(link.href);
    link.remove();
  };

  const handleExportPreset = async () => {
    setPresetError(null);
    try {
      if (hasAuthToken && selectedSavedPreset) {
        const exported = await presetsApi.export(selectedSavedPreset.id);
        downloadPresetJson({
          presetName: exported.presetName,
          enhancementSettings: migratePresetEnhancementSettings(exported.enhancementSettings),
        });
        return;
      }
      downloadPresetJson({
        presetName: selectedSavedPreset?.presetName ?? "Lumina Preset",
        enhancementSettings: serializeCurrentPreset().enhancementSettings,
      });
    } catch (error) {
      setPresetError(getApiErrorMessage(error));
    }
  };

  const handleResetManualEdits = () => {
    resetManualState();
    setResetConfirmed(true);

    if (resetTimeoutRef.current) {
      window.clearTimeout(resetTimeoutRef.current);
    }

    resetTimeoutRef.current = window.setTimeout(() => setResetConfirmed(false), 900);
  };

  const replayTour = () => {
    void startEditorTour();
  };

  const resetEditorPreferences = () => {
    clearBrowserPreferences();
    setExpanded(DEFAULT_EXPANDED_SECTIONS);
    void startEditorTour();
  };

  const toggleSection = (key: keyof typeof expanded) => {
    setExpanded((current) => {
      const next = { ...current, [key]: !current[key] };
      setBrowserPreference("editorExpandedSections", next);
      return next;
    });
  };

  const addTextOverlay = () => {
    const overlay = createTextOverlay(textOverlays.length);
    setTextOverlays((current) => [...current, overlay]);
    setSelectedTextId(overlay.id);
    setSelectedTool("text");
  };

  const handleSelectTool = (toolId: string) => {
    setSelectedTool(toolId);

    if (toolId === "text" && imageUrl && textOverlays.length === 0) {
      const overlay = createTextOverlay(0);
      setTextOverlays([overlay]);
      setSelectedTextId(overlay.id);
      return;
    }

    if (toolId === "text" && textOverlays.length > 0 && !selectedTextOverlay) {
      setSelectedTextId(textOverlays[0].id);
    }
  };

  const updateTextOverlay = (textId: string, patch: Partial<Omit<TextOverlayState, "id">>) => {
    setTextOverlays((current) => current.map((overlay) => (overlay.id === textId ? { ...overlay, ...patch } : overlay)));
  };

  const updateSelectedTextOverlay = (patch: Partial<Omit<TextOverlayState, "id">>) => {
    if (!selectedTextOverlay) return;
    updateTextOverlay(selectedTextOverlay.id, patch);
  };

  const applySelectedTextColor = (value: string) => {
    const normalized = normalizeHexColor(value);

    if (!selectedTextOverlay || !normalized) return;

    updateTextOverlay(selectedTextOverlay.id, { color: normalized });
    setRecentTextColors((current) => getUniqueColors([normalized, ...current]).slice(0, 6));
  };

  const handleOpenTextColorPicker = (event: MouseEvent<HTMLElement>) => {
    if (!selectedTextOverlay) return;
    colorPickerReturnAnchorRef.current = event.currentTarget;
    setColorPickerAnchorEl(event.currentTarget);
  };

  const reopenTextColorPicker = () => {
    const returnAnchor = colorPickerReturnAnchorRef.current;

    if (returnAnchor && document.body.contains(returnAnchor)) {
      setColorPickerAnchorEl(returnAnchor);
    }
  };

  const handleRequestTextEyedropper = async () => {
    if (!selectedTextOverlay) return;

    const returnAnchor = colorPickerAnchorEl ?? colorPickerReturnAnchorRef.current;
    colorPickerReturnAnchorRef.current = returnAnchor;
    flushSync(() => {
      setColorPickerAnchorEl(null);
      setEyedropperActive(true);
    });

    if (window.EyeDropper) {
      try {
        const result = await new window.EyeDropper().open();
        applySelectedTextColor(result.sRGBHex);
      } catch {
        // Native eyedropper rejects when the user cancels the pick.
      } finally {
        setEyedropperActive(false);
        reopenTextColorPicker();
      }
      return;
    }

    if (!imageUrl) {
      setEyedropperActive(false);
      reopenTextColorPicker();
    }
  };

  const removeSelectedTextOverlay = () => {
    if (!selectedTextOverlay) return;

    setTextOverlays((current) => current.filter((overlay) => overlay.id !== selectedTextOverlay.id));
    setSelectedTextId((current) => {
      if (current !== selectedTextOverlay.id) return current;
      const nextOverlay = textOverlays.find((overlay) => overlay.id !== selectedTextOverlay.id);
      return nextOverlay?.id ?? null;
    });
  };

  const handleCropPresetChange = (value: (typeof CROP_PRESETS)[number]["id"]) => {
    setCropPresetId(value);
    const selectedCrop = CROP_PRESETS.find((preset) => preset.id === value) ?? CROP_PRESETS[0];
    setCropStatus(value === "none" ? "No crop selected" : `${selectedCrop.label} crop selected`);

    if (value === "free") {
      setDraftFreeCrop(freeCrop);
      setFreeCropEditing(true);
      return;
    }

    setFreeCropEditing(false);
  };

  const applyFreeCrop = () => {
    const appliedCrop = clampFreeCrop(draftFreeCrop);
    freeCropDragRef.current = null;
    setDraftFreeCrop(appliedCrop);
    setFreeCrop(appliedCrop);
    setCropPresetId("free");
    setFreeCropEditing(false);
    setCropStatus("Free crop applied");
  };

  const cancelFreeCrop = () => {
    setDraftFreeCrop(freeCrop);
    setCropPresetId("none");
    setFreeCropEditing(false);
    setCropStatus("Free crop canceled");
  };

  const beginFreeCropInteraction = (event: PointerEvent<HTMLElement>, mode: FreeCropDragMode) => {
    const preview = event.currentTarget.closest('[data-testid="workspace-preview"]') as HTMLElement | null;
    const bounds = preview?.getBoundingClientRect();

    if (!bounds?.width || !bounds.height) return;

    if (event.cancelable) {
      event.preventDefault();
    }
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    freeCropDragRef.current = {
      mode,
      startX: finiteNumber(event.clientX),
      startY: finiteNumber(event.clientY),
      startCrop: draftFreeCrop,
      boundsWidth: bounds.width,
      boundsHeight: bounds.height,
    };
  };

  const continueFreeCropInteraction = (event: PointerEvent<HTMLElement>) => {
    const drag = freeCropDragRef.current;
    if (!drag) return;

    const currentX = finiteNumber(event.clientX, drag.startX);
    const currentY = finiteNumber(event.clientY, drag.startY);
    const deltaX = ((currentX - drag.startX) / drag.boundsWidth) * 100;
    const deltaY = ((currentY - drag.startY) / drag.boundsHeight) * 100;
    setDraftFreeCrop(transformFreeCrop(drag.startCrop, drag.mode, deltaX, deltaY));
  };

  const endFreeCropInteraction = (event: PointerEvent<HTMLElement>) => {
    if (!freeCropDragRef.current) return;

    freeCropDragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const scheduleExportStatusReset = () => {
    if (exportStatusTimeoutRef.current) {
      window.clearTimeout(exportStatusTimeoutRef.current);
    }

    exportStatusTimeoutRef.current = window.setTimeout(() => setExportStatus("Export"), 2500);
  };

  const scheduleAiStatusReset = () => {
    if (aiStatusTimeoutRef.current) {
      window.clearTimeout(aiStatusTimeoutRef.current);
    }

    aiStatusTimeoutRef.current = window.setTimeout(() => setAiStatus("Ready"), 2500);
  };

  const handleWorkspaceWheel = (event: WheelEvent<HTMLElement>) => {
    if (selectedTool !== "select") return;

    event.preventDefault();
    setZoom((current) => clamp(current + (event.deltaY < 0 ? 10 : -10), 20, 300));
  };

  const handleWorkspacePreviewPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!eyedropperActive) return;

    event.preventDefault();
    event.stopPropagation();

    if (!imageUrl || !selectedTextOverlay) {
      setEyedropperActive(false);
      reopenTextColorPicker();
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const xPercent = clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100);
    const yPercent = clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100);

    void sampleImageColorAt(imageUrl, xPercent, yPercent, cssFilter, cropPreset, freeCrop)
      .then((sampledColor) => applySelectedTextColor(sampledColor))
      .finally(() => {
        setEyedropperActive(false);
        reopenTextColorPicker();
      });
  };

  const moveTextOverlay = (event: PointerEvent<HTMLElement>, textId: string) => {
    const parent = event.currentTarget.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
    updateTextOverlay(textId, { x, y });
  };

  const handleTextPointerDown = (event: PointerEvent<HTMLElement>, textId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedTool("text");
    setSelectedTextId(textId);
    setDraggingTextId(textId);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleTextPointerMove = (event: PointerEvent<HTMLElement>, textId: string) => {
    if (draggingTextId !== textId) return;
    moveTextOverlay(event, textId);
  };

  const handleTextPointerUp = (event: PointerEvent<HTMLElement>, textId: string) => {
    if (draggingTextId === textId) {
      moveTextOverlay(event, textId);
      setDraggingTextId(null);
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const validationError = validateImageUpload(file);
    if (validationError) {
      setUploadError(validationError);
      setImageLoading(false);
      return;
    }

    const reader = new FileReader();
    setImageLoading(true);
    setUploadError(null);

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setUploadError("The selected file could not be loaded as an image.");
        setImageLoading(false);
        return;
      }

      setUploadedImage(reader.result);
      setUploadedFileName(file.name);
      setSelectedPreset(FILTER_PRESETS[0]);
      resetManualState();
      setImageLoading(false);
    };

    reader.onerror = () => {
      setUploadError("The selected file could not be loaded as an image.");
      setImageLoading(false);
    };

    window.setTimeout(() => reader.readAsDataURL(file), 0);
  };

  const handleAiRestore = async () => {
    if (!imageUrl) {
      setAiStatus("Image Required");
      return;
    }

    if (!useSavedHfToken && hfToken.trim().length === 0) {
      setAiStatus("Token Required");
      scheduleAiStatusReset();
      return;
    }

    if (aiStatusTimeoutRef.current) {
      window.clearTimeout(aiStatusTimeoutRef.current);
    }

    setAiRestoring(true);
    setAiStatus("Processing...");

    try {
      const response = await restoreFace({
        image: await loadImageAsBase64(imageUrl),
        huggingFaceToken: useSavedHfToken ? undefined : hfToken.trim(),
        useSavedToken: useSavedHfToken,
        sessionId: guestSessionId ?? undefined,
        outputFormat: "jpeg",
      });

      setUploadedImage(toRestoredDataUrl(response.restoredImage, response.outputFormat));
      resetManualState();
      setAiStatus("Restoration Complete");
      scheduleAiStatusReset();
    } catch (error) {
      setAiStatus(getApiErrorMessage(error));
    } finally {
      setAiRestoring(false);
    }
  };

  const handleExport = () => {
    if (!imageUrl) {
      setExportStatus("Image Required");
      scheduleExportStatusReset();
      return;
    }

    setExportStatus("Exporting...");
    const sourceImage = new Image();

    if (/^https?:/i.test(imageUrl)) {
      sourceImage.crossOrigin = "anonymous";
    }

    sourceImage.onload = () => {
      const sourceWidth = sourceImage.naturalWidth || sourceImage.width;
      const sourceHeight = sourceImage.naturalHeight || sourceImage.height;

      if (!sourceWidth || !sourceHeight) {
        setExportStatus("Export Failed");
        scheduleExportStatusReset();
        return;
      }

      const crop = getExportCrop(sourceWidth, sourceHeight, cropPreset, freeCrop);
      const normalizedRotation = ((rotation % 360) + 360) % 360;
      const swapsAxis = normalizedRotation === 90 || normalizedRotation === 270;
      const canvas = document.createElement("canvas");
      canvas.width = swapsAxis ? crop.sourceHeight : crop.sourceWidth;
      canvas.height = swapsAxis ? crop.sourceWidth : crop.sourceHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        setExportStatus("Export Failed");
        scheduleExportStatusReset();
        return;
      }

      context.save();
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((normalizedRotation * Math.PI) / 180);
      context.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
      context.filter = buildCSSFilter(adjustments, selectedPreset, false);
      context.drawImage(
        sourceImage,
        crop.sourceX,
        crop.sourceY,
        crop.sourceWidth,
        crop.sourceHeight,
        -crop.sourceWidth / 2,
        -crop.sourceHeight / 2,
        crop.sourceWidth,
        crop.sourceHeight,
      );
      context.save();
      context.translate(-crop.sourceWidth / 2, -crop.sourceHeight / 2);
      drawFilterEffects(context, crop.sourceWidth, crop.sourceHeight, mergePresetAdjustments(adjustments, selectedPreset));
      context.restore();

      const visibleTextOverlays = textOverlays.filter((overlay) => overlay.text.trim().length > 0);
      if (visibleTextOverlays.length > 0) {
        context.filter = "none";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.shadowColor = "rgba(0,0,0,0.72)";
        context.shadowBlur = 12;
        context.shadowOffsetY = 2;

        visibleTextOverlays.forEach((overlay) => {
          context.fillStyle = overlay.color;
          context.font = `800 ${overlay.size}px sans-serif`;
          context.fillText(
            overlay.text.trim(),
            -crop.sourceWidth / 2 + (crop.sourceWidth * overlay.x) / 100,
            -crop.sourceHeight / 2 + (crop.sourceHeight * overlay.y) / 100,
            crop.sourceWidth * 0.86,
          );
        });
      }

      context.restore();

      try {
        const downloadLink = document.createElement("a");
        downloadLink.href = canvas.toDataURL("image/png");
        downloadLink.download = makeExportFileName(uploadedFileName);
        document.body.append(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        setExportStatus("Exported");
        scheduleExportStatusReset();
      } catch {
        setExportStatus("Export Failed");
        scheduleExportStatusReset();
      }
    };

    sourceImage.onerror = () => {
      setExportStatus("Export Failed");
      scheduleExportStatusReset();
    };

    sourceImage.src = imageUrl;
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100dvw",
        height: { xs: "auto", md: "100vh" },
        bgcolor: "#08080e",
        color: "#e4e4f2",
        display: "grid",
        gridTemplateRows: EDITOR_LAYOUT.appRows,
        overflowX: "hidden",
        overflowY: { xs: "visible", md: "hidden" },
        fontFamily: '"Outfit", sans-serif',
        pb: { xs: 12, md: 0 },
      }}
    >
      <Box
        component="header"
        sx={{
          display: { xs: "flex", md: "grid" },
          gridTemplateColumns: {
            xs: "minmax(0, 1fr) auto",
            sm: "minmax(0, 1fr) max-content",
            md: "300px minmax(0, 1fr) max-content",
            lg: "340px minmax(0, 1fr) max-content",
          },
          gap: { xs: 0.75, md: 1 },
          justifyContent: { xs: "space-between", md: "normal" },
          alignItems: "center",
          width: "100%",
          maxWidth: "100dvw",
          overflow: "hidden",
          px: { xs: 1.25, sm: 2, md: 0 },
          py: { xs: 1.25, sm: 2, md: 0 },
          bgcolor: { xs: "#08080e", md: "#0d0d18" },
          borderBottom: { xs: 0, md: "1px solid rgba(255,255,255,0.06)" },
        }}
      >
        <Box sx={{ pl: { xs: 0, md: 2, lg: 2.5 }, minWidth: 0, flexShrink: 1 }}>
          <Brand />
        </Box>

        <Box sx={{ minWidth: 0, display: { xs: "none", md: "block" } }} />

        <Stack
          aria-label="Editor actions"
          direction="row"
          spacing={{ xs: 0.45, md: 0.85, lg: 1 }}
          justifyContent={{ xs: "flex-end", sm: "flex-end" }}
          alignItems="center"
          sx={{
            minWidth: 0,
            width: { xs: "auto", sm: "100%" },
            maxWidth: "100%",
            px: { xs: 0, md: 1.5, lg: 1.8 },
            flexWrap: "nowrap",
            overflowX: "hidden",
            overflowY: "hidden",
            scrollbarWidth: "none",
            whiteSpace: "nowrap",
            "&::-webkit-scrollbar": { display: "none" },
            "& .MuiButton-root, & .MuiIconButton-root, & .MuiDivider-root": {
              flexShrink: 0,
            },
          }}
        >
          {hasAuthToken && (
            <>
              <IconButton
                component={Link}
                href={APP_ROUTES.history}
                size="small"
                title="History"
                aria-label="History"
                sx={{
                  display: { xs: "none", sm: "inline-flex" },
                  color: "#6868a0",
                  width: { sm: 40, md: 44 },
                  height: { sm: 40, md: 44 },
                  "& svg": { fontSize: { sm: 21, md: 23 } },
                  "&:hover": { color: "#a78bfa", bgcolor: "rgba(124,102,255,0.1)" },
                }}
              >
                <HistoryIcon fontSize="small" />
              </IconButton>
              <IconButton
                component={Link}
                href={APP_ROUTES.settings}
                size="small"
                title="Settings"
                aria-label="Settings"
                sx={{
                  display: { xs: "none", sm: "inline-flex" },
                  color: "#6868a0",
                  width: { sm: 40, md: 44 },
                  height: { sm: 40, md: 44 },
                  "& svg": { fontSize: { sm: 21, md: 23 } },
                  "&:hover": { color: "#a78bfa", bgcolor: "rgba(124,102,255,0.1)" },
                }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" }, borderColor: "rgba(255,255,255,0.08)", mx: 0.2 }} />
            </>
          )}
          <Tooltip title="Replay tour. Shift-click to reset tips.">
            <IconButton
              size="small"
              aria-label="Replay editor tour"
              onClick={(event) => {
                if (event.shiftKey) {
                  resetEditorPreferences();
                  return;
                }
                replayTour();
              }}
              sx={{ color: "#6868a0", width: { xs: 38, md: 44 }, height: { xs: 38, md: 44 }, "& svg": { fontSize: { md: 23 } }, "&:hover": { color: "#a78bfa", bgcolor: "rgba(124,102,255,0.1)" } }}
            >
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" sx={{ display: { xs: "none", sm: "inline-flex" }, color: "#38385a", width: { sm: 40, md: 44 }, height: { sm: 40, md: 44 }, "& svg": { fontSize: { md: 23 } } }}>
            <UndoIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ display: { xs: "none", sm: "inline-flex" }, color: "#38385a", width: { sm: 40, md: 44 }, height: { sm: 40, md: 44 }, "& svg": { fontSize: { md: 23 } } }}>
            <RedoIcon fontSize="small" />
          </IconButton>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" }, borderColor: "rgba(255,255,255,0.08)", mx: 0.35 }} />
          <Button
            size="small"
            startIcon={<VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />}
            disabled={!imageUrl}
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            sx={{
              color: showOriginal ? "#a78bfa" : "#6868a0",
              display: { xs: "none", sm: "inline-flex" },
              border: `1px solid ${showOriginal ? "rgba(124,102,255,0.4)" : "rgba(255,255,255,0.06)"}`,
              bgcolor: showOriginal ? "rgba(124,102,255,0.18)" : "rgba(255,255,255,0.04)",
              px: { xs: 1, md: 1.45, lg: 1.7 },
              minWidth: { xs: 104, md: 126, lg: 136 },
              height: { xs: 40, md: 46 },
              fontSize: { xs: 11, md: 13, lg: 13.5 },
              lineHeight: 1.05,
              textTransform: "none",
              "& .MuiButton-startIcon": {
                mr: 0.7,
                "& svg": { fontSize: 18 },
              },
            }}
          >
            Before / After
          </Button>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" }, borderColor: "rgba(255,255,255,0.08)", mx: 0.35 }} />
          <Button
            data-tour="export"
            startIcon={<DownloadIcon sx={{ fontSize: 21 }} />}
            variant="contained"
            disabled={!imageUrl}
            onClick={handleExport}
            onMouseEnter={() => setExportHovered(true)}
            onMouseLeave={() => setExportHovered(false)}
            sx={{
              "@keyframes exportButtonSpin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
              position: "relative",
              overflow: "hidden",
              color: "#fff",
              background: "linear-gradient(135deg, rgba(124,102,255,0.92), rgba(147,51,234,0.92))",
              boxShadow: "0 0 22px rgba(124,102,255,0.35)",
              px: { xs: 1.1, sm: 1.45, md: 2.3 },
              minWidth: { xs: 88, sm: 98, md: 128, lg: 140 },
              height: { xs: 38, sm: 40, md: 48 },
              fontSize: { xs: 12, sm: 13, md: 15 },
              border: "1px solid rgba(255,255,255,0.14)",
              "&::before": {
                content: '""',
                position: "absolute",
                width: 160,
                height: 160,
                background:
                  exportStatus === "Export Failed"
                    ? "conic-gradient(from 0deg, transparent, #f87171, transparent 36%)"
                    : "conic-gradient(from 0deg, transparent, #ffffff, #a78bfa, transparent 38%)",
                animation: "exportButtonSpin 2.5s linear infinite",
                opacity: exportStatus === "Export" ? 0.42 : 0.78,
              },
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 2,
                borderRadius: "inherit",
                background:
                  exportStatus === "Export Failed"
                    ? "linear-gradient(135deg, #7f1d1d, #991b1b)"
                    : "linear-gradient(135deg, #7c66ff, #9333ea)",
              },
              "& .MuiButton-startIcon": {
                position: "relative",
                zIndex: 1,
                mr: { xs: 0.55, md: 1 },
                "& svg": { fontSize: { xs: 17, md: 21 } },
              },
              "&:disabled": {
                color: "rgba(255,255,255,0.46)",
                background: "rgba(255,255,255,0.06)",
                boxShadow: "none",
              },
            }}
          >
            <Box component="span" sx={{ position: "relative", zIndex: 1, minWidth: { xs: 38, sm: 44, md: 58 }, textAlign: "center" }}>
              {exportButtonLabel}
            </Box>
          </Button>
          <IconButton
            component={Link}
            href={APP_ROUTES.landing}
            title="Exit to Landing"
            sx={{
              color: "#8888b8",
              width: { xs: 36, sm: 40, md: 46 },
              height: { xs: 36, sm: 40, md: 46 },
              ml: { xs: 0.15, md: 0.4 },
              "& svg": { fontSize: { xs: 24, md: 30 } },
              "&:hover": { color: "#c8c8e4", bgcolor: "rgba(255,255,255,0.06)" },
            }}
          >
            <HomeOutlinedIcon />
          </IconButton>
        </Stack>
      </Box>

      <Box
        sx={{
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: EDITOR_LAYOUT.shellColumns,
          gridTemplateRows: { xs: "auto minmax(460px, 1fr) auto", md: "1fr" },
          overflow: { xs: "visible", md: "hidden" },
          rowGap: { xs: 2.2, md: 0 },
        }}
      >
        <Box
          aria-label="Mobile tool navigation"
          sx={{
            position: { xs: "fixed", md: "static" },
            left: { xs: 16, md: "auto" },
            right: { xs: 16, md: "auto" },
            bottom: { xs: 12, md: "auto" },
            zIndex: { xs: 30, md: "auto" },
            bgcolor: { xs: "rgba(13,13,24,0.94)", md: "#0d0d18" },
            backdropFilter: { xs: "blur(18px)", md: "none" },
            borderRight: { xs: 0, md: "1px solid rgba(255,255,255,0.06)" },
            borderBottom: { xs: 0, md: 0 },
            border: { xs: "1px solid rgba(255,255,255,0.1)", md: 0 },
            borderRadius: { xs: 3, md: 0 },
            boxShadow: { xs: "0 20px 60px rgba(0,0,0,0.55), 0 0 30px rgba(124,102,255,0.18)", md: "none" },
            display: "flex",
            flexDirection: { xs: "row", md: "column" },
            alignItems: "center",
            justifyContent: { xs: "space-between", md: "flex-start" },
            gap: { xs: 0.25, md: 0.7 },
            py: { xs: 1, md: 2 },
            px: { xs: 0.6, md: 0.55 },
            overflowX: { xs: "hidden", md: "visible" },
          }}
        >
          {tools.map((tool) => (
            <ToolButton
              key={tool.id}
              label={tool.label}
              mobileLabel={tool.mobileLabel ?? tool.label}
              active={selectedTool === tool.id}
              dataTour={tool.id === "crop" ? "crop" : undefined}
              onClick={() => handleSelectTool(tool.id)}
            >
              {tool.icon}
            </ToolButton>
          ))}
          <Box sx={{ flex: 1, display: { xs: "none", md: "block" } }} />
          <IconButton
            component={Link}
            href={hasAuthToken ? APP_ROUTES.settings : APP_ROUTES.login}
            aria-label={hasAuthToken ? "Account settings" : "Sign in"}
            title={hasAuthToken ? "Account settings" : "Sign in"}
            sx={{
              display: { xs: "none", md: "inline-flex" },
              width: { md: 50, lg: 52 },
              height: { md: 50, lg: 52 },
              borderRadius: 1.5,
              color: "#52527a",
              "& svg": { fontSize: { md: 26, lg: 28 } },
              "&:hover": { bgcolor: "rgba(124,102,255,0.12)", color: "#a78bfa" },
            }}
          >
            <PersonOutlineIcon />
          </IconButton>
          <ToolButton label="Zoom in" hideOnMobile onClick={() => setZoom((current) => Math.min(300, current + 10))}>
            <ZoomInIcon />
          </ToolButton>
          <Typography sx={{ display: { xs: "none", md: "block" }, color: "#4a4a72", fontSize: 11, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>
            {zoom}%
          </Typography>
          <ToolButton label="Zoom out" hideOnMobile onClick={() => setZoom((current) => Math.max(20, current - 10))}>
            <ZoomOutIcon />
          </ToolButton>
        </Box>

        <Box
          sx={{
            minWidth: 0,
            minHeight: 0,
            display: { xs: "block", md: "grid" },
            gridTemplateRows: EDITOR_LAYOUT.workspaceRows,
          }}
        >
          <Box
            onWheel={handleWorkspaceWheel}
            sx={{
              position: "relative",
              minHeight: { xs: 460, md: 0 },
              height: { xs: "min(62vh, 500px)", md: "auto" },
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              width: { xs: "calc(100dvw - 32px)", md: "auto" },
              maxWidth: "100%",
              justifySelf: "center",
              mx: { xs: 0, md: 0 },
              mb: { xs: 2.4, md: 0 },
              borderRadius: { xs: 3, md: 0 },
              border: { xs: imageUrl ? "1px solid rgba(255,255,255,0.08)" : "1px dashed rgba(167,139,250,0.52)", md: 0 },
              bgcolor: { xs: "rgba(13,13,24,0.72)", md: "#06060c" },
              backgroundImage: {
                xs: "radial-gradient(circle at 20% 0%, rgba(124,102,255,0.16), transparent 35%)",
                md: "linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px)",
              },
              backgroundSize: { xs: "auto", md: "52px 52px" },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(124,102,255,0.04) 0%, transparent 70%)",
              }}
            />
            {uploadError && (
              <Box
                role="alert"
                sx={{
                  position: "absolute",
                  top: 18,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 2,
                  maxWidth: "min(560px, calc(100% - 32px))",
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                  color: "#fecaca",
                  bgcolor: "rgba(127,29,29,0.78)",
                  border: "1px solid rgba(248,113,113,0.38)",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                {uploadError}
              </Box>
            )}

            {imageLoading && (
              <Stack role="status" spacing={1.8} alignItems="center" sx={{ color: "#a78bfa", zIndex: 1 }}>
                <CircularProgress size={34} sx={{ color: "#a78bfa" }} />
                <Typography sx={{ color: "#c8c8e4", fontSize: 16, fontWeight: 700 }}>Loading image...</Typography>
              </Stack>
            )}

            {!imageLoading && !imageUrl && (
              <Stack
                spacing={2}
                alignItems="center"
                sx={{
                  zIndex: 1,
                  width: EDITOR_LAYOUT.uploadCardWidth,
                  maxWidth: { xs: "calc(100dvw - 56px)", md: EDITOR_LAYOUT.uploadCardWidth },
                  minHeight: { xs: 300, md: 340, lg: 370 },
                  boxSizing: "border-box",
                  p: { xs: 3, md: 5, lg: 5.5 },
                  border: "1px dashed rgba(167,139,250,0.5)",
                  borderRadius: 2.5,
                  bgcolor: "rgba(13,13,24,0.82)",
                  textAlign: "center",
                  justifyContent: "center",
                  boxShadow: "0 24px 90px rgba(0,0,0,0.38), inset 0 0 40px rgba(124,102,255,0.05)",
                }}
              >
                <UploadFileIcon sx={{ color: "#a78bfa", fontSize: { xs: 46, md: 58 } }} />
                <Box>
                  <Typography sx={{ color: "#e4e4f2", fontSize: { xs: 24, md: 30 }, fontWeight: 800 }}>
                    Upload an image to start
                  </Typography>
                  <Typography sx={{ color: "#8888b8", fontSize: { xs: 14, md: 16 }, mt: 0.9 }}>
                    JPEG, PNG, or WebP up to {MAX_UPLOAD_SIZE_MB} MB.
                  </Typography>
                </Box>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<UploadFileIcon />}
                  sx={{
                    color: "#ffffff",
                    background: "linear-gradient(135deg, #7c66ff, #9333ea)",
                    boxShadow: "0 0 22px rgba(124,102,255,0.3)",
                    px: { xs: 2.8, md: 3.4 },
                    minHeight: { xs: 46, md: 50 },
                    fontSize: { xs: 14, md: 15.5 },
                    fontWeight: 800,
                  }}
                >
                  Upload Image
                  <input
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    aria-label="Upload image"
                    onChange={handleUpload}
                  />
                </Button>
              </Stack>
            )}

            {!imageLoading && imageUrl && (
              <Box
                sx={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease",
                  position: "relative",
                  width: { xs: "100%", md: "auto" },
                  height: { xs: "100%", md: "auto" },
                  maxWidth: { xs: "calc(100dvw - 56px)", md: "calc(100% - 72px)" },
                }}
              >
                <Box
                  data-testid="workspace-preview"
                  data-transform={previewTransform}
                  data-crop-ratio={cropMode}
                  data-free-crop-applied={freeCropPreviewActive ? "true" : "false"}
                  data-preview-fit={previewCropRatio ? "crop" : "contain"}
                  data-mobile-fit-box={previewCropRatio ? "false" : "true"}
                  onPointerDown={handleWorkspacePreviewPointerDown}
                  sx={{
                    position: "relative",
                    display: { xs: "flex", md: previewCropRatio ? "inline-block" : "inline-flex" },
                    alignItems: "center",
                    justifyContent: "center",
                    width: previewCropRatio ? { xs: "100%", md: "min(72vw, 860px)" } : { xs: "100%", md: "auto" },
                    height: previewCropRatio ? "auto" : { xs: "100%", md: "auto" },
                    maxWidth: "100%",
                    aspectRatio: previewCropRatio ?? "auto",
                    overflow: "hidden",
                    transform: previewTransform,
                    transformOrigin: "center center",
                    transition: "filter 0.08s linear, transform 0.15s ease",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
                    cursor: eyedropperActive ? "crosshair" : "default",
                    outline: eyedropperActive ? "1px solid rgba(167,139,250,0.72)" : "none",
                    outlineOffset: 6,
                  }}
                >
                  <Box
                    component="img"
                    data-testid="workspace-image"
                    data-filter={cssFilter}
                    src={imageUrl}
                      alt={imageAlt}
                      sx={{
                        display: "block",
                        width: freeCropPreviewActive ? `${10000 / freeCrop.width}%` : activeCropRatio ? "100%" : "auto",
                        height: freeCropPreviewActive ? `${10000 / freeCrop.height}%` : activeCropRatio ? "100%" : { xs: "100%", md: "auto" },
                        maxHeight: previewCropRatio ? "none" : { xs: "100%", md: "calc(100vh - 310px)" },
                        maxWidth: previewCropRatio ? "none" : "100%",
                        objectFit: freeCropPreviewActive ? "fill" : activeCropRatio ? "cover" : "contain",
                        objectPosition: "center center",
                        filter: cssFilter,
                        transform: freeCropPreviewActive ? `translate(-${freeCrop.x}%, -${freeCrop.y}%)` : "none",
                        transformOrigin: "top left",
                        transition: "filter 0.08s linear, transform 0.15s ease",
                      }}
                    />
                  {filterEffectOverlaySx && <Box data-testid="filter-effect-overlay" sx={filterEffectOverlaySx} />}
                  {!showOriginal && cropPreset.id === "free" && freeCropEditing && (
                    <Box
                      data-testid="free-crop-frame"
                      data-crop-x={draftFreeCrop.x}
                      data-crop-y={draftFreeCrop.y}
                      data-crop-width={draftFreeCrop.width}
                      data-crop-height={draftFreeCrop.height}
                      onPointerDown={(event) => beginFreeCropInteraction(event, "move")}
                      onPointerMove={continueFreeCropInteraction}
                      onPointerUp={endFreeCropInteraction}
                      onPointerCancel={endFreeCropInteraction}
                      sx={{
                        position: "absolute",
                        left: `${draftFreeCrop.x}%`,
                        top: `${draftFreeCrop.y}%`,
                        width: `${draftFreeCrop.width}%`,
                        height: `${draftFreeCrop.height}%`,
                        border: "2px solid rgba(255,255,255,0.88)",
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.38), 0 0 20px rgba(124,102,255,0.45)",
                        cursor: freeCropDragRef.current?.mode === "move" ? "grabbing" : "move",
                        borderRadius: 0.5,
                        zIndex: 2,
                        touchAction: "none",
                        "&::before, &::after": {
                          content: '""',
                          position: "absolute",
                          inset: 0,
                          pointerEvents: "none",
                        },
                        "&::before": {
                          background:
                            "linear-gradient(rgba(255,255,255,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.28) 1px, transparent 1px)",
                          backgroundSize: "33.333% 33.333%",
                        },
                      }}
                    >
                      {FREE_CROP_HANDLES.map((handle) => (
                        <Box
                          key={handle.mode}
                          aria-hidden="true"
                          data-testid={`free-crop-handle-${handle.mode}`}
                          onPointerDown={(event) => beginFreeCropInteraction(event, handle.mode)}
                          onPointerMove={continueFreeCropInteraction}
                          onPointerUp={endFreeCropInteraction}
                          onPointerCancel={endFreeCropInteraction}
                          sx={{
                            position: "absolute",
                            width: { xs: 20, md: 12 },
                            height: { xs: 20, md: 12 },
                            border: "2px solid rgba(255,255,255,0.96)",
                            bgcolor: "#7c66ff",
                            boxShadow: "0 0 10px rgba(124,102,255,0.55)",
                            cursor: handle.cursor,
                            touchAction: "none",
                            ...handle.sx,
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  {!showOriginal &&
                    textOverlays.map((overlay) => (
                      <Box
                        key={overlay.id}
                        component="button"
                        type="button"
                        data-testid={overlay.id === selectedTextId ? "text-overlay" : "text-overlay-item"}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedTool("text");
                          setSelectedTextId(overlay.id);
                        }}
                        onPointerDown={(event) => handleTextPointerDown(event, overlay.id)}
                        onPointerMove={(event) => handleTextPointerMove(event, overlay.id)}
                        onPointerUp={(event) => handleTextPointerUp(event, overlay.id)}
                        onPointerCancel={() => setDraggingTextId(null)}
                        sx={{
                          position: "absolute",
                          left: `${overlay.x}%`,
                          top: `${overlay.y}%`,
                          transform: "translate(-50%, -50%)",
                          color: overlay.color,
                          fontSize: `${overlay.size}px`,
                          fontWeight: 800,
                          lineHeight: 1.05,
                          textAlign: "center",
                          textShadow: "0 2px 12px rgba(0,0,0,0.72)",
                          maxWidth: "86%",
                          overflowWrap: "anywhere",
                          cursor: draggingTextId === overlay.id ? "grabbing" : "grab",
                          userSelect: "none",
                          bgcolor: "transparent",
                          border: overlay.id === selectedTextId ? "1px dashed rgba(255,255,255,0.76)" : "1px solid transparent",
                          borderRadius: 0.6,
                          p: 0.45,
                          zIndex: 3,
                          fontFamily: "inherit",
                        }}
                      >
                        {overlay.text || "Text"}
                      </Box>
                    ))}
                </Box>
                <Box
                  sx={{
                    position: "absolute",
                    left: 12,
                    bottom: 12,
                    px: 1,
                    py: 0.35,
                    bgcolor: "rgba(0,0,0,0.72)",
                    color: "#c8c8e4",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 1,
                    maxWidth: "calc(100% - 24px)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {uploadedFileName ?? "Workspace image"}
                </Box>
                {showOriginal && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    px: 1,
                    py: 0.35,
                    bgcolor: "rgba(0,0,0,0.72)",
                    color: "#e4e4f2",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 1,
                  }}
                >
                  ORIGINAL
                </Box>
              )}
              </Box>
            )}
          </Box>

          <Box sx={{ width: { xs: "calc(100dvw - 32px)", md: "auto" }, maxWidth: "100%", mx: { xs: "auto", md: 0 }, overflow: "hidden" }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ display: { xs: "flex", md: "none" }, mb: 1.4 }}
            >
              <Typography sx={{ color: "#c4b5fd", fontSize: 14, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                Quick Looks
              </Typography>
              <Button size="small" endIcon={<KeyboardArrowDownIcon sx={{ transform: "rotate(-90deg)" }} />} sx={{ color: "#a9a5ff", textTransform: "none", minWidth: 0, px: 0 }}>
                View all
              </Button>
            </Stack>
            <Stack
              data-tour="filters"
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 1.35, md: 1.8 }}
              alignItems={{ xs: "stretch", md: "center" }}
              sx={{
                px: { xs: 0, md: 2.1 },
                py: { xs: 0, md: 2.2 },
                bgcolor: { xs: "transparent", md: "#0d0d18" },
                borderTop: { xs: 0, md: "1px solid rgba(255,255,255,0.06)" },
                overflow: "hidden",
              }}
            >
            <FilterPresetCarousel
              presets={FILTER_PRESETS}
              selectedPreset={selectedPreset}
              previewUrl={filterPreviewUrl}
              onSelect={setSelectedPreset}
            />
            <Stack
              spacing={0.6}
              alignItems="center"
              sx={{
                ml: { xs: 0, md: "auto" },
                pr: { xs: 0, md: 1.1 },
                minWidth: { xs: "100%", md: 206 },
                flexShrink: 0,
              }}
            >
              <Button
                data-tour="upload"
                component="label"
                size="small"
                startIcon={<UploadFileIcon sx={{ fontSize: 17 }} />}
                sx={{
                  color: "#a9a5ff",
                  border: "1px solid rgba(124,102,255,0.22)",
                  bgcolor: "rgba(255,255,255,0.045)",
                  px: 2.1,
                  minWidth: { xs: "100%", md: 154 },
                  height: { xs: 42, md: 44 },
                  fontSize: { xs: 13, md: 14 },
                  fontWeight: 800,
                  "&:hover": {
                    color: "#ffffff",
                    bgcolor: "rgba(124,102,255,0.16)",
                    borderColor: "rgba(124,102,255,0.42)",
                  },
                }}
              >
                Upload
                <input
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Upload image"
                  onChange={handleUpload}
                />
              </Button>
              <Typography
                aria-live="polite"
                sx={{
                  color: "#52527a",
                  fontSize: { xs: 10.5, md: 11 },
                  fontFamily: '"JetBrains Mono", monospace',
                  whiteSpace: "nowrap",
                }}
              >
                {guestSessionId ? `Guest workspace ${guestSessionId.slice(0, 8)}` : "Guest workspace"}
              </Typography>
            </Stack>
            </Stack>
          </Box>
        </Box>

        <Box
          sx={{
            bgcolor: { xs: "rgba(13,13,24,0.86)", md: "#0d0d18" },
            borderLeft: { xs: 0, md: "1px solid rgba(255,255,255,0.06)" },
            borderTop: { xs: 0, md: 0 },
            border: { xs: "1px solid rgba(255,255,255,0.08)", md: 0 },
            borderRadius: { xs: 3, md: 0 },
            mx: { xs: 2, md: 0 },
            mb: { xs: 1, md: 0 },
            boxShadow: { xs: "0 18px 70px rgba(0,0,0,0.38)", md: "none" },
            display: "grid",
            gridTemplateRows: "1fr auto",
            minHeight: 0,
            maxHeight: { xs: "none", md: "100%" },
          }}
        >
          <Box
            sx={{
              overflowY: "auto",
              px: { xs: 2, md: 3 },
              pt: { xs: 2, md: 3.4 },
              pb: { xs: 2.4, md: 3 },
              scrollbarWidth: "none",
              "& .MuiButton-root": {
                minHeight: { md: 44 },
                fontSize: { md: 13.5 },
                borderRadius: 1.6,
              },
              "& .MuiInputBase-root": {
                fontSize: { md: 14 },
              },
            }}
          >
            <Box data-tour="ai" sx={{ pb: { xs: 2.2, md: 2.7 }, mb: { xs: 2.2, md: 2.7 }, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <SectionHeader label="AI Face Restoration" expanded={expanded.ai} onClick={() => toggleSection("ai")} />
              {expanded.ai && (
                <Stack spacing={{ xs: 2, md: 2.3 }} sx={{ mt: { xs: 2, md: 2.3 } }}>
                  <Box
                    sx={{
                      color: "#8888b8",
                      fontSize: { xs: 12, md: 13 },
                      px: { xs: 1.2, md: 1.45 },
                      py: { xs: 1.1, md: 1.25 },
                      borderRadius: 1.2,
                      bgcolor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    Powered by Hugging Face CodeFormer
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        color: "#a9a5ff",
                        fontSize: { xs: 12, md: 13 },
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        mb: { xs: 1, md: 1.1 },
                      }}
                    >
                      Hugging Face API Token
                    </Typography>
                    <TextField
                      fullWidth
                      type="password"
                      value={hfToken}
                      onChange={(event) => setHfToken(event.target.value)}
                      disabled={useSavedHfToken || aiRestoring}
                      placeholder="hf_..."
                      inputProps={{ "aria-label": "Hugging Face API Token" }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LinkIcon sx={{ color: "#52527a", fontSize: { xs: 16, md: 18 } }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: { xs: 42, md: 46 },
                          bgcolor: "rgba(0,0,0,0.3)",
                          borderRadius: 2,
                          color: "#e4e4f2",
                          fontSize: { xs: 13, md: 14 },
                          "& fieldset": { borderColor: "rgba(255,255,255,0.05)" },
                          "&:hover fieldset": { borderColor: "rgba(124,102,255,0.3)" },
                        },
                      }}
                    />
                    <Typography sx={{ color: "#64649a", fontSize: { xs: 11, md: 12 }, lineHeight: 1.6, mt: 1.2 }}>
                      You must provide your own Hugging Face API token for AI restoration.
                    </Typography>
                  </Box>

                  {hasAuthToken && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Checkbox
                        size="small"
                        checked={useSavedHfToken}
                        onChange={(event) => setUseSavedHfToken(event.target.checked)}
                        inputProps={{ "aria-label": "Use saved Hugging Face token" }}
                        sx={{
                          p: 0,
                          color: "#6868a0",
                          "&.Mui-checked": { color: "#7c66ff" },
                        }}
                      />
                      <Typography sx={{ color: "#8888d8", fontSize: { xs: 12, md: 13 } }}>Use saved token</Typography>
                    </Stack>
                  )}

                  <Button
                    fullWidth
                    onClick={handleAiRestore}
                    disabled={!imageUrl || aiRestoring}
                    startIcon={<AutoFixHighIcon />}
                    sx={{
                      "@keyframes restoreButtonSpin": {
                        "0%": { transform: "rotate(0deg)" },
                        "100%": { transform: "rotate(360deg)" },
                      },
                      position: "relative",
                      overflow: "hidden",
                      minHeight: { xs: 50, md: 54 },
                      py: { xs: 1.45, md: 1.65 },
                      borderRadius: 2,
                      color: "#a78bfa",
                      bgcolor: "rgba(124,102,255,0.15)",
                      border: "1px solid rgba(124,102,255,0.32)",
                      fontWeight: 800,
                      fontSize: { xs: 17, md: 18 },
                      boxShadow: "0 0 20px rgba(124,102,255,0.18)",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        width: 520,
                        height: 520,
                        background: "conic-gradient(from 0deg, transparent, #ffffff, #a78bfa, transparent 36%)",
                        animation: "restoreButtonSpin 3s linear infinite",
                        opacity: aiRestoring ? 0.82 : 0.46,
                      },
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        inset: 2,
                        borderRadius: "inherit",
                        background: "linear-gradient(135deg, rgba(34,26,76,0.98), rgba(39,30,88,0.98))",
                      },
                      "& .MuiButton-startIcon": {
                        position: "relative",
                        zIndex: 1,
                        "& svg": { fontSize: { xs: 20, md: 22 } },
                      },
                      "&:hover": { bgcolor: "rgba(124,102,255,0.2)" },
                      "&:disabled": {
                        color: "rgba(167,139,250,0.45)",
                        boxShadow: "none",
                      },
                    }}
                  >
                    <Box component="span" sx={{ position: "relative", zIndex: 1 }}>
                      AI Restore
                    </Box>
                  </Button>

                  <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5 }}>
                    <Typography sx={{ color: "#6868a0", fontSize: { xs: 14, md: 15 } }}>Status:</Typography>
                    <Typography sx={{ color: getStatusColor(aiStatus), fontSize: { xs: 14, md: 15 }, fontWeight: 700, textAlign: "right" }}>
                      {aiStatus}
                    </Typography>
                  </Stack>
                </Stack>
              )}
            </Box>

            <Box sx={{ mb: 2.7, display: { xs: "none", md: "block" } }}>
              <Histogram adjustments={adjustments} />
            </Box>

            <Box sx={{ pb: { xs: 2.4, md: 2.8 }, mb: { xs: 2.2, md: 2.7 }, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <Typography
                sx={{
                  color: "#a9a5ff",
                  fontSize: { xs: 12, md: 13 },
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  mb: { xs: 2, md: 2.2 },
                }}
              >
                <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                  {tools.find((tool) => tool.id === selectedTool)?.label} Tool
                </Box>
                <Box component="span" sx={{ display: { xs: "inline", md: "none" } }}>
                  Manual Adjustments
                </Box>
              </Typography>

              {selectedTool === "crop" && (
                <Stack spacing={1.4}>
                  <Select
                    value={cropPresetId}
                    onChange={(event) => handleCropPresetChange(event.target.value as typeof cropPresetId)}
                    size="small"
                    fullWidth
                    inputProps={{ "aria-label": "Crop ratio" }}
                    IconComponent={KeyboardArrowDownIcon}
                    sx={{
                      height: { xs: 42, md: 46 },
                      bgcolor: "rgba(0,0,0,0.3)",
                      borderRadius: 1.5,
                      color: "#e4e4f2",
                      fontSize: { xs: 13, md: 14 },
                      "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                    }}
                  >
                    {CROP_PRESETS.map((preset) => (
                      <MenuItem key={preset.id} value={preset.id}>
                        {preset.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {cropPresetId === "free" && freeCropEditing ? (
                    <Stack spacing={1.4}>
                      <Typography sx={{ color: "#64649a", fontSize: { xs: 11, md: 12 }, lineHeight: 1.6 }}>
                        Drag the crop frame on the image, then apply it for export or cancel to leave the full image.
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          fullWidth
                          disabled={!imageUrl}
                          onClick={applyFreeCrop}
                          sx={{
                            bgcolor: "rgba(124,102,255,0.16)",
                            color: "#a78bfa",
                            border: "1px solid rgba(124,102,255,0.28)",
                            fontWeight: 800,
                          }}
                        >
                          Apply
                        </Button>
                        <Button
                          fullWidth
                          onClick={cancelFreeCrop}
                          sx={{
                            bgcolor: "rgba(255,255,255,0.04)",
                            color: "#fca5a5",
                            border: "1px solid rgba(248,113,113,0.22)",
                            fontWeight: 800,
                          }}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </Stack>
                  ) : cropPresetId === "free" ? (
                    <Stack spacing={1.4}>
                      <Typography sx={{ color: "#64649a", fontSize: { xs: 11, md: 12 }, lineHeight: 1.6 }}>
                        Free crop is applied to the preview and export. Adjust it to bring the crop frame back.
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          fullWidth
                          disabled={!imageUrl}
                          onClick={() => {
                            setDraftFreeCrop(freeCrop);
                            setFreeCropEditing(true);
                            setCropStatus("Adjust free crop");
                          }}
                          sx={{
                            bgcolor: "rgba(124,102,255,0.16)",
                            color: "#a78bfa",
                            border: "1px solid rgba(124,102,255,0.28)",
                            fontWeight: 800,
                          }}
                        >
                          Adjust
                        </Button>
                        <Button
                          fullWidth
                          onClick={cancelFreeCrop}
                          sx={{
                            bgcolor: "rgba(255,255,255,0.04)",
                            color: "#fca5a5",
                            border: "1px solid rgba(248,113,113,0.22)",
                            fontWeight: 800,
                          }}
                        >
                          Clear
                        </Button>
                      </Stack>
                    </Stack>
                  ) : (
                    <Typography sx={{ color: "#64649a", fontSize: { xs: 11, md: 12 }, lineHeight: 1.6 }}>
                      {cropPresetId === "none"
                        ? "No crop keeps the full image in the browser preview and export."
                        : "Fixed crop ratios are previewed in the browser by clipping the workspace image."}
                    </Typography>
                  )}
                  <Typography aria-live="polite" sx={{ color: "#a9a5ff", fontSize: { xs: 11, md: 12 }, fontWeight: 700 }}>
                    {cropStatus}
                  </Typography>
                </Stack>
              )}

              {selectedTool === "rotate" && (
                <Stack spacing={1.4}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      fullWidth
                      disabled={!imageUrl}
                      onClick={() => setRotation((current) => (current - 90 + 360) % 360)}
                      sx={{ bgcolor: "rgba(255,255,255,0.05)", color: "#8888d8" }}
                    >
                      Rotate Left
                    </Button>
                    <Button
                      fullWidth
                      disabled={!imageUrl}
                      onClick={() => setRotation((current) => (current + 90) % 360)}
                      sx={{ bgcolor: "rgba(255,255,255,0.05)", color: "#8888d8" }}
                    >
                      Rotate Right
                    </Button>
                  </Stack>
                  <Typography sx={{ color: "#6868a0", fontSize: { xs: 13, md: 14 } }}>Rotation: {rotation} deg</Typography>
                </Stack>
              )}

              {selectedTool === "flip" && (
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    disabled={!imageUrl}
                    onClick={() => setFlipHorizontal((current) => !current)}
                    sx={{
                      bgcolor: flipHorizontal ? "rgba(124,102,255,0.18)" : "rgba(255,255,255,0.05)",
                      color: flipHorizontal ? "#a78bfa" : "#8888d8",
                    }}
                  >
                    Flip H
                  </Button>
                  <Button
                    fullWidth
                    disabled={!imageUrl}
                    onClick={() => setFlipVertical((current) => !current)}
                    sx={{
                      bgcolor: flipVertical ? "rgba(124,102,255,0.18)" : "rgba(255,255,255,0.05)",
                      color: flipVertical ? "#a78bfa" : "#8888d8",
                    }}
                  >
                    Flip V
                  </Button>
                </Stack>
              )}

              {selectedTool === "text" && (
                <Stack spacing={2.2}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      fullWidth
                      disabled={!imageUrl}
                      onClick={addTextOverlay}
                      startIcon={<AddIcon />}
                      sx={{
                        bgcolor: "rgba(124,102,255,0.16)",
                        color: "#a78bfa",
                        border: "1px solid rgba(124,102,255,0.28)",
                      }}
                    >
                      Add Text
                    </Button>
                    <Button
                      fullWidth
                      disabled={!selectedTextOverlay}
                      onClick={removeSelectedTextOverlay}
                      startIcon={<RemoveIcon />}
                      sx={{
                        bgcolor: selectedTextOverlay ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.04)",
                        color: selectedTextOverlay ? "#fca5a5" : "#52527a",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      Remove
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="stretch" data-testid="text-content-color-row">
                    <TextField
                      value={selectedTextOverlay?.text ?? ""}
                      onChange={(event) => updateSelectedTextOverlay({ text: event.target.value })}
                      disabled={!selectedTextOverlay}
                      placeholder="Overlay text"
                      inputProps={{ "aria-label": "Text overlay content" }}
                      size="small"
                      fullWidth
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        "& .MuiOutlinedInput-root": {
                          height: { xs: 43, md: 46 },
                          bgcolor: "rgba(0,0,0,0.3)",
                          borderRadius: 1.5,
                          color: "#e4e4f2",
                          fontSize: { xs: 13, md: 14 },
                          "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                          "&:hover fieldset": { borderColor: "rgba(167,139,250,0.28)" },
                          "&.Mui-focused fieldset": { borderColor: "rgba(167,139,250,0.58)" },
                        },
                      }}
                    />
                    <Button
                      type="button"
                      aria-label="Open text color picker"
                      data-testid="text-color-trigger"
                      data-color={selectedTextColor}
                      disabled={!selectedTextOverlay}
                      onClick={handleOpenTextColorPicker}
                      sx={{
                        width: { xs: 43, md: 46 },
                        minWidth: { xs: 43, md: 46 },
                        height: { xs: 43, md: 46 },
                        p: 0,
                        borderRadius: 1.5,
                        bgcolor: "rgba(0,0,0,0.3)",
                        border: colorPickerOpen ? "1px solid rgba(167,139,250,0.72)" : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: colorPickerOpen ? "0 0 18px rgba(124,102,255,0.32)" : "none",
                        "&:hover": {
                          bgcolor: "rgba(124,102,255,0.12)",
                          borderColor: "rgba(167,139,250,0.55)",
                        },
                        "&.Mui-disabled": {
                          opacity: 0.45,
                          bgcolor: "rgba(255,255,255,0.04)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 0.8,
                          bgcolor: selectedTextColor,
                          border: "1px solid rgba(255,255,255,0.5)",
                          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.38)",
                        }}
                      />
                    </Button>
                    <Popover
                      open={colorPickerOpen}
                      anchorEl={colorPickerAnchorEl}
                      onClose={() => setColorPickerAnchorEl(null)}
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      transformOrigin={{ vertical: "top", horizontal: "right" }}
                      PaperProps={{
                        sx: {
                          mt: 1,
                          bgcolor: "#0d0d18",
                          color: "#e4e4f2",
                          border: "1px solid rgba(167,139,250,0.22)",
                          borderRadius: 1.5,
                          boxShadow: "0 24px 80px rgba(0,0,0,0.62), 0 0 30px rgba(124,102,255,0.16)",
                          overflow: "hidden",
                        },
                      }}
                    >
                      <TextColorPickerPanel
                        color={selectedTextColor}
                        recentColors={recentTextColors}
                        eyedropperActive={eyedropperActive}
                        onColorChange={applySelectedTextColor}
                        onRequestEyedropper={handleRequestTextEyedropper}
                      />
                    </Popover>
                  </Stack>
                  <AdjSlider
                    label="Text Size"
                    value={selectedTextOverlay?.size ?? DEFAULT_TEXT_OVERLAY_VALUES.size}
                    onChange={(value) => updateSelectedTextOverlay({ size: value })}
                    min={12}
                    max={72}
                  />
                  <AdjSlider
                    label="Text X"
                    value={selectedTextOverlay?.x ?? DEFAULT_TEXT_OVERLAY_VALUES.x}
                    onChange={(value) => updateSelectedTextOverlay({ x: value })}
                    min={0}
                    max={100}
                  />
                  <AdjSlider
                    label="Text Y"
                    value={selectedTextOverlay?.y ?? DEFAULT_TEXT_OVERLAY_VALUES.y}
                    onChange={(value) => updateSelectedTextOverlay({ y: value })}
                    min={0}
                    max={100}
                  />
                </Stack>
              )}
            </Box>

            <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <SectionHeader label="Light Controls" expanded={expanded.light} onClick={() => toggleSection("light")} />
            </Box>
            {expanded.light && (
              <Stack spacing={{ xs: 3, md: 3.2 }} sx={{ pt: { xs: 2, md: 2.3 }, pb: { xs: 3, md: 3.4 } }}>
                <AdjSlider label="Brightness" value={adjustments.brightness} onChange={(value) => updateAdj("brightness", value)} icon={<AutoFixHighIcon />} />
                <AdjSlider label="Exposure" value={adjustments.exposure} onChange={(value) => updateAdj("exposure", value)} icon={<AutoFixHighIcon />} />
                <AdjSlider label="Contrast" value={adjustments.contrast} onChange={(value) => updateAdj("contrast", value)} icon={<ContentCutIcon />} />
                <AdjSlider label="Highlights" value={adjustments.highlights} onChange={(value) => updateAdj("highlights", value)} />
                <AdjSlider label="Shadows" value={adjustments.shadows} onChange={(value) => updateAdj("shadows", value)} />
                <AdjSlider label="Whites" value={adjustments.whites} onChange={(value) => updateAdj("whites", value)} />
                <AdjSlider label="Blacks" value={adjustments.blacks} onChange={(value) => updateAdj("blacks", value)} />
              </Stack>
            )}

            <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <SectionHeader label="Color Controls" expanded={expanded.color} onClick={() => toggleSection("color")} />
            </Box>
            {expanded.color && (
              <Stack spacing={{ xs: 3, md: 3.2 }} sx={{ pt: { xs: 2, md: 2.3 }, pb: { xs: 3, md: 3.4 } }}>
                <AdjSlider label="Saturation" value={adjustments.saturation} onChange={(value) => updateAdj("saturation", value)} />
                <AdjSlider label="Vibrance" value={adjustments.vibrance} onChange={(value) => updateAdj("vibrance", value)} />
                <AdjSlider label="Temperature" value={adjustments.temperature} onChange={(value) => updateAdj("temperature", value)} />
                <AdjSlider label="Tint" value={adjustments.tint} onChange={(value) => updateAdj("tint", value)} />
              </Stack>
            )}

            <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <SectionHeader label="Effects" expanded={expanded.effects} onClick={() => toggleSection("effects")} />
            </Box>
            {expanded.effects && (
              <Stack spacing={{ xs: 3, md: 3.2 }} sx={{ pt: { xs: 2, md: 2.3 }, pb: { xs: 3, md: 3.4 } }}>
                <AdjSlider label="Texture" value={adjustments.texture} onChange={(value) => updateAdj("texture", value)} />
                <AdjSlider label="Clarity" value={adjustments.clarity} onChange={(value) => updateAdj("clarity", value)} />
                <AdjSlider label="Vignette" value={adjustments.vignetteAmount} onChange={(value) => updateAdj("vignetteAmount", value)} />
                <AdjSlider label="Grain" value={adjustments.grainAmount} onChange={(value) => updateAdj("grainAmount", value)} min={0} max={100} />
              </Stack>
            )}

            <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <SectionHeader label="Detail" expanded={expanded.detail} onClick={() => toggleSection("detail")} />
            </Box>
            {expanded.detail && (
              <Stack spacing={{ xs: 3, md: 3.2 }} sx={{ pt: { xs: 2, md: 2.3 }, pb: { xs: 3, md: 3.4 } }}>
                <AdjSlider label="Sharpening" value={adjustments.sharpeningAmount} onChange={(value) => updateAdj("sharpeningAmount", value)} min={0} max={150} />
                <AdjSlider label="Radius" value={adjustments.sharpeningRadius} onChange={(value) => updateAdj("sharpeningRadius", value)} min={1} max={3} />
                <AdjSlider label="Masking" value={adjustments.sharpeningMasking} onChange={(value) => updateAdj("sharpeningMasking", value)} min={0} max={100} />
              </Stack>
            )}

            <Box data-tour="presets" sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)", mt: 2 }}>
              <SectionHeader label="Preset Manager" expanded={expanded.presets} onClick={() => toggleSection("presets")} />
            </Box>
            {expanded.presets && (
              <Stack spacing={{ xs: 1.4, md: 1.6 }} sx={{ pt: { xs: 2, md: 2.3 }, pb: { xs: 3, md: 3.4 } }}>
                <Select
                  value={selectedSavedPresetId}
                  onChange={(event) => handleSavedPresetChange(event.target.value as string)}
                  size="small"
                  fullWidth
                  IconComponent={KeyboardArrowDownIcon}
                  inputProps={{ "aria-label": "Saved preset" }}
                  sx={{
                    height: { xs: 42, md: 46 },
                    bgcolor: "rgba(0,0,0,0.3)",
                    borderRadius: 1.5,
                    color: "#e4e4f2",
                    fontSize: { xs: 13, md: 14 },
                    "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                  }}
                >
                  <MenuItem value="none" disabled>
                    {presetLoading ? "Loading presets..." : savedPresets.length === 0 ? "No saved presets yet" : "Choose a preset"}
                  </MenuItem>
                  {savedPresets.map((preset) => (
                    <MenuItem key={preset.id} value={preset.id}>
                      {preset.presetName}
                    </MenuItem>
                  ))}
                </Select>
                {presetError && (
                  <Typography role="alert" sx={{ color: hasAuthToken ? "#fca5a5" : "#8888b8", fontSize: { xs: 11, md: 12 }, lineHeight: 1.55 }}>
                    {presetError}
                  </Typography>
                )}
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    startIcon={<AddIcon />}
                    disabled={!hasAuthToken}
                    onClick={() => {
                      setPresetError(null);
                      setPresetName("");
                      setSavePresetOpen(true);
                    }}
                    sx={{ bgcolor: "rgba(255,255,255,0.05)", color: "#8888d8" }}
                  >
                    Add Preset
                  </Button>
                  <Button
                    component="label"
                    fullWidth
                    startIcon={<FileDownloadOutlinedIcon />}
                    sx={{ bgcolor: "rgba(255,255,255,0.05)", color: "#8888d8" }}
                  >
                    Import
                    <input hidden type="file" accept="application/json,.json" aria-label="Import preset JSON" onChange={handleImportPreset} />
                  </Button>
                </Stack>
                <Button
                  fullWidth
                  startIcon={<FileUploadOutlinedIcon />}
                  variant="outlined"
                  onClick={handleExportPreset}
                  sx={{ color: "#8888d8", borderColor: "rgba(255,255,255,0.1)" }}
                >
                  Export JSON
                </Button>
              </Stack>
            )}
          </Box>

          <Box sx={{ p: { xs: 1.5, md: 2 }, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Button
              fullWidth
              onClick={handleResetManualEdits}
              sx={{
                minHeight: { xs: 42, md: 46 },
                py: { xs: 1, md: 1.15 },
                color: resetConfirmed ? "#86efac" : "#6868a0",
                border: `1px solid ${resetConfirmed ? "rgba(134,239,172,0.38)" : "rgba(255,255,255,0.05)"}`,
                bgcolor: resetConfirmed ? "rgba(22,101,52,0.18)" : "rgba(255,255,255,0.03)",
                fontSize: { xs: 11, md: 12 },
                fontWeight: 800,
                letterSpacing: "0.08em",
                boxShadow: resetConfirmed ? "0 0 18px rgba(34,197,94,0.2)" : "none",
                transform: resetConfirmed ? "translateY(-1px)" : "none",
                transition: "all 0.18s ease",
                "&:hover": {
                  color: resetConfirmed ? "#86efac" : "#a9a5ff",
                  bgcolor: resetConfirmed ? "rgba(22,101,52,0.18)" : "rgba(255,255,255,0.06)",
                },
              }}
            >
              {resetConfirmed ? "Edits Reset" : "Reset Manual Edits"}
            </Button>
          </Box>
        </Box>
      </Box>
      <Dialog
        open={savePresetOpen}
        onClose={() => {
          if (!presetSaving) setSavePresetOpen(false);
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: "#0d0d18",
            color: "#e4e4f2",
            border: "1px solid rgba(167,139,250,0.22)",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: "#f2f0ff", fontWeight: 800 }}>Save Preset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            value={presetName}
            onChange={(event) => {
              setPresetError(null);
              setPresetName(event.target.value);
            }}
            label="Preset name"
            inputProps={{ "aria-label": "Preset name" }}
            sx={{
              mt: 1,
              "& .MuiInputLabel-root": { color: "#8888b8" },
              "& .MuiOutlinedInput-root": {
                color: "#e4e4f2",
                bgcolor: "rgba(0,0,0,0.3)",
                "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
              },
            }}
          />
          {presetError && (
            <Typography role="alert" sx={{ color: "#fca5a5", fontSize: 12, mt: 1.2 }}>
              {presetError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button disabled={presetSaving} onClick={() => setSavePresetOpen(false)} sx={{ color: "#8888d8" }}>
            Cancel
          </Button>
          <Button
            disabled={presetSaving}
            onClick={handleSavePreset}
            variant="contained"
            sx={{ bgcolor: "#7c66ff", "&:hover": { bgcolor: "#6d5ae8" } }}
          >
            {presetSaving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
