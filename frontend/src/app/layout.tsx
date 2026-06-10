import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: "LuminaStudio Web",
  description: "Browser-first photo editing with user-provided Hugging Face AI restore.",
  icons: {
    icon: "/ls-logo.png",
    shortcut: "/ls-logo.png",
    apple: "/ls-logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
