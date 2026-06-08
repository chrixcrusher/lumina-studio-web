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
import { useMemo, useState } from "react";
import { APP_ROUTES } from "@/shared/constants/routes";

interface Adjustments {
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

const DEFAULT_ADJUSTMENTS: Adjustments = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  saturation: 0,
  vibrance: 0,
  warmth: 0,
};

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
  { id: "bw", name: "Black & White", adj: { contrast: 18, saturation: -100 } },
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

function buildCSSFilter(adjustments: Adjustments, preset: FilterPreset, showOriginal: boolean) {
  if (showOriginal) return "none";
  const merged = { ...adjustments, ...preset.adj };
  const brightness = Math.max(0.15, 1 + merged.exposure * 0.006);
  const contrast = Math.max(0.15, 1 + merged.contrast * 0.007);
  const saturate = Math.max(0, 1 + merged.saturation / 100);
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
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon?: ReactNode;
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
        min={-100}
        max={100}
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
  const [activePhoto, setActivePhoto] = useState(PHOTOS[0]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState("crop");
  const [selectedPreset, setSelectedPreset] = useState(FILTER_PRESETS[0]);
  const [adjustments, setAdjustments] = useState<Adjustments>({ ...DEFAULT_ADJUSTMENTS });
  const [showOriginal, setShowOriginal] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [hfToken, setHfToken] = useState("");
  const [aiStatus, setAiStatus] = useState("Ready");
  const [expanded, setExpanded] = useState({
    ai: true,
    light: false,
    color: false,
    presets: false,
  });

  const imageUrl = uploadedImage ?? activePhoto.url;
  const imageAlt = uploadedImage ? "Uploaded workspace image" : activePhoto.alt;
  const cssFilter = useMemo(
    () => buildCSSFilter(adjustments, selectedPreset, showOriginal),
    [adjustments, selectedPreset, showOriginal],
  );

  const updateAdj = (key: keyof Adjustments, value: number) => {
    setAdjustments((current) => ({ ...current, [key]: value }));
    setSelectedPreset(FILTER_PRESETS[0]);
  };

  const toggleSection = (key: keyof typeof expanded) => {
    setExpanded((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploadedImage(URL.createObjectURL(file));
  };

  const handleAiRestore = () => {
    setAiStatus("Processing...");
    window.setTimeout(() => setAiStatus(hfToken.trim() ? "Restoration Complete" : "Token Required"), 650);
    window.setTimeout(() => setAiStatus("Ready"), 3000);
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
              }}
              sx={{
                width: 60,
                height: 40,
                p: 0,
                border: 0,
                borderRadius: 1,
                overflow: "hidden",
                outline: activePhoto.id === photo.id && !uploadedImage ? "2px solid #7c66ff" : "2px solid rgba(255,255,255,0.08)",
                outlineOffset: 1,
                opacity: activePhoto.id === photo.id && !uploadedImage ? 1 : 0.58,
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
            <input hidden type="file" accept="image/*" onChange={handleUpload} />
          </Button>
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
            sx={{
              color: "#fff",
              background: "linear-gradient(135deg, #7c66ff, #9333ea)",
              boxShadow: "0 0 22px rgba(124,102,255,0.35)",
              px: 2.3,
            }}
          >
            Export
          </Button>
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
                component="img"
                src={imageUrl}
                alt={imageAlt}
                sx={{
                  display: "block",
                  maxHeight: "calc(100vh - 255px)",
                  maxWidth: "100%",
                  objectFit: "contain",
                  filter: cssFilter,
                  transition: "filter 0.08s linear",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
                }}
              />
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
                  aria-label={preset.name === "Black & White" ? "Black and White" : preset.name}
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
                      src={thumbUrl(imageUrl, 164, 112)}
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

            <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <SectionHeader label="Light Controls" expanded={expanded.light} onClick={() => toggleSection("light")} />
            </Box>
            {expanded.light && (
              <Stack spacing={3} sx={{ pt: 2, pb: 3 }}>
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
              onClick={() => {
                setAdjustments({ ...DEFAULT_ADJUSTMENTS });
                setSelectedPreset(FILTER_PRESETS[0]);
              }}
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
              Reset All Adjustments
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
