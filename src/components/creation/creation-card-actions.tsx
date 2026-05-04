"use client";

import { useState } from "react";
import { Download, MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CreationCardActionsProps {
  isCompleted: boolean;
  onDelete?: () => Promise<void> | void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl?: string | null;
  videoUuid: string;
}

export function CreationCardActions({
  isCompleted,
  onDelete,
  open,
  onOpenChange,
  videoUrl,
  videoUuid,
}: CreationCardActionsProps) {
  const t = useTranslations("dashboard.myCreations");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDownload = () => {
    if (!videoUrl) return;
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = `reelkey-${videoUuid}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t("actions.downloadSuccess"));
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    await onDelete?.();
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isCompleted ? (
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                handleDownload();
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              {t("actions.download")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              setShowDeleteDialog(true);
            }}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm.message")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteConfirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("deleteConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
