/**
 * Overlay Cleaner - Removes stuck dialog overlays
 * Call this when navigating or when overlays get stuck
 */

export function cleanDialogOverlays() {
  // Remove all closed dialog overlays
  document.querySelectorAll('[data-radix-dialog-overlay][data-state="closed"]').forEach(el => {
    el.remove();
  });

  // Remove any orphaned dialog content
  document.querySelectorAll('[data-radix-dialog-content][data-state="closed"]').forEach(el => {
    el.remove();
  });

  // Ensure body is clickable
  document.body.style.pointerEvents = 'auto';
  document.body.style.userSelect = 'auto';

  // Clean up any leftover portal containers
  document.querySelectorAll('[data-radix-portal]').forEach(portal => {
    const hasOpenDialog = portal.querySelector('[data-state="open"]');
    if (!hasOpenDialog) {
      portal.remove();
    }
  });
}

// Run on mount and periodically as a fallback
export function useOverlayCleaner() {
  if (typeof window === 'undefined') return;

  // Initial cleanup
  cleanDialogOverlays();

  // Clean up on route change
  window.addEventListener('popstate', cleanDialogOverlays);

  // Clean up periodically (every 5 seconds) as a safety net
  const interval = setInterval(cleanDialogOverlays, 5000);

  return () => {
    window.removeEventListener('popstate', cleanDialogOverlays);
    clearInterval(interval);
    cleanDialogOverlays();
  };
}
