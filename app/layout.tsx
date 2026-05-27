import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ClerkProvider } from '@clerk/nextjs';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cragtrails.app"),
  title: {
    default: "CragTrails • The Free Climbing Guide Climbers Actually Trust",
    template: "%s • CragTrails",
  },
  description: "The free climbing guide that feels like it was made by your favorite climbing partner, not a corporation. Open data via OpenBeta, offline-first, kid-friendly with human review, and governed by real skeptical climbers. Find routes, log sends, share beta — zero paywalls, zero tracking.",
  keywords: [
    "free climbing guide",
    "open climbing database",
    "offline climbing app",
    "crag beta",
    "openbeta",
    "family friendly climbing",
    "kid friendly climbing routes",
    "mountain project alternative",
    "thecrag alternative",
    "climbing route map",
    "free climbing app",
    "community climbing guide",
    "skeptical climbing moderation",
  ],
  authors: [{ name: "CragTrails Community", url: "https://cragtrails.app" }],
  creator: "Climbers, for climbers",
  publisher: "CragTrails",
  openGraph: {
    title: "CragTrails • The Free, Open Climbing Guide Built Like Your Favorite Partner",
    description: "Open. Simple. Kid-friendly. Offline when it matters. Powered by OpenBeta's open data + real human oversight so families and serious climbers can trust every photo and beta. No corporate nonsense.",
    url: "https://cragtrails.app",
    siteName: "CragTrails",
    images: [
      {
        url: "https://cragtrails.app/og-default.png",
        width: 1200,
        height: 630,
        alt: "CragTrails — The free climbing guide that feels like it was made by your favorite climbing partner, not a corporation",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CragTrails • Free Climbing Guide Built by Climbers",
    description: "No paywalls. No tracking. Just the beta you need, offline, with the trust of real skeptical climbers reviewing every upload. #CragTrails",
    images: ["https://cragtrails.app/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-sans bg-white text-[#1F2525]">
          {children}
          <Toaster 
            position="top-center" 
            richColors 
            closeButton 
            className="toaster-climb"
            toastOptions={{
              style: {
                background: '#ffffff',
                border: '1px solid #E5E2D9',
                color: '#1F2525',
              },
            }}
          />

        {/* PERFECT SEO: Structured Data (JSON-LD) per Next.js docs — Organization + WebSite + Sample Climbing Route for rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://cragtrails.app/#organization",
                  name: "CragTrails",
                  url: "https://cragtrails.app",
                  logo: "https://cragtrails.app/logo.png",
                  description: "The free, open climbing guide built by climbers for climbers. Powered by OpenBeta open data with human-reviewed, kid-friendly moderation.",
                  sameAs: [
                    "https://openbeta.io",
                    "https://github.com/OpenBeta"
                  ],
                  foundingDate: "2025",
                  knowsAbout: ["Rock Climbing", "Climbing Routes", "Crag Beta", "Outdoor Climbing Safety"]
                },
                {
                  "@type": "WebSite",
                  "@id": "https://cragtrails.app/#website",
                  url: "https://cragtrails.app",
                  name: "CragTrails",
                  description: "The free climbing guide that feels like it was made by your favorite climbing partner, not a corporation.",
                  publisher: { "@id": "https://cragtrails.app/#organization" },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: "https://cragtrails.app/?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                },
                // Sample structured data for a Route (will be expanded on dynamic route pages)
                {
                  "@type": "Article",
                  "@id": "https://cragtrails.app/#sample-route",
                  headline: "The Nose — Yosemite Valley",
                  description: "The most famous big wall in the world. A true test of endurance, crack technique, and mental game.",
                  author: { "@type": "Organization", name: "CragTrails Community (OpenBeta + Mountain Project sources)" },
                  publisher: { "@id": "https://cragtrails.app/#organization" },
                  datePublished: "2026-05-20",
                  image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200",
                  keywords: ["5.14a", "Trad", "Big Wall", "Yosemite", "Climbing Beta"],
                  about: {
                    "@type": "Place",
                    name: "The Nose, Yosemite Valley",
                    geo: {
                      "@type": "GeoCoordinates",
                      latitude: 37.7345,
                      longitude: -119.5328
                    }
                  }
                }
              ]
            }).replace(/</g, "\\u003c")
          }}
        />
      </body>
    </ClerkProvider>
    </html>
  );
}
