"use client";

import HistoryIcon from "@mui/icons-material/History";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SettingsIcon from "@mui/icons-material/Settings";
import TuneIcon from "@mui/icons-material/Tune";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { APP_ROUTES } from "@/shared/constants/routes";

interface AppHeaderProps {
  compact?: boolean;
}

export function AppHeader({ compact = false }: AppHeaderProps) {
  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "rgba(8,8,14,0.92)",
        backdropFilter: "blur(16px)",
      }}
    >
      <Toolbar sx={{ minHeight: compact ? 58 : 90, gap: 2, px: { xs: 2, md: 4.5 } }}>
        <Button
          component={Link}
          href={APP_ROUTES.landing}
          color="inherit"
          sx={{ px: 0, color: "text.primary", "&:hover": { bgcolor: "transparent" } }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              component="img"
              src="/ls-logo.png"
              alt=""
              sx={{
                width: compact ? 34 : 40,
                height: compact ? 34 : 40,
                borderRadius: 2,
                display: "block",
                objectFit: "cover",
                boxShadow: "0 0 18px rgba(124,102,255,0.46)",
              }}
            />
            <Stack direction="row" spacing={0.6} alignItems="baseline">
              <Typography
                sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: compact ? 20 : 24,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                Lumina
              </Typography>
              <Typography
                sx={{
                  color: "#6868a0",
                  fontSize: 11,
                  lineHeight: 1,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Studio
              </Typography>
            </Stack>
          </Stack>
        </Button>

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" } }}>
          <Button component={Link} href={APP_ROUTES.editor} startIcon={<TuneIcon />} color="inherit">
            Editor
          </Button>
          <Button component={Link} href={APP_ROUTES.history} startIcon={<HistoryIcon />} color="inherit">
            History
          </Button>
          <Button component={Link} href={APP_ROUTES.settings} startIcon={<SettingsIcon />} color="inherit">
            Settings
          </Button>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            href={APP_ROUTES.login}
            startIcon={<LoginIcon />}
            color="inherit"
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              color: "#a9a5ff",
              "&:hover": { bgcolor: "rgba(124,102,255,0.08)" },
            }}
          >
            Sign In
          </Button>
          <Button
            component={Link}
            href={APP_ROUTES.register}
            startIcon={<PersonAddIcon />}
            variant="contained"
            color="primary"
            sx={{
              background: compact ? undefined : "rgba(255,255,255,0.055)",
              border: compact ? undefined : "1px solid rgba(255,255,255,0.12)",
              boxShadow: compact ? undefined : "none",
              color: "#ffffff",
              "&:hover": {
                background: compact
                  ? "linear-gradient(135deg, #7c66ff, #9333ea)"
                  : "rgba(255,255,255,0.09)",
              },
            }}
          >
            Create Account
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export function BrandMark() {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box
        component="img"
        src="/ls-logo.png"
        alt=""
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          display: "block",
          objectFit: "cover",
        }}
      />
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        LuminaStudio
      </Typography>
    </Stack>
  );
}
