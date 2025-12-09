"use client";

import { useRef, KeyboardEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ModelType, AVAILABLE_MODELS } from "@/stores/atoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Plus,
  Globe,
  Sparkles,
  AtSign,
  ArrowUp,
  Square,
  Code,
  MessageSquare,
  ChevronDown,
  Zap,
  Brain,
  Cpu,
  X,
  FileText,
} from "lucide-react";

export interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  selectedModel?: ModelType;
  onModelChange?: (modelId: ModelType) => void;
  onToggleCanvas?: () => void;
  onToggleComments?: () => void;
  canvasOpen?: boolean;
  commentsOpen?: boolean;
  files?: AttachedFile[];
  onFilesChange?: (files: AttachedFile[]) => void;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading = false,
  placeholder = "Ask anything",
  selectedModel = "gpt-5.1",
  onModelChange,
  onToggleCanvas,
  onToggleComments,
  canvasOpen = false,
  commentsOpen = false,
  files = [],
  onFilesChange,
}: ChatInputProps) {
  const currentModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getModelIcon = (iconType: "zap" | "brain" | "cpu") => {
    switch (iconType) {
      case "zap":
        return <Zap className="size-3" />;
      case "brain":
        return <Brain className="size-3" />;
      case "cpu":
        return <Cpu className="size-3" />;
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: AttachedFile[] = selectedFiles.map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));
    onFilesChange?.([...files, ...newFiles]);
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file?.preview) URL.revokeObjectURL(file.preview);
    onFilesChange?.(files.filter((f) => f.id !== id));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-4">
      <div className="relative bg-background-secondary rounded-2xl border border-border-input">
        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.md,.json,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* File previews */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-3">
            {files.map((f) => (
              <div key={f.id} className="relative group">
                {f.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.preview}
                    alt={f.file.name}
                    className="h-16 w-16 object-cover rounded-lg border border-border"
                  />
                ) : (
                  <div className="h-16 w-16 flex flex-col items-center justify-center bg-background-tertiary rounded-lg border border-border">
                    <FileText className="size-5 text-foreground-muted" />
                    <span className="text-[10px] text-foreground-muted mt-1 truncate max-w-14 px-1">
                      {f.file.name.split(".").pop()}
                    </span>
                  </div>
                )}
                <Button
                  onClick={() => removeFile(f.id)}
                  className="absolute -top-1 -right-1 size-5 bg-background rounded-full border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={cn(
            "w-full resize-none bg-transparent px-4 pt-4 pb-12 text-base text-foreground placeholder:text-foreground-placeholder focus:outline-none",
            "min-h-[56px] max-h-[200px]",
            files.length > 0 && "pt-2"
          )}
        />

        {/* Bottom toolbar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-background-secondary z-10">
          {/* Left side tools */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-8",
                    files.length > 0
                      ? "text-accent"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach files</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-foreground-muted hover:text-foreground"
                >
                  <Globe className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search web</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-foreground-muted hover:text-foreground"
                >
                  <Sparkles className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Enhance</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-foreground-muted hover:text-foreground"
                >
                  <AtSign className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mention</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-6 px-2 text-xs text-foreground-muted hover:text-foreground gap-1"
                >
                  {getModelIcon(currentModel.icon)}
                  {currentModel.name}
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {AVAILABLE_MODELS.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => onModelChange?.(model.id)}
                    className={cn(
                      "flex items-start gap-3 py-2",
                      model.id === selectedModel && "bg-background-hover"
                    )}
                  >
                    <div className="mt-0.5">{getModelIcon(model.icon)}</div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-foreground-muted">
                        {model.description}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side - Canvas/Comments/Send/Stop */}
          <div className="flex items-center gap-1">
            {onToggleCanvas && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-8",
                      canvasOpen
                        ? "text-accent"
                        : "text-foreground-muted hover:text-foreground"
                    )}
                    onClick={onToggleCanvas}
                  >
                    <Code className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Canvas</TooltipContent>
              </Tooltip>
            )}

            {onToggleComments && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-8",
                      commentsOpen
                        ? "text-accent"
                        : "text-foreground-muted hover:text-foreground"
                    )}
                    onClick={onToggleComments}
                  >
                    <MessageSquare className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Comments</TooltipContent>
              </Tooltip>
            )}

            {isLoading ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 bg-foreground text-background rounded-full hover:bg-foreground/90"
                onClick={onStop}
              >
                <Square className="size-4 fill-current" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "size-8 rounded-full transition-colors",
                  value.trim()
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-background-tertiary text-foreground-muted"
                )}
                onClick={onSubmit}
                disabled={!value.trim()}
              >
                <ArrowUp className="size-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
