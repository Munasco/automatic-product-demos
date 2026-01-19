"use client";

import type { ComponentProps, ReactNode } from "react";
import { isValidElement } from "react";
import {
  Wrench,
  ChevronDown,
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/lib/markdown/code-block";

export type ToolState =
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error"
  | "output-denied";

export type ToolPanelProps = ComponentProps<typeof Collapsible>;

export function ToolPanel({ className, ...props }: ToolPanelProps) {
  return (
    <Collapsible
      className={cn("not-prose mb-4 w-full rounded-md border", className)}
      {...props}
    />
  );
}

export type ToolHeaderProps = {
  title?: string;
  toolName: string;
  state: ToolState;
  className?: string;
} & Omit<ComponentProps<typeof CollapsibleTrigger>, "asChild" | "className">;

function getStatusBadge(state: ToolState) {
  const labels: Record<ToolState, string> = {
    "input-streaming": "Pending",
    "input-available": "Running",
    "output-available": "Completed",
    "output-error": "Error",
    "output-denied": "Denied",
  };

  const icons: Record<ToolState, ReactNode> = {
    "input-streaming": <Circle className="size-4" />,
    "input-available": <Clock className="size-4 animate-pulse" />,
    "output-available": <CheckCircle2 className="size-4 text-green-600" />,
    "output-error": <XCircle className="size-4 text-red-600" />,
    "output-denied": <XCircle className="size-4 text-orange-600" />,
  };

  return (
    <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
      {icons[state]}
      {labels[state]}
    </Badge>
  );
}

export function ToolHeader({
  className,
  title,
  toolName,
  state,
  ...props
}: ToolHeaderProps) {
  return (
    <CollapsibleTrigger
      className={cn(
        "group flex w-full items-center justify-between gap-4 p-3",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Wrench className="size-4 text-muted-foreground" />
        <span className="font-medium text-sm">{title ?? toolName}</span>
        {getStatusBadge(state)}
      </div>
      <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
  );
}

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export function ToolContent({ className, ...props }: ToolContentProps) {
  return (
    <CollapsibleContent
      className={cn(
        "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
        className
      )}
      {...props}
    />
  );
}

export type ToolInputProps = ComponentProps<"div"> & {
  input: unknown;
};

export function ToolInput({ className, input, ...props }: ToolInputProps) {
  return (
    <div className={cn("space-y-2 overflow-hidden p-4", className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Parameters
      </h4>
      <div className="rounded-md bg-muted/50">
        <CodeBlock code={JSON.stringify(input ?? {}, null, 2)} lang="json" />
      </div>
    </div>
  );
}

export type ToolOutputProps = ComponentProps<"div"> & {
  output: unknown;
  errorText?: string | null;
};

export function ToolOutput({
  className,
  output,
  errorText,
  ...props
}: ToolOutputProps) {
  if (!(output || errorText)) return null;

  let Output: ReactNode = <div>{output as ReactNode}</div>;

  if (
    typeof output === "object" &&
    output !== null &&
    !isValidElement(output)
  ) {
    Output = <CodeBlock code={JSON.stringify(output, null, 2)} lang="json" />;
  } else if (typeof output === "string") {
    Output = <CodeBlock code={output} lang="json" />;
  }

  return (
    <div className={cn("space-y-2 p-4", className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {errorText ? "Error" : "Result"}
      </h4>
      <div
        className={cn(
          "overflow-x-auto rounded-md text-xs [&_table]:w-full",
          errorText
            ? "bg-destructive/10 text-destructive"
            : "bg-muted/50 text-foreground"
        )}
      >
        {errorText && <div>{errorText}</div>}
        {Output}
      </div>
    </div>
  );
}
