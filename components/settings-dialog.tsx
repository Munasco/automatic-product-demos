"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { googleApiKeyAtom } from "@/stores/atoms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Key, X } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [googleApiKey, setGoogleApiKey] = useAtom(googleApiKeyAtom);
  const [tempApiKey, setTempApiKey] = useState(googleApiKey);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = () => {
    setGoogleApiKey(tempApiKey);
    onOpenChange(false);
  };

  const handleClear = () => {
    setTempApiKey("");
    setGoogleApiKey("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your API keys to use different models
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Key className="size-4" />
                  Google API Key
                </h3>
                <p className="text-xs text-foreground-muted mt-1">
                  Required to use Gemini 3 Flash model
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  placeholder="Enter your Google API key"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="pr-20"
                />
                {tempApiKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                    onClick={handleClear}
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? "Hide" : "Show"} API key
              </Button>

              <div className="text-xs text-foreground-muted space-y-1 pt-2">
                <p>Get your API key from:</p>
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline block"
                >
                  Google AI Studio →
                </a>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
