"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ByokLifetimePricing } from "@/components/price/byok-lifetime-pricing";

interface ByokLifetimePricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasLifetimeEntitlement?: boolean;
  userId?: string;
}

export function ByokLifetimePricingModal({
  open,
  onOpenChange,
  hasLifetimeEntitlement = false,
  userId,
}: ByokLifetimePricingModalProps) {
  const t = useTranslations("ByokPricing");

  useEffect(() => {
    if (open) return;

    const releasePointerLock = window.setTimeout(() => {
      if (!document.querySelector('[role="dialog"]')) {
        document.body.style.pointerEvents = "";
      }
    }, 120);

    return () => window.clearTimeout(releasePointerLock);
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="!p-0 max-h-[90vh] overflow-hidden"
        style={{
          maxWidth: "980px",
          width: "calc(100vw - 32px)",
        }}
      >
        <button
          className="absolute right-4 top-4 z-50 rounded-sm bg-background opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={() => handleOpenChange(false)}
          type="button"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="border-b px-5 pb-4 pt-6 sm:px-6">
          <DialogTitle className="text-xl font-semibold sm:text-2xl">
            {t("modalTitle")}
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {t("modalDescription")}
          </DialogDescription>
        </div>

        <div className="max-h-[calc(90vh-118px)] overflow-y-auto px-5 py-5 sm:px-6">
          <ByokLifetimePricing
            hasLifetimeEntitlement={hasLifetimeEntitlement}
            showHeader={false}
            userId={userId}
            variant="modal"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
