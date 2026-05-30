import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WeedMusic - Free Unlimited Music Streaming | Listen to Songs Online",
  description: "Stream unlimited free music online. WeedMusic offers ad-free music streaming with Kids Mode, Car Mode, Radio & more. Listen to trending songs, nursery rhymes, and radio stations. Available in USA, Europe, Middle East & worldwide.",
  keywords: [
    // Core
    "weedmusic", "free music streaming", "listen to music online", "music player", "online radio",
    // US Market
    "free music app USA", "stream music America", "listen to songs free United States",
    // Europe Market
    "free music streaming Europe", "musique gratuite", "kostenlose Musik", "musica gratis",
    // Middle East Market  
    "music streaming Middle East", "Arabic music online", "listen to music GCC",
    // Features
    "kids music", "nursery rhymes", "car mode music", "YouTube music player",
    "free radio online", "trending songs 2024", "music without ads",
    // SEO long-tail
    "best free music streaming app", "how to listen to music for free",
    "music app for kids", "safe music for children", "driving mode music app",
  ],
  authors: [{ name: "WeedMusic Team" }],
  creator: "WeedMusic",
  publisher: "WeedMusic",
  robots: "index, follow",
  icons: { icon: "/weedmusic-logo.png" },
  openGraph: {
    title: "WeedMusic - Free Unlimited Music Streaming",
    description: "Stream unlimited free music online. Ad-free with Kids Mode, Car Mode, Radio & more.",
    type: "website",
    locale: "en_US",
    alternateLocale: ["en_GB", "ar_SA", "fr_FR", "de_DE", "es_ES"],
    url: "https://weedmusic.vercel.app",
    siteName: "WeedMusic",
    images: [{ url: "/weedmusic-banner-new.png", width: 1200, height: 1200 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WeedMusic - Free Unlimited Music Streaming",
    description: "Stream unlimited free music online. Ad-free with Kids Mode, Car Mode, Radio & more.",
    images: ["/weedmusic-banner-new.png"],
  },
  alternates: {
    canonical: "https://weedmusic.vercel.app",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "WeedMusic",
              "url": "https://weedmusic.vercel.app",
              "description": "Free unlimited music streaming with Kids Mode, Car Mode & Radio",
              "applicationCategory": "MultimediaApplication",
              "operatingSystem": "Web",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
              "browserRequirements": "Requires JavaScript",
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
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
