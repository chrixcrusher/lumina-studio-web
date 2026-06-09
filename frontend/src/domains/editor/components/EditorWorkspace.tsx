"use client";

import AddIcon from "@mui/icons-material/Add";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import CropIcon from "@mui/icons-material/Crop";
import DownloadIcon from "@mui/icons-material/Download";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import FlipIcon from "@mui/icons-material/Flip";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import LinkIcon from "@mui/icons-material/Link";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import RedoIcon from "@mui/icons-material/Redo";
import Rotate90DegreesCcwIcon from "@mui/icons-material/Rotate90DegreesCcw";
import SearchIcon from "@mui/icons-material/Search";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import UndoIcon from "@mui/icons-material/Undo";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { APP_ROUTES } from "@/shared/constants/routes";
import { getOrCreateGuestSessionId } from "@/shared/guest-session";

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
  text: string;
  color: string;
  size: number;
  x: number;
  y: number;
}

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

const DEFAULT_TEXT_OVERLAY: TextOverlayState = {
  text: "",
  color: "#ffffff",
  size: 34,
  x: 50,
  y: 50,
};

const CROP_PRESETS = [
  { id: "free", label: "Free", ratio: null, exportRatio: null },
  { id: "square", label: "1:1", ratio: "1 / 1", exportRatio: 1 },
  { id: "portrait", label: "4:5", ratio: "4 / 5", exportRatio: 4 / 5 },
  { id: "wide", label: "16:9", ratio: "16 / 9", exportRatio: 16 / 9 },
] as const satisfies readonly CropPreset[];

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_SIZE_MB = MAX_UPLOAD_SIZE_BYTES / (1024 * 1024);
const SUPPORTED_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const PHOTOS = [
  {
    id: "mountain",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&h=900&fit=crop&auto=format",
    alt: "Mountain lake at golden hour",
  },
  {
    id: "forest",
    url: "https://images.unsplash.com/photo-1448375240703-a691af7d4399?w=1400&h=900&fit=crop&auto=format",
    alt: "Misty forest path",
  },
];

const FILTER_PRESETS: FilterPreset[] = [
  { id: "original", name: "Original", adj: {} },
  { id: "vivid", name: "Vivid", adj: { exposure: 5, contrast: 28, saturation: 38 } },
  { id: "bw", name: "Black and White", adj: { contrast: 18, saturation: -100 } },
  { id: "vintage", name: "Vintage", adj: { warmth: 28, saturation: -24, contrast: 6 } },
  { id: "warm", name: "Warm", adj: { warmth: 35, saturation: 10, exposure: 8 } },
  { id: "cool", name: "Cool", adj: { warmth: -30, saturation: 5, contrast: 12 } },
];

const tools = [
  { id: "crop", label: "Crop", icon: <CropIcon /> },
  { id: "rotate", label: "Rotate", icon: <Rotate90DegreesCcwIcon /> },
  { id: "flip", label: "Flip", icon: <FlipIcon /> },
  { id: "text", label: "Text", icon: <TextFieldsIcon /> },
];

function thumbUrl(url: string, w: number, h: number) {
  return url.replace(/w=\d+/, `w=${w}`).replace(/h=\d+/, `h=${h}`);
}

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

function makeExportFileName(fileName: string | null) {
  const baseName = fileName?.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "");
  return `${baseName || "lumina-studio-image"}-edited.png`;
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
  const [activePhoto, setActivePhoto] = useState<(typeof PHOTOS)[number] | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState("crop");
  const [selectedPreset, setSelectedPreset] = useState(FILTER_PRESETS[0]);
  const [adjustments, setAdjustments] = useState<Adjustments>({ ...DEFAULT_ADJUSTMENTS });
  const [cropPresetId, setCropPresetId] = useState<(typeof CROP_PRESETS)[number]["id"]>("free");
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [textOverlay, setTextOverlay] = useState<TextOverlayState>({ ...DEFAULT_TEXT_OVERLAY });
  const [showOriginal, setShowOriginal] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [hfToken, setHfToken] = useState("");
  const [aiStatus, setAiStatus] = useState("Ready");
  const [exportStatus, setExportStatus] = useState("Ready");
  const [expanded, setExpanded] = useState({
    ai: true,
    light: false,
    color: false,
    presets: false,
  });

  useEffect(() => {
    setGuestSessionId(getOrCreateGuestSessionId());
  }, []);

  const imageUrl = uploadedImage ?? activePhoto?.url ?? null;
  const filterPreviewUrl = imageUrl ?? PHOTOS[0].url;
  const imageAlt = uploadedImage ? "Uploaded workspace image" : activePhoto?.alt ?? "";
  const cssFilter = useMemo(
    () => buildCSSFilter(adjustments, selectedPreset, showOriginal),
    [adjustments, selectedPreset, showOriginal],
  );
  const cropPreset = CROP_PRESETS.find((preset) => preset.id === cropPresetId) ?? CROP_PRESETS[0];
  const activeCropRatio = showOriginal ? null : cropPreset.ratio;
  const previewTransform = showOriginal ? "none" : buildPreviewTransform(rotation, flipHorizontal, flipVertical);

  const updateAdj = (key: keyof Adjustments, value: number) => {
    setAdjustments((current) => ({ ...current, [key]: value }));
    setSelectedPreset(FILTER_PRESETS[0]);
  };

  const resetManualEdits = () => {
    setAdjustments({ ...DEFAULT_ADJUSTMENTS });
    setSelectedPreset(FILTER_PRESETS[0]);
    setCropPresetId("free");
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setTextOverlay({ ...DEFAULT_TEXT_OVERLAY });
    setShowOriginal(false);
  };

  const toggleSection = (key: keyof typeof expanded) => {
    setExpanded((current) => ({ ...current, [key]: !current[key] }));
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
      setActivePhoto(null);
      setSelectedPreset(FILTER_PRESETS[0]);
      resetManualEdits();
      setImageLoading(false);
    };

    reader.onerror = () => {
      setUploadError("The selected file could not be loaded as an image.");
      setImageLoading(false);
    };

    window.setTimeout(() => reader.readAsDataURL(file), 0);
  };

  const handleAiRestore = () => {
    if (!imageUrl) {
      setAiStatus("Image Required");
      return;
    }

    setAiStatus("Processing...");
    window.setTimeout(() => setAiStatus(hfToken.trim() ? "Restoration Complete" : "Token Required"), 650);
    window.setTimeout(() => setAiStatus("Ready"), 3000);
  };

  const handleExport = () => {
    if (!imageUrl) {
      setExportStatus("Image Required");
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
        setExportStatus("Export failed");
        return;
      }

      const crop = getCenteredCrop(sourceWidth, sourceHeight, cropPreset.exportRatio);
      const normalizedRotation = ((rotation % 360) + 360) % 360;
      const swapsAxis = normalizedRotation === 90 || normalizedRotation === 270;
      const canvas = document.createElement("canvas");
      canvas.width = swapsAxis ? crop.sourceHeight : crop.sourceWidth;
      canvas.height = swapsAxis ? crop.sourceWidth : crop.sourceHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        setExportStatus("Export failed");
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

      const overlayText = textOverlay.text.trim();
      if (overlayText) {
        context.filter = "none";
        context.fillStyle = textOverlay.color;
        context.font = `800 ${textOverlay.size}px sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.shadowColor = "rgba(0,0,0,0.72)";
        context.shadowBlur = 12;
        context.shadowOffsetY = 2;
        context.fillText(
          overlayText,
          -crop.sourceWidth / 2 + (crop.sourceWidth * textOverlay.x) / 100,
          -crop.sourceHeight / 2 + (crop.sourceHeight * textOverlay.y) / 100,
          crop.sourceWidth * 0.86,
        );
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
      } catch {
        setExportStatus("Export failed");
      }
    };

    sourceImage.onerror = () => {
      setExportStatus("Export failed");
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
          gridTemplateColumns: "320px 1fr 420px",
          alignItems: "center",
          px: 2,
          bgcolor: "#0d0d18",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Brand />

        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
          {PHOTOS.map((photo) => (
            <Box
              component="button"
              key={photo.id}
              onClick={() => {
                setActivePhoto(photo);
                setUploadedImage(null);
                setUploadedFileName(photo.alt);
                setUploadError(null);
                setImageLoading(false);
                resetManualEdits();
              }}
              sx={{
                width: 60,
                height: 40,
                p: 0,
                border: 0,
                borderRadius: 1,
                overflow: "hidden",
                outline: activePhoto?.id === photo.id && !uploadedImage ? "2px solid #7c66ff" : "2px solid rgba(255,255,255,0.08)",
                outlineOffset: 1,
                opacity: activePhoto?.id === photo.id && !uploadedImage ? 1 : 0.58,
                bgcolor: "transparent",
                cursor: "pointer",
              }}
            >
              <Box
                component="img"
                src={thumbUrl(photo.url, 120, 80)}
                alt={photo.alt}
                sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </Box>
          ))}
          <Button
            component="label"
            size="small"
            startIcon={<UploadFileIcon sx={{ fontSize: 14 }} />}
            sx={{
              ml: 1,
              color: "#6868a0",
              border: "1px solid rgba(255,255,255,0.06)",
              bgcolor: "rgba(255,255,255,0.04)",
              px: 1.4,
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
              display: { xs: "none", lg: "block" },
              color: "#52527a",
              fontSize: 11,
              fontFamily: '"JetBrains Mono", monospace',
              whiteSpace: "nowrap",
            }}
          >
            {guestSessionId ? `Guest workspace ${guestSessionId.slice(0, 8)}` : "Guest workspace"}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
          <IconButton size="small" sx={{ color: "#38385a" }}>
            <UndoIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: "#38385a" }}>
            <RedoIcon fontSize="small" />
          </IconButton>
          <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 0.6 }} />
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
              px: 1.4,
            }}
          >
            Before / After
          </Button>
          <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 0.6 }} />
          <Button
            startIcon={<DownloadIcon sx={{ fontSize: 17 }} />}
            variant="contained"
            disabled={!imageUrl}
            onClick={handleExport}
            sx={{
              color: "#fff",
              background: "linear-gradient(135deg, #7c66ff, #9333ea)",
              boxShadow: "0 0 22px rgba(124,102,255,0.35)",
              px: 2.3,
            }}
          >
            Export
          </Button>
          <Typography
            aria-live="polite"
            sx={{
              minWidth: 76,
              color: exportStatus === "Export failed" ? "#fecaca" : "#6868a0",
              fontSize: 11,
              fontFamily: '"JetBrains Mono", monospace',
              whiteSpace: "nowrap",
            }}
          >
            {exportStatus}
          </Typography>
          <IconButton component={Link} href={APP_ROUTES.landing} title="Exit to Landing" sx={{ color: "#8888b8" }}>
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Box>

      <Box
        sx={{
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "62px minmax(0,1fr) 344px",
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
              onClick={() => setSelectedTool(tool.id)}
            >
              {tool.icon}
            </ToolButton>
          ))}
          <Box sx={{ flex: 1 }} />
          <ToolButton label="Account">
            <PersonOutlineIcon />
          </ToolButton>
          <ToolButton label="Zoom in" onClick={() => setZoom((current) => Math.min(300, current + 10))}>
            <SearchIcon />
          </ToolButton>
          <Typography sx={{ color: "#38385a", fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }}>
            {zoom}%
          </Typography>
          <ToolButton label="Zoom out" onClick={() => setZoom((current) => Math.max(20, current - 10))}>
            <SearchIcon sx={{ transform: "scaleX(-1)" }} />
          </ToolButton>
        </Box>

        <Box sx={{ minWidth: 0, minHeight: 0, display: "grid", gridTemplateRows: "1fr 120px" }}>
          <Box
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
                  data-crop-ratio={activeCropRatio ?? "free"}
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
                  {!showOriginal && textOverlay.text.trim() && (
                    <Box
                      data-testid="text-overlay"
                      sx={{
                        position: "absolute",
                        left: `${textOverlay.x}%`,
                        top: `${textOverlay.y}%`,
                        transform: "translate(-50%, -50%)",
                        color: textOverlay.color,
                        fontSize: `${textOverlay.size}px`,
                        fontWeight: 800,
                        lineHeight: 1.05,
                        textAlign: "center",
                        textShadow: "0 2px 12px rgba(0,0,0,0.72)",
                        maxWidth: "86%",
                        overflowWrap: "anywhere",
                        pointerEvents: "none",
                      }}
                    >
                      {textOverlay.text}
                    </Box>
                  )}
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
                    <Box
                      component="img"
                      src={thumbUrl(filterPreviewUrl, 164, 112)}
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

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Checkbox
                      size="small"
                      sx={{
                        p: 0,
                        color: "#6868a0",
                        "&.Mui-checked": { color: "#7c66ff" },
                      }}
                    />
                    <Typography sx={{ color: "#8888d8", fontSize: 12 }}>Save token for future use</Typography>
                  </Stack>

                  <Button
                    fullWidth
                    onClick={handleAiRestore}
                    disabled={!imageUrl}
                    startIcon={<AutoFixHighIcon />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      bgcolor: "rgba(124,102,255,0.15)",
                      color: "#a78bfa",
                      border: "1px solid rgba(124,102,255,0.32)",
                      fontWeight: 800,
                      fontSize: 17,
                      "&:hover": { bgcolor: "rgba(124,102,255,0.2)" },
                    }}
                  >
                    AI Restore
                  </Button>

                  <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5 }}>
                    <Typography sx={{ color: "#6868a0", fontSize: 14 }}>Status:</Typography>
                    <Typography sx={{ color: aiStatus.includes("Processing") ? "#a78bfa" : "#a9a5ff", fontSize: 14 }}>
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
                    onChange={(event) => setCropPresetId(event.target.value as typeof cropPresetId)}
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
                  <Typography sx={{ color: "#52527a", fontSize: 11, lineHeight: 1.55 }}>
                    Crop is previewed in the browser by clipping the workspace image.
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
                  <TextField
                    value={textOverlay.text}
                    onChange={(event) => setTextOverlay((current) => ({ ...current, text: event.target.value }))}
                    placeholder="Overlay text"
                    inputProps={{ "aria-label": "Text overlay content" }}
                    size="small"
                    fullWidth
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "rgba(0,0,0,0.3)",
                        borderRadius: 1.5,
                        color: "#e4e4f2",
                        fontSize: 13,
                        "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                      },
                    }}
                  />
                  <TextField
                    value={textOverlay.color}
                    onChange={(event) => setTextOverlay((current) => ({ ...current, color: event.target.value }))}
                    type="color"
                    inputProps={{ "aria-label": "Text overlay color" }}
                    size="small"
                    fullWidth
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "rgba(0,0,0,0.3)",
                        borderRadius: 1.5,
                        "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                      },
                    }}
                  />
                  <AdjSlider
                    label="Text Size"
                    value={textOverlay.size}
                    onChange={(value) => setTextOverlay((current) => ({ ...current, size: value }))}
                    min={12}
                    max={72}
                  />
                  <AdjSlider
                    label="Text X"
                    value={textOverlay.x}
                    onChange={(value) => setTextOverlay((current) => ({ ...current, x: value }))}
                    min={0}
                    max={100}
                  />
                  <AdjSlider
                    label="Text Y"
                    value={textOverlay.y}
                    onChange={(value) => setTextOverlay((current) => ({ ...current, y: value }))}
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
                  <MenuItem value="none">Select Saved Preset...</MenuItem>
                  <MenuItem value="portrait">My Portrait Style</MenuItem>
                  <MenuItem value="night">Night Cityscape</MenuItem>
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
              onClick={resetManualEdits}
              sx={{
                py: 1,
                color: "#38385a",
                border: "1px solid rgba(255,255,255,0.05)",
                bgcolor: "rgba(255,255,255,0.03)",
                fontSize: 11,
                letterSpacing: "0.08em",
                "&:hover": { color: "#6868a0", bgcolor: "rgba(255,255,255,0.06)" },
              }}
            >
              Reset Manual Edits
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
