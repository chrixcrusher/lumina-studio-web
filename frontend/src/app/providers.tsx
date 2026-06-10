"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";
import { MobileViewportGate } from "@/shared/components/MobileViewportGate";
import { appTheme } from "@/shared/theme";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <MobileViewportGate>{children}</MobileViewportGate>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
