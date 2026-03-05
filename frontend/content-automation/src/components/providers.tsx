/**
 * Client-side providers for the app
 * Combines all context providers in one place
 */

"use client";

import { useEffect } from "react";
import { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { cleanDialogOverlays } from "@/lib/overlay-cleaner";

export function Providers({ children }: { children: ReactNode }) {
  // Clean up stuck overlays on mount and navigation
  useEffect(() => {
    cleanDialogOverlays();

    // Clean up on route change
    const handleRouteChange = () => cleanDialogOverlays();
    window.addEventListener('popstate', handleRouteChange);

    // Periodic cleanup (safety net)
    const interval = setInterval(cleanDialogOverlays, 10000);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      clearInterval(interval);
      cleanDialogOverlays();
    };
  }, []);

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
