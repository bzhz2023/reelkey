"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFalKey } from "@/hooks/use-fal-key";
import {
  Activity,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { falKeyStorage } from "@/lib/fal-key";

export function FalKeyManager() {
  const t = useTranslations("dashboard.settings.falKey");
  const { status, maskedKey, saveKey, removeKey } = useFalKey();
  const [inputKey, setInputKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showFullKey, setShowFullKey] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const isValidating = status === "validating";
  const hasStoredKey = status === "valid" && maskedKey;

  useEffect(() => {
    if (status === "invalid") {
      setError(t("errorInvalid"));
    }
  }, [status, t]);

  const handleSave = async () => {
    if (!inputKey.trim()) {
      setError(t("errorEmpty"));
      return;
    }

    setError("");
    const success = await saveKey(inputKey);

    if (success) {
      setInputKey("");
      setShowKey(false);
    } else {
      setError(t("errorInvalid"));
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
    if (hasStoredKey) {
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    }
    return <Key className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              {t("cardTitle")}
            </CardTitle>
            <CardDescription className="max-w-2xl">
              {t("cardDescription")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        {hasStoredKey && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 transition-colors">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-background">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold">{t("connected")}</div>
                  <p className="text-sm text-muted-foreground">
                    {t("connectedDesc")}
                  </p>
                </div>
              </div>

              <code className="w-fit rounded-md border bg-background px-3 py-1.5 font-mono text-xs text-foreground">
                {maskedKey}
              </code>
            </div>

            {showFullKey && (
              <div className="mt-4 flex min-w-0 flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all font-mono text-xs">
                  {falKeyStorage.get()}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyFullKey}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {t("copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      {t("copy")}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {hasStoredKey && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullKey(!showFullKey)}
            >
              {showFullKey ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  {t("hideKey")}
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("revealKey")}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("removeKey")}
            </Button>
          </div>
        )}

        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="fal-key">
                {hasStoredKey ? t("replaceLabel") : t("addLabel")}
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("saveHint")}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Input
                id="fal-key"
                type={showKey ? "text" : "password"}
                placeholder={t("placeholder")}
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  if (error) setError("");
                }}
                disabled={isValidating}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={isValidating || !inputKey.trim()}
              className="sm:min-w-[132px]"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("verifying")}
                </>
              ) : (
                t("verifyAndSave")
              )}
            </Button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <LockKeyhole className="h-4 w-4 text-sky-600" />
              {t("localStorage")}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("localStorageDesc")}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4 text-sky-600" />
              {t("realValidation")}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("realValidationDesc")}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {t("directBilling")}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("directBillingDesc")}
            </p>
          </div>
        </div>

        <Alert>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm">{t("needKey")}</span>
            <Button
              variant="link"
              className="h-auto w-fit p-0 text-sm"
              asChild
            >
              <a
                href="https://fal.ai/dashboard/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("openDashboard")}
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
