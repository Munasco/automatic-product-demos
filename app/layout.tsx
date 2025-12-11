import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "../components/ui/tooltip";
import { ConvexClientProvider } from "../lib/convex";
import { Providers } from "../components/providers";
import { Toaster } from "sonner";
import Script from "next/script";

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
      <head>
        {/* put this in the <head> */}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className="antialiased">
        <Providers>
          <ConvexClientProvider>
            <TooltipProvider delayDuration={0}>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: "#ffffff",
                    border: "1px solid #e5e5e5",
                    color: "#171717",
                  },
                  classNames: {
                    error: "!bg-red-50 !border-red-200 !text-red-900",
                  },
                }}
              />
            </TooltipProvider>
          </ConvexClientProvider>
        </Providers>
      </body>
    </html>
  );
}
