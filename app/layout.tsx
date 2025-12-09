import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "../components/ui/tooltip";
import { ConvexClientProvider } from "../lib/convex";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Tennant Chat",
  description: "AI-powered coding assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ConvexClientProvider>
          <TooltipProvider delayDuration={0}>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "var(--background-secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                },
              }}
            />
          </TooltipProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
