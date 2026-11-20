import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { FooterSection } from "@/components/layout/sections/footer";
import { ClubCursor } from "@/components/layout/club-cursor";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/context/AuthContext";
import { CONFIG } from "@/lib/config";
import { MotionRuntime } from "@/components/motion/motion-runtime";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: CONFIG.site.name,
  description: CONFIG.site.description,
  keywords: [
    "ACE",
    "SASTRA",
    "Computing",
    "Engineering",
    "Club",
    "Technology",
    "Education",
    "Research",
  ],
  authors: [{ name: CONFIG.site.name }],
  creator: CONFIG.site.name,
  publisher: CONFIG.site.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(CONFIG.site.url),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ACE SASTRA - Excellence in Computing Education",
    description:
      "Join ACE SASTRA, a premier student-run computing club promoting excellence in technology education and research. Connect with passionate tech enthusiasts and innovators.",
    url: CONFIG.site.url,
    siteName: CONFIG.site.name,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/ACE_SVG_original.png",
        width: 800,
        height: 600,
        alt: "ACE SASTRA Original Logo",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${jetbrains.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('ace-loaded')||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('no-preload')}catch(e){}",
          }}
        />
      </head>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <MotionRuntime />
            <Navbar />
            <main className="min-h-screen grow pt-16">{children}</main>
            <FooterSection />
            <Toaster position="top-right" richColors closeButton />
            <ClubCursor />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
