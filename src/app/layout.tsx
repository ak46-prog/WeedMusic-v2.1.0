import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "weedmusic - Stream Unlimited Music",
  description: "Stream unlimited music from YouTube, Radio & more. Ad-free with Car Mode & Kids Mode.",
  keywords: ["weedmusic", "music", "streaming", "free music", "radio", "kids mode", "car mode"],
  authors: [{ name: "weedmusic Team" }],
  icons: {
    icon: "/weedmusic-logo.png",
  },
  openGraph: {
    title: "weedmusic - Stream Unlimited Music",
    description: "Stream unlimited music from YouTube, Radio & more. Ad-free with Car Mode & Kids Mode.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "weedmusic - Stream Unlimited Music",
    description: "Stream unlimited music from YouTube, Radio & more. Ad-free with Car Mode & Kids Mode.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/weedmusic-logo.png" />
      </head>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
