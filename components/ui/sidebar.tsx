"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { PanelLeft } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_COLLAPSED = "0rem";

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

interface SidebarProviderProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function SidebarProvider({
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  className,
  children,
  ...props
}: SidebarProviderProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = React.useCallback(
    (value: boolean) => {
      if (onOpenChange) {
        onOpenChange(value);
      } else {
        setUncontrolledOpen(value);
      }
    },
    [onOpenChange]
  );

  const toggleSidebar = React.useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  const contextValue = React.useMemo<SidebarContextValue>(
    () => ({
      open,
      setOpen,
      toggleSidebar,
    }),
    [open, setOpen, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        className={cn("flex h-screen w-full", className)}
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-collapsed": SIDEBAR_WIDTH_COLLAPSED,
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  className,
  children,
  ...props
}: React.ComponentProps<"aside">) {
  const { open } = useSidebar();

  return (
    <aside
      data-state={open ? "open" : "closed"}
      className={cn(
        "flex h-screen flex-col bg-background-sidebar transition-[width] duration-200 ease-in-out overflow-hidden",
        open
          ? "w-[var(--sidebar-width)]"
          : "w-[var(--sidebar-width-collapsed)]",
        className
      )}
      {...props}
    >
      {open && children}
    </aside>
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-2 p-3", className)} {...props} />
  );
}

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex-1 overflow-auto px-3", className)}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-3 border-t border-border",
        className
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-1 pb-4", className)} {...props} />
  );
}

function SidebarGroupLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "px-2 py-1 text-xs font-medium text-foreground-muted",
        className
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("space-y-0.5", className)} {...props} />;
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("flex flex-col gap-0.5", className)} {...props} />;
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("", className)} {...props} />;
}

const sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground",
  {
    variants: {
      isActive: {
        true: "bg-background-secondary text-foreground",
        false: "",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  }
);

interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean;
}

function SidebarMenuButton({
  className,
  isActive,
  asChild = false,
  ...props
}: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(sidebarMenuButtonVariants({ isActive }), className)}
      {...props}
    />
  );
}

function SidebarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-9", className)}
      onClick={toggleSidebar}
      {...props}
    >
      <PanelLeft className="size-5" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      className={cn("flex flex-1 flex-col min-w-0", className)}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};
