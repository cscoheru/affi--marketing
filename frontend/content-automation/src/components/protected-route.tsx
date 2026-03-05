/**
 * Protected Route Wrapper
 * Redirects to login page if user is not authenticated
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authenticated, loading } = useAuthContext();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const cleanupDone = useRef(false);

  useEffect(() => {
    // Clean up any stuck dialog overlays
    if (!cleanupDone.current) {
      const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
      overlays.forEach(overlay => {
        overlay.remove();
      });
      cleanupDone.current = true;
    }

    // Only start checking after initial auth state is loaded
    if (!loading) {
      setIsReady(true);
      if (!authenticated) {
        router.replace("/login");
      }
    }
  }, [authenticated, loading, router]);

  // Show loading during initial auth check
  if (loading || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render anything if redirecting to login
  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
