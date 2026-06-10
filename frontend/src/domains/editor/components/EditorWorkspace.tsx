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
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import LinkIcon from "@mui/icons-material/Link";
import NorthWestIcon from "@mui/icons-material/NorthWest";
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
import Link from "next/link";
import type { ChangeEvent, MouseEvent, PointerEvent, ReactNode, WheelEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { restoreFace } from "@/domains/enhancement/services/restore-face-api";
import { ApiError, getApiAuthToken } from "@/infrastructure/api/api-client";
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

interface Adjustments {
  brightness: number;
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  saturation: number;
  vibrance: number;
  warmth: number;
}

interface FilterPreset {
  id: string;
  name: string;
  adj: Partial<Adjustments>;
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
  saturation: 0,
  vibrance: 0,
  warmth: 0,
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
  { id: "bw", name: "Black and White", adj: { contrast: 18, saturation: -100 } },
  { id: "vintage", name: "Vintage", adj: { warmth: 28, saturation: -24, contrast: 6 } },
  { id: "warm", name: "Warm", adj: { warmth: 35, saturation: 10, exposure: 8 } },
  { id: "cool", name: "Cool", adj: { warmth: -30, saturation: 5, contrast: 12 } },
];

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
  { id: "select", label: "Select", icon: <NorthWestIcon /> },
  { id: "crop", label: "Crop", icon: <CropIcon /> },
  { id: "rotate", label: "Rotate", icon: <Rotate90DegreesCcwIcon /> },
  { id: "flip", label: "Flip", icon: <FlipIcon /> },
  { id: "text", label: "Text", icon: <TextFieldsIcon /> },
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
  const merged = { ...adjustments, ...preset.adj };
  const brightness = Math.max(
    0.15,
    1 + merged.brightness * 0.005 + merged.exposure * 0.006 + merged.highlights * 0.002 + merged.shadows * 0.0015,
  );
  const contrast = Math.max(0.15, 1 + merged.contrast * 0.007 + merged.highlights * 0.0015 - merged.shadows * 0.001);
  const saturate = Math.max(0, 1 + merged.saturation / 100 + merged.vibrance / 180);
  const hueRotate = (merged.warmth ?? 0) * -0.14;
  const sepia = (merged.warmth ?? 0) > 0 ? ((merged.warmth ?? 0) / 100) * 0.22 : 0;
  return [
    `brightness(${brightness.toFixed(3)})`,
    `contrast(${contrast.toFixed(3)})`,
    `saturate(${saturate.toFixed(3)})`,
    sepia > 0.008 ? `sepia(${sepia.toFixed(3)})` : "",
    Math.abs(hueRotate) > 0.3 ? `hue-rotate(${hueRotate.toFixed(1)}deg)` : "",
  ]
    .filter(Boolean)
    .join(" ");
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
    <Stack direction="row" spacing={1.4} alignItems="center">
      <Box
        component="img"
        src="/ls-logo.png"
        alt=""
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: "block",
          objectFit: "cover",
          boxShadow: "0 0 16px rgba(124,102,255,0.45)",
        }}
      />
      <Stack direction="row" spacing={0.6} alignItems="baseline">
        <Typography
          sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 22,
            fontWeight: 700,
            color: "#e4e4f2",
            lineHeight: 1,
          }}
        >
          Lumina
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#4a4a78", letterSpacing: "0.08em" }}>
          STUDIO
        </Typography>
      </Stack>
    </Stack>
  );
}

function ToolButton({
  active,
  label,
  children,
  onClick,
}: {
  active?: boolean;
  label: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <IconButton
      aria-label={label}
      title={label}
      onClick={onClick}
      sx={{
        width: 42,
        height: 42,
        borderRadius: 1.5,
        color: active ? "#a78bfa" : "#52527a",
        bgcolor: active ? "rgba(124,102,255,0.18)" : "transparent",
        outline: active ? "1px solid rgba(124,102,255,0.35)" : "none",
        "&:hover": { bgcolor: "rgba(124,102,255,0.12)", color: "#a78bfa" },
      }}
    >
      {children}
    </IconButton>
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
        py: 1.25,
        color: expanded ? "#a9a5ff" : "#6868a0",
        fontSize: 12,
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ display: "flex", color: "#6868a0", "& svg": { fontSize: 14 } }}>{icon}</Box>
          <Typography
            sx={{
              color: "#8888d8",
              fontSize: 12,
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
            fontSize: 11,
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
          height: 18,
          p: 0,
          color: "#7c66ff",
          "& .MuiSlider-rail": {
            height: 1,
            bgcolor: "rgba(255,255,255,0.12)",
            opacity: 1,
          },
          "& .MuiSlider-track": { height: 1.5 },
          "& .MuiSlider-thumb": {
            width: 12,
            height: 12,
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
  const [exportHovered, setExportHovered] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);
  const [expanded, setExpanded] = useState({
    ai: true,
    light: false,
    color: false,
    presets: false,
  });
  const exportStatusTimeoutRef = useRef<number | null>(null);
  const aiStatusTimeoutRef = useRef<number | null>(null);
  const resetTimeoutRef = useRef<number | null>(null);
  const freeCropDragRef = useRef<FreeCropDragState | null>(null);
  const colorPickerReturnAnchorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setGuestSessionId(getOrCreateGuestSessionId());
    setHasAuthToken(Boolean(getApiAuthToken()));

    return () => {
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
  }, []);

  const imageUrl = uploadedImage;
  const filterPreviewUrl = imageUrl;
  const imageAlt = uploadedImage ? "Uploaded workspace image" : "";
  const cssFilter = useMemo(
    () => buildCSSFilter(adjustments, selectedPreset, showOriginal),
    [adjustments, selectedPreset, showOriginal],
  );
  const cropPreset = CROP_PRESETS.find((preset) => preset.id === cropPresetId) ?? CROP_PRESETS[0];
  const activeCropRatio = showOriginal || cropPreset.id === "none" || cropPreset.id === "free" ? null : cropPreset.ratio;
  const cropMode = showOriginal ? "none" : cropPreset.id === "free" ? "free" : activeCropRatio ?? "none";
  const previewTransform = showOriginal ? "none" : buildPreviewTransform(rotation, flipHorizontal, flipVertical);
  const selectedTextOverlay = textOverlays.find((overlay) => overlay.id === selectedTextId) ?? null;
  const selectedTextColor = selectedTextOverlay?.color ?? DEFAULT_TEXT_OVERLAY_VALUES.color;
  const exportButtonLabel = getExportButtonLabel(exportStatus, exportHovered);
  const colorPickerOpen = Boolean(colorPickerAnchorEl);

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
    setFreeCrop({ ...DEFAULT_FREE_CROP });
    setDraftFreeCrop({ ...DEFAULT_FREE_CROP });
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

  const handleResetManualEdits = () => {
    resetManualState();
    setResetConfirmed(true);

    if (resetTimeoutRef.current) {
      window.clearTimeout(resetTimeoutRef.current);
    }

    resetTimeoutRef.current = window.setTimeout(() => setResetConfirmed(false), 900);
  };

  const toggleSection = (key: keyof typeof expanded) => {
    setExpanded((current) => ({ ...current, [key]: !current[key] }));
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

    if (value === "free") {
      setDraftFreeCrop(freeCrop);
    }
  };

  const applyFreeCrop = () => {
    const appliedCrop = clampFreeCrop(draftFreeCrop);
    freeCropDragRef.current = null;
    setDraftFreeCrop(appliedCrop);
    setFreeCrop(appliedCrop);
    setCropPresetId("free");
  };

  const cancelFreeCrop = () => {
    setDraftFreeCrop(freeCrop);
    setCropPresetId("none");
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
        height: "100vh",
        bgcolor: "#08080e",
        color: "#e4e4f2",
        display: "grid",
        gridTemplateRows: "55px 1fr",
        overflow: "hidden",
        fontFamily: '"Outfit", sans-serif',
      }}
    >
      <Box
        component="header"
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "214px minmax(0, 1fr) 314px",
            md: "260px minmax(0, 1fr) 326px",
            lg: "320px minmax(0, 1fr) 344px",
          },
          alignItems: "center",
          px: 0,
          bgcolor: "#0d0d18",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Box sx={{ pl: { xs: 1.1, md: 1.5, lg: 2 }, minWidth: 0 }}>
          <Brand />
        </Box>

        <Box sx={{ minWidth: 0 }} />

        <Stack
          direction="row"
          spacing={{ xs: 0.45, md: 0.65, lg: 0.8 }}
          justifyContent="flex-end"
          alignItems="center"
          sx={{ minWidth: 0, px: { xs: 0.8, md: 1.1, lg: 1.4 } }}
        >
          {hasAuthToken && (
            <>
              <IconButton
                component={Link}
                href={APP_ROUTES.history}
                size="small"
                title="History"
                aria-label="History"
                sx={{ color: "#6868a0", "&:hover": { color: "#a78bfa", bgcolor: "rgba(124,102,255,0.1)" } }}
              >
                <HistoryIcon fontSize="small" />
              </IconButton>
              <IconButton
                component={Link}
                href={APP_ROUTES.settings}
                size="small"
                title="Settings"
                aria-label="Settings"
                sx={{ color: "#6868a0", "&:hover": { color: "#a78bfa", bgcolor: "rgba(124,102,255,0.1)" } }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
              <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 0.2 }} />
            </>
          )}
          <IconButton size="small" sx={{ color: "#38385a", width: 34, height: 34 }}>
            <UndoIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: "#38385a", width: 34, height: 34 }}>
            <RedoIcon fontSize="small" />
          </IconButton>
          <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 0.35 }} />
          <Button
            size="small"
            startIcon={<VisibilityOffOutlinedIcon sx={{ fontSize: 14 }} />}
            disabled={!imageUrl}
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            sx={{
              color: showOriginal ? "#a78bfa" : "#6868a0",
              border: `1px solid ${showOriginal ? "rgba(124,102,255,0.4)" : "rgba(255,255,255,0.06)"}`,
              bgcolor: showOriginal ? "rgba(124,102,255,0.18)" : "rgba(255,255,255,0.04)",
              px: { xs: 0.75, md: 0.9, lg: 1.1 },
              minWidth: { xs: 94, md: 100, lg: 104 },
              height: 36,
              fontSize: { xs: 10, md: 10.5, lg: 11 },
              lineHeight: 1.05,
              textTransform: "none",
              "& .MuiButton-startIcon": {
                mr: 0.7,
                "& svg": { fontSize: 14 },
              },
            }}
          >
            Before / After
          </Button>
          <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 0.35 }} />
          <Button
            startIcon={<DownloadIcon sx={{ fontSize: 17 }} />}
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
              px: 2,
              minWidth: { xs: 96, md: 104, lg: 112 },
              height: 38,
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
              },
              "&:disabled": {
                color: "rgba(255,255,255,0.46)",
                background: "rgba(255,255,255,0.06)",
                boxShadow: "none",
              },
            }}
          >
            <Box component="span" sx={{ position: "relative", zIndex: 1, minWidth: 58, textAlign: "center" }}>
              {exportButtonLabel}
            </Box>
          </Button>
          <IconButton
            component={Link}
            href={APP_ROUTES.landing}
            title="Exit to Landing"
            sx={{
              color: "#8888b8",
              width: 38,
              height: 38,
              ml: 0.4,
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
          gridTemplateColumns: {
            xs: "56px minmax(0, 1fr) 314px",
            md: "60px minmax(0, 1fr) 326px",
            lg: "62px minmax(0, 1fr) 344px",
          },
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            bgcolor: "#0d0d18",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.7,
            py: 1.8,
          }}
        >
          {tools.map((tool) => (
            <ToolButton
              key={tool.id}
              label={tool.label}
              active={selectedTool === tool.id}
              onClick={() => handleSelectTool(tool.id)}
            >
              {tool.icon}
            </ToolButton>
          ))}
          <Box sx={{ flex: 1 }} />
          <IconButton
            component={Link}
            href={hasAuthToken ? APP_ROUTES.settings : APP_ROUTES.login}
            aria-label={hasAuthToken ? "Account settings" : "Sign in"}
            title={hasAuthToken ? "Account settings" : "Sign in"}
            sx={{
              width: 42,
              height: 42,
              borderRadius: 1.5,
              color: "#52527a",
              "&:hover": { bgcolor: "rgba(124,102,255,0.12)", color: "#a78bfa" },
            }}
          >
            <PersonOutlineIcon />
          </IconButton>
          <ToolButton label="Zoom in" onClick={() => setZoom((current) => Math.min(300, current + 10))}>
            <ZoomInIcon />
          </ToolButton>
          <Typography sx={{ color: "#38385a", fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }}>
            {zoom}%
          </Typography>
          <ToolButton label="Zoom out" onClick={() => setZoom((current) => Math.max(20, current - 10))}>
            <ZoomOutIcon />
          </ToolButton>
        </Box>

        <Box sx={{ minWidth: 0, minHeight: 0, display: "grid", gridTemplateRows: "1fr 120px" }}>
          <Box
            onWheel={handleWorkspaceWheel}
            sx={{
              position: "relative",
              minHeight: 0,
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              bgcolor: "#06060c",
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
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
              <Stack role="status" spacing={1.5} alignItems="center" sx={{ color: "#a78bfa", zIndex: 1 }}>
                <CircularProgress size={26} sx={{ color: "#a78bfa" }} />
                <Typography sx={{ color: "#c8c8e4", fontSize: 14 }}>Loading image...</Typography>
              </Stack>
            )}

            {!imageLoading && !imageUrl && (
              <Stack
                spacing={2}
                alignItems="center"
                sx={{
                  zIndex: 1,
                  width: "min(520px, calc(100% - 32px))",
                  p: { xs: 2.5, md: 4 },
                  border: "1px dashed rgba(167,139,250,0.42)",
                  borderRadius: 2,
                  bgcolor: "rgba(13,13,24,0.82)",
                  textAlign: "center",
                }}
              >
                <UploadFileIcon sx={{ color: "#a78bfa", fontSize: 38 }} />
                <Box>
                  <Typography sx={{ color: "#e4e4f2", fontSize: 22, fontWeight: 700 }}>
                    Upload an image to start
                  </Typography>
                  <Typography sx={{ color: "#8888b8", fontSize: 14, mt: 0.7 }}>
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
                    px: 2.5,
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
                  maxWidth: "calc(100% - 80px)",
                }}
              >
                <Box
                  data-testid="workspace-preview"
                  data-transform={previewTransform}
                  data-crop-ratio={cropMode}
                  onPointerDown={handleWorkspacePreviewPointerDown}
                  sx={{
                    position: "relative",
                    display: "inline-block",
                    width: activeCropRatio ? "min(70vw, 760px)" : "auto",
                    maxWidth: "100%",
                    aspectRatio: activeCropRatio ?? "auto",
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
                      width: activeCropRatio ? "100%" : "auto",
                      height: activeCropRatio ? "100%" : "auto",
                      maxHeight: activeCropRatio ? "none" : "calc(100vh - 255px)",
                      maxWidth: activeCropRatio ? "none" : "100%",
                      objectFit: activeCropRatio ? "cover" : "contain",
                      filter: cssFilter,
                      transition: "filter 0.08s linear",
                    }}
                  />
                  {!showOriginal && cropPreset.id === "free" && (
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
                            width: 12,
                            height: 12,
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

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              px: 2.3,
              bgcolor: "#0d0d18",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {FILTER_PRESETS.map((preset) => {
              const active = selectedPreset.id === preset.id;
              const swatchBackground =
                preset.id === "bw"
                  ? "linear-gradient(135deg, #101018, #d4d4e7)"
                  : preset.id === "warm"
                    ? "linear-gradient(135deg, #4c1d1d, #f59e0b)"
                    : preset.id === "cool"
                      ? "linear-gradient(135deg, #0f172a, #38bdf8)"
                      : preset.id === "vintage"
                        ? "linear-gradient(135deg, #312e21, #c4a36d)"
                        : preset.id === "vivid"
                          ? "linear-gradient(135deg, #312e81, #ec4899)"
                          : "linear-gradient(135deg, #171728, #5b5b88)";
              return (
                <Box
                  component="button"
                  key={preset.id}
                  aria-label={preset.name}
                  onClick={() => setSelectedPreset(preset)}
                  sx={{
                    p: 0,
                    border: 0,
                    bgcolor: "transparent",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.8,
                    opacity: active ? 1 : 0.62,
                    cursor: "pointer",
                    minWidth: 82,
                  }}
                >
                  <Box
                    sx={{
                      width: 82,
                      height: 56,
                      borderRadius: 1,
                      overflow: "hidden",
                      outline: active ? "2px solid #7c66ff" : "2px solid rgba(255,255,255,0.08)",
                      outlineOffset: 1,
                    }}
                  >
                    {filterPreviewUrl ? (
                      <Box
                        component="img"
                        src={filterPreviewUrl}
                        alt=""
                        aria-hidden="true"
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          filter: buildCSSFilter({ ...DEFAULT_ADJUSTMENTS }, preset, false),
                        }}
                      />
                    ) : (
                      <Box
                        aria-hidden="true"
                        sx={{
                          width: "100%",
                          height: "100%",
                          background: swatchBackground,
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    sx={{
                      color: active ? "#a78bfa" : "#3a3a62",
                      fontSize: 12,
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {preset.name}
                  </Typography>
                </Box>
              );
            })}
            <Stack
              spacing={0.6}
              alignItems="center"
              sx={{
                ml: "auto",
                pr: 1.4,
                minWidth: 188,
                flexShrink: 0,
              }}
            >
              <Button
                component="label"
                size="small"
                startIcon={<UploadFileIcon sx={{ fontSize: 14 }} />}
                sx={{
                  color: "#a9a5ff",
                  border: "1px solid rgba(124,102,255,0.22)",
                  bgcolor: "rgba(255,255,255,0.045)",
                  px: 1.8,
                  minWidth: 138,
                  height: 34,
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
                  fontSize: 10,
                  fontFamily: '"JetBrains Mono", monospace',
                  whiteSpace: "nowrap",
                }}
              >
                {guestSessionId ? `Guest workspace ${guestSessionId.slice(0, 8)}` : "Guest workspace"}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            bgcolor: "#0d0d18",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            display: "grid",
            gridTemplateRows: "1fr auto",
            minHeight: 0,
          }}
        >
          <Box sx={{ overflowY: "auto", px: 2.5, pt: 3, pb: 2, scrollbarWidth: "none" }}>
            <Box sx={{ pb: 2.2, mb: 2.2, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <SectionHeader label="AI Face Restoration" expanded={expanded.ai} onClick={() => toggleSection("ai")} />
              {expanded.ai && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      color: "#8888b8",
                      fontSize: 12,
                      px: 1.2,
                      py: 1.1,
                      borderRadius: 1,
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
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        mb: 1,
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
                            <LinkIcon sx={{ color: "#52527a", fontSize: 16 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: 40,
                          bgcolor: "rgba(0,0,0,0.3)",
                          borderRadius: 2,
                          color: "#e4e4f2",
                          fontSize: 13,
                          "& fieldset": { borderColor: "rgba(255,255,255,0.05)" },
                          "&:hover fieldset": { borderColor: "rgba(124,102,255,0.3)" },
                        },
                      }}
                    />
                    <Typography sx={{ color: "#52527a", fontSize: 11, lineHeight: 1.55, mt: 1.1 }}>
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
                      <Typography sx={{ color: "#8888d8", fontSize: 12 }}>Use saved token</Typography>
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
                      py: 1.5,
                      borderRadius: 2,
                      color: "#a78bfa",
                      bgcolor: "rgba(124,102,255,0.15)",
                      border: "1px solid rgba(124,102,255,0.32)",
                      fontWeight: 800,
                      fontSize: 17,
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
                    <Typography sx={{ color: "#6868a0", fontSize: 14 }}>Status:</Typography>
                    <Typography sx={{ color: getStatusColor(aiStatus), fontSize: 14, textAlign: "right" }}>
                      {aiStatus}
                    </Typography>
                  </Stack>
                </Stack>
              )}
            </Box>

            <Box sx={{ mb: 2.2 }}>
              <Histogram adjustments={adjustments} />
            </Box>

            <Box sx={{ pb: 2.4, mb: 2.2, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <Typography
                sx={{
                  color: "#a9a5ff",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  mb: 2,
                }}
              >
                {tools.find((tool) => tool.id === selectedTool)?.label} Tool
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
                      height: 41,
                      bgcolor: "rgba(0,0,0,0.3)",
                      borderRadius: 1.5,
                      color: "#e4e4f2",
                      fontSize: 13,
                      "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                    }}
                  >
                    {CROP_PRESETS.map((preset) => (
                      <MenuItem key={preset.id} value={preset.id}>
                        {preset.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {cropPresetId === "free" ? (
                    <Stack spacing={1.4}>
                      <Typography sx={{ color: "#52527a", fontSize: 11, lineHeight: 1.55 }}>
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
                  ) : (
                    <Typography sx={{ color: "#52527a", fontSize: 11, lineHeight: 1.55 }}>
                      {cropPresetId === "none"
                        ? "No crop keeps the full image in the browser preview and export."
                        : "Fixed crop ratios are previewed in the browser by clipping the workspace image."}
                    </Typography>
                  )}
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
                  <Typography sx={{ color: "#6868a0", fontSize: 13 }}>Rotation: {rotation} deg</Typography>
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
                          height: 43,
                          bgcolor: "rgba(0,0,0,0.3)",
                          borderRadius: 1.5,
                          color: "#e4e4f2",
                          fontSize: 13,
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
                        width: 43,
                        minWidth: 43,
                        height: 43,
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
              <Stack spacing={3} sx={{ pt: 2, pb: 3 }}>
                <AdjSlider label="Brightness" value={adjustments.brightness} onChange={(value) => updateAdj("brightness", value)} icon={<AutoFixHighIcon />} />
                <AdjSlider label="Exposure" value={adjustments.exposure} onChange={(value) => updateAdj("exposure", value)} icon={<AutoFixHighIcon />} />
                <AdjSlider label="Contrast" value={adjustments.contrast} onChange={(value) => updateAdj("contrast", value)} icon={<ContentCutIcon />} />
                <AdjSlider label="Highlights" value={adjustments.highlights} onChange={(value) => updateAdj("highlights", value)} />
                <AdjSlider label="Shadows" value={adjustments.shadows} onChange={(value) => updateAdj("shadows", value)} />
              </Stack>
            )}

            <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <SectionHeader label="Color Controls" expanded={expanded.color} onClick={() => toggleSection("color")} />
            </Box>
            {expanded.color && (
              <Stack spacing={3} sx={{ pt: 2, pb: 3 }}>
                <AdjSlider label="Saturation" value={adjustments.saturation} onChange={(value) => updateAdj("saturation", value)} />
                <AdjSlider label="Vibrance" value={adjustments.vibrance} onChange={(value) => updateAdj("vibrance", value)} />
                <AdjSlider label="Warmth" value={adjustments.warmth} onChange={(value) => updateAdj("warmth", value)} />
              </Stack>
            )}

            <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)", mt: 2 }}>
              <SectionHeader label="Preset Manager" expanded={expanded.presets} onClick={() => toggleSection("presets")} />
            </Box>
            {expanded.presets && (
              <Stack spacing={1.4} sx={{ pt: 2, pb: 3 }}>
                <Select
                  value="none"
                  size="small"
                  fullWidth
                  IconComponent={KeyboardArrowDownIcon}
                  sx={{
                    height: 41,
                    bgcolor: "rgba(0,0,0,0.3)",
                    borderRadius: 1.5,
                    color: "#e4e4f2",
                    fontSize: 13,
                    "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                  }}
                >
                  <MenuItem value="none" disabled>
                    No saved presets yet
                  </MenuItem>
                </Select>
                <Stack direction="row" spacing={1}>
                  <Button fullWidth startIcon={<AddIcon />} sx={{ bgcolor: "rgba(255,255,255,0.05)", color: "#8888d8" }}>
                    Add Preset
                  </Button>
                  <Button fullWidth startIcon={<FileDownloadOutlinedIcon />} sx={{ bgcolor: "rgba(255,255,255,0.05)", color: "#8888d8" }}>
                    Import
                  </Button>
                </Stack>
                <Button
                  fullWidth
                  startIcon={<FileUploadOutlinedIcon />}
                  variant="outlined"
                  sx={{ color: "#8888d8", borderColor: "rgba(255,255,255,0.1)" }}
                >
                  Export JSON
                </Button>
              </Stack>
            )}
          </Box>

          <Box sx={{ p: 1.5, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Button
              fullWidth
              onClick={handleResetManualEdits}
              sx={{
                py: 1,
                color: resetConfirmed ? "#86efac" : "#6868a0",
                border: `1px solid ${resetConfirmed ? "rgba(134,239,172,0.38)" : "rgba(255,255,255,0.05)"}`,
                bgcolor: resetConfirmed ? "rgba(22,101,52,0.18)" : "rgba(255,255,255,0.03)",
                fontSize: 11,
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
    </Box>
  );
}
