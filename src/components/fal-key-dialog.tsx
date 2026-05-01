"use client";

import { useState, useEffect } from "react";
import { Key, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "reelkey_fal_api_key";
const DIALOG_SHOWN_KEY = "reelkey_fal_dialog_shown";

interface FalKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeySubmit: (key: string) => void;
}

export function FalKeyDialog({ open, onOpenChange, onKeySubmit }: FalKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && typeof window !== "undefined") {
      const existingKey = localStorage.getItem(STORAGE_KEY);
      if (existingKey) {
        setApiKey(existingKey);
      }
    }
  }, [open]);

  const handleSubmit = () => {
    if (!apiKey.trim()) return;

    setIsLoading(true);

    // 保存到 localStorage
    localStorage.setItem(STORAGE_KEY, apiKey.trim());
    localStorage.setItem(DIALOG_SHOWN_KEY, "true");

    // 通知父组件
    onKeySubmit(apiKey.trim());

    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Enter Your fal.ai API Key
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p>
              ReelKey uses your own fal.ai API key to generate videos. Your key stays in your browser only and is never stored on our servers.
            </p>
            <a
              href="https://fal.ai/dashboard/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Get your API key from fal.ai
              <ExternalLink className="h-3 w-3" />
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fal-key">fal.ai API Key</Label>
            <Input
              id="fal-key"
              type="password"
              placeholder="fal_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
            />
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium mb-1">🔒 Privacy First</p>
            <p className="text-muted-foreground">
              Your API key is stored locally in your browser and sent directly to fal.ai. We never see or store your key on our servers.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!apiKey.trim() || isLoading}
          >
            {isLoading ? "Saving..." : "Save & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if user has API key
export function useFalKey() {
  const [hasKey, setHasKey] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = localStorage.getItem(STORAGE_KEY);
      setHasKey(!!key);
    }
  }, []);

  const checkAndPrompt = (): boolean => {
    if (typeof window === "undefined") return false;

    const key = localStorage.getItem(STORAGE_KEY);
    if (key) {
      return true;
    }

    setShowDialog(true);
    return false;
  };

  const getKey = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  };

  return {
    hasKey,
    showDialog,
    setShowDialog,
    checkAndPrompt,
    getKey,
  };
}
