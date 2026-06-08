"use client";

import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import DownloadIcon from "@mui/icons-material/Download";
import PhotoFilterIcon from "@mui/icons-material/PhotoFilter";
import SecurityIcon from "@mui/icons-material/Security";
import TuneIcon from "@mui/icons-material/Tune";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/GridLegacy";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/shared/components/AppHeader";
import { APP_ROUTES } from "@/shared/constants/routes";

const previewImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1400&h=1000&fit=crop&auto=format";

const featureHighlights = [
  {
    icon: <TuneIcon />,
    title: "Browser editing",
    body: "Brightness, contrast, exposure, highlights, shadows, saturation, crop, rotate, flip, and text overlay stay client-side.",
  },
  {
    icon: <PhotoFilterIcon />,
    title: "Filter gallery",
    body: "Apply Vivid, Black and White, Vintage, Warm, and Cool presets without backend image processing.",
  },
  {
    icon: <CloudQueueIcon />,
    title: "User-token AI restore",
    body: "AI face restoration routes through the backend proxy using a Hugging Face token supplied by the user.",
  },
  {
    icon: <SecurityIcon />,
    title: "Metadata-only history",
    body: "History records operations and settings by default, not permanent image files.",
  },
];

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.22 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      className={`scroll-reveal ${visible ? "is-visible" : ""}`}
      sx={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Box>
  );
}

function FilterStrip() {
  return (
    <Paper
      square
      sx={{
        p: { xs: 1.25, md: 2 },
        bgcolor: "rgba(8,8,14,0.78)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Grid container spacing={1.25}>
        {["Vivid", "Black and White", "Vintage", "Warm", "Cool"].map((filter) => (
          <Grid item xs key={filter}>
            <Box
              sx={{
                minHeight: { xs: 42, md: 52 },
                px: 1,
                display: "grid",
                placeItems: "center",
                border: "1px solid",
                borderColor: filter === "Vivid" ? "#7c66ff" : "rgba(255,255,255,0.08)",
                borderRadius: 2,
                color: filter === "Vivid" ? "#a78bfa" : "#c8c8e4",
                fontSize: { xs: 12, md: 14 },
                bgcolor: filter === "Vivid" ? "rgba(124,102,255,0.12)" : "rgba(255,255,255,0.025)",
              }}
            >
              {filter}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

function WorkspacePreview() {
  return (
    <Paper
      sx={{
        p: 1.5,
        border: "1px solid rgba(255,255,255,0.08)",
        bgcolor: "#111118",
        boxShadow: "0 32px 100px rgba(0,0,0,0.52)",
      }}
    >
      <Box
        sx={{
          minHeight: { xs: 320, md: 500 },
          borderRadius: 1.25,
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "1fr auto",
          backgroundImage: `linear-gradient(rgba(8,8,14,0.12), rgba(8,8,14,0.52)), url(${previewImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ p: 2, alignSelf: "start" }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<AutoFixHighIcon />}
            sx={{
              color: "#ffffff",
              background: "linear-gradient(135deg, #7c66ff, #9333ea)",
              boxShadow: "0 0 24px rgba(124,102,255,0.3)",
            }}
          >
            AI Restore
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ color: "#a78bfa", borderColor: "rgba(167,139,250,0.42)" }}
          >
            Export
          </Button>
        </Stack>
        <FilterStrip />
      </Box>
    </Paper>
  );
}

export function LandingPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#08080e", color: "#e4e4f2" }}>
      <AppHeader />

      <Box
        component="main"
        sx={{
          minHeight: { xs: "calc(100vh - 72px)", md: "calc(100vh - 90px)" },
          display: "grid",
          placeItems: "center",
          px: 2,
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 50% 52%, rgba(124,102,255,0.22), rgba(192,38,211,0.08) 28%, transparent 56%)",
            filter: "blur(4px)",
          }}
        />

        <Reveal>
          <Stack
            spacing={{ xs: 3, md: 4 }}
            alignItems="center"
            sx={{
              position: "relative",
              zIndex: 1,
              maxWidth: 920,
              mx: "auto",
              textAlign: "center",
              py: { xs: 7, md: 9 },
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                px: 2,
                py: 0.9,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.1)",
                bgcolor: "rgba(255,255,255,0.045)",
                color: "#a78bfa",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <AutoFixHighIcon sx={{ fontSize: 16 }} />
              <span>Powered by CodeFormer AI</span>
            </Stack>

            <Typography
              component="h1"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: { xs: 52, sm: 72, md: 98 },
                lineHeight: 1.06,
                fontWeight: 700,
                color: "#e4e4f2",
              }}
            >
              Professional photo
              <Box component="span" sx={{ display: "block" }}>
                enhancement
              </Box>
            </Typography>

            <Typography
              sx={{
                maxWidth: 720,
                color: "#9b9bd4",
                fontSize: { xs: 19, md: 24 },
                lineHeight: 1.45,
                fontWeight: 300,
              }}
            >
              Advanced AI-driven photo enhancement, custom filter presets, and precise color
              grading in your browser.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component={Link}
                href={APP_ROUTES.register}
                size="large"
                variant="contained"
                sx={{
                  minWidth: 220,
                  py: 1.65,
                  color: "#ffffff",
                  background: "linear-gradient(135deg, #7c66ff, #9333ea)",
                  boxShadow: "0 0 30px rgba(124,102,255,0.34)",
                }}
              >
                Create Account
              </Button>
              <Button
                component={Link}
                href={APP_ROUTES.editor}
                size="large"
                variant="outlined"
                sx={{
                  minWidth: 200,
                  py: 1.65,
                  color: "#ffffff",
                  borderColor: "rgba(255,255,255,0.12)",
                  bgcolor: "rgba(255,255,255,0.045)",
                }}
              >
                Enhance Now
              </Button>
            </Stack>
          </Stack>
        </Reveal>
      </Box>

      <Box
        component="section"
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          py: { xs: 8, md: 10 },
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 5, md: 7 }} alignItems="center">
            <Grid item xs={12} md={5}>
              <Reveal>
                <Stack spacing={3}>
                  <Typography
                    variant="overline"
                    sx={{ color: "#f59e0b", fontWeight: 800, fontSize: 14 }}
                  >
                    Browser-first photo enhancement
                  </Typography>
                  <Typography
                    variant="h2"
                    sx={{
                      fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
                      fontSize: { xs: 46, md: 72 },
                      lineHeight: 1,
                      fontWeight: 800,
                    }}
                  >
                    LuminaStudio Web
                  </Typography>
                  <Typography sx={{ color: "#c8c8e4", fontSize: { xs: 20, md: 27 }, lineHeight: 1.38 }}>
                    Edit, filter, restore faces with CodeFormer, and export images from a web
                    workspace designed for free-tier-friendly deployment.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Button
                      component={Link}
                      href={APP_ROUTES.editor}
                      size="large"
                      variant="contained"
                      startIcon={<UploadFileIcon />}
                      sx={{ minWidth: 188, py: 1.4 }}
                    >
                      Enhance Now
                    </Button>
                    <Button
                      component={Link}
                      href={APP_ROUTES.register}
                      size="large"
                      variant="outlined"
                      sx={{ minWidth: 188, py: 1.4, color: "#ffffff" }}
                    >
                      Create Account
                    </Button>
                  </Stack>
                </Stack>
              </Reveal>
            </Grid>
            <Grid item xs={12} md={7}>
              <Reveal delay={120}>
                <WorkspacePreview />
              </Reveal>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", py: 8 }}>
        <Container maxWidth="xl">
          <Reveal>
            <Stack spacing={4}>
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
                    fontSize: { xs: 38, md: 54 },
                    fontWeight: 500,
                    mb: 1,
                  }}
                >
                  MVP workspace, without hidden server costs
                </Typography>
                <Typography color="#c8c8e4" sx={{ maxWidth: 920, fontSize: { xs: 18, md: 22 }, lineHeight: 1.45 }}>
                  Manual image work stays in the browser. The backend handles auth, encrypted token
                  storage, presets, metadata history, and the Hugging Face restore proxy.
                </Typography>
              </Box>
              <Grid container spacing={2.5}>
                {featureHighlights.map((feature, index) => (
                  <Grid item xs={12} md={3} key={feature.title}>
                    <Reveal delay={index * 90}>
                      <Paper
                        sx={{
                          p: 3.25,
                          height: "100%",
                          minHeight: 264,
                          border: "1px solid rgba(255,255,255,0.08)",
                          bgcolor: "#111118",
                          color: "#e4e4f2",
                          transition: "transform 180ms ease, border-color 180ms ease",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            borderColor: "rgba(124,102,255,0.45)",
                          },
                        }}
                      >
                        <Stack spacing={2.5}>
                          <Box sx={{ color: "#a78bfa", display: "flex" }}>{feature.icon}</Box>
                          <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {feature.title}
                          </Typography>
                          <Typography sx={{ color: "#c8c8e4", lineHeight: 1.45 }}>
                            {feature.body}
                          </Typography>
                        </Stack>
                      </Paper>
                    </Reveal>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Reveal>
        </Container>
      </Box>
    </Box>
  );
}
