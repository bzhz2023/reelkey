"use client";

import { useState } from "react";
import { useFalKey } from "@/hooks/use-fal-key";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Key, Loader2 } from "lucide-react";

interface FalKeySetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function FalKeySetupDialog({
  open,
  onOpenChange,
  onSuccess,
}: FalKeySetupDialogProps) {
  const { saveKey, status } = useFalKey();
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isValidating = status === "validating";

  const handleSave = async () => {
    if (!keyInput.trim()) {
      setError("Please enter your fal.ai API key");
      return;
    }

    setError(null);
    const success = await saveKey(keyInput.trim());

    if (success) {
      setKeyInput("");
      onSuccess?.();
      onOpenChange(false);
    } else {
      setError("Invalid API key. Please check and try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Connect Your fal.ai API Key
          </DialogTitle>
          <DialogDescription>
            ReelKey uses your own fal.ai API key. Your key is stored locally in
            your browser and is only sent when validating the key or starting a generation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fal-key">fal.ai API Key</Label>
            <Input
              id="fal-key"
              type="password"
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              disabled={isValidating}
            />
            <p className="text-sm text-muted-foreground">
              Don't have a key?{" "}
              <a
                href="https://fal.ai/dashboard/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Get one from fal.ai
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Privacy guarantee:</strong> Your API key is stored only
              in your browser's local storage. It is never stored on our
              servers or in any database.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isValidating}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isValidating}>
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              "Save Key"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
