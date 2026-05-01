"use client";

import { useEffect, useState } from "react";
import { useFalKey } from "./use-fal-key";

/**
 * Hook to manage the fal.ai key setup prompt
 * Shows dialog if user doesn't have a key saved
 */
export function useFalKeyPrompt() {
  const { status } = useFalKey();
  const [showDialog, setShowDialog] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check once on mount
    if (hasChecked) return;

    // Wait a bit for the status to be determined
    const timer = setTimeout(() => {
      if (status === "missing") {
        setShowDialog(true);
      }
      setHasChecked(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [status, hasChecked]);

  return {
    showDialog,
    setShowDialog,
  };
}
