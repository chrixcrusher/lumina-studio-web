"use client";

import type { ReactNode } from "react";

export function MobileViewportGate({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mobile-viewport-gate">This tool is not available on mobile devices. Please use a tablet or desktop</div>
      <div className="desktop-tablet-viewport">{children}</div>
    </>
  );
}
