"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFalKey } from "@/hooks/use-fal-key";
import { ExternalLink, Eye, EyeOff, Loader2, CheckCircle2, XCircle, Key, Copy } from "lucide-react";
import { falKeyStorage } from "@/lib/fal-key";

export function FalKeyManager() {
  const { status, maskedKey, saveKey, removeKey } = useFalKey();
  const [inputKey, setInputKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showFullKey, setShowFullKey] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    if (!inputKey.trim()) {
      setError("Please enter your fal.ai API key");
      return;
    }

    setError("");
    const success = await saveKey(inputKey);

    if (success) {
      setInputKey("");
      setShowKey(false);
    } else {
      setError("Invalid API key. Please check and try again.");
    }
  };

  const handleRemove = () => {
    removeKey();
    setInputKey("");
    setError("");
    setShowFullKey(false);
  };

  const handleCopyFullKey = () => {
    const fullKey = falKeyStorage.get();
    if (fullKey) {
      navigator.clipboard.writeText(fullKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "valid":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "invalid":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "validating":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Key className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "valid":
        return "Connected";
      case "invalid":
        return "Invalid key";
      case "validating":
        return "Validating...";
      default:
        return "Not configured";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          fal.ai API Key
        </CardTitle>
        <CardDescription>
          Manage your fal.ai API key for video generation. Your key is stored locally in your browser and never sent to our servers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前状态 */}
        {status !== "missing" && (
          <Alert>
            <AlertDescription className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <span className={status === "valid" ? "text-green-600" : "text-red-600"}>
                    {getStatusText()}
                  </span>
                </div>
                {maskedKey && (
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {maskedKey}
                  </code>
                )}
              </div>

              {/* 显示完整 Key */}
              {showFullKey && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted px-3 py-2 rounded break-all select-all">
                      {falKeyStorage.get()}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyFullKey}
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullKey(!showFullKey)}
              >
                {showFullKey ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Full Key
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Full Key
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 输入区域 */}
        <div className="space-y-2">
          <Label htmlFor="fal-key">API Key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="fal-key"
                type={showKey ? "text" : "password"}
                placeholder="sk-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                disabled={status === "validating"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={status === "validating" || !inputKey.trim()}
            >
              {status === "validating" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* 操作按钮 */}
        {status !== "missing" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemove}
            >
              Remove Key
            </Button>
          </div>
        )}

        {/* 帮助信息 */}
        <Alert>
          <AlertDescription className="space-y-2">
            <p className="text-sm">
              Don't have a fal.ai API key yet?
            </p>
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              asChild
            >
              <a
                href="https://fal.ai/dashboard/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get your API key from fal.ai
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </AlertDescription>
        </Alert>

        {/* 安全说明 */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>🔒 Your API key is stored locally in your browser</p>
          <p>🚫 We never store your key on our servers</p>
          <p>✅ Your key is only sent directly to fal.ai for video generation</p>
        </div>
      </CardContent>
    </Card>
  );
}
