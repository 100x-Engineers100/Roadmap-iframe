import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Schibsted_Grotesk, Inter, Noto_Sans, Fustat } from "next/font/google";
import { Agentation } from "agentation";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const schibstedGrotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-schibsted",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
});

const fustat = Fustat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-fustat",
});

export const metadata: Metadata = {
  title: "100x AI Roadmap Builder",
  description: "Get your personalized AI career roadmap grounded in 100x Engineers curriculum.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${schibstedGrotesk.variable} ${inter.variable} ${notoSans.variable} ${fustat.variable}`}
    >
      <head>
        <link rel="icon" href="/icon.jpg" />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-[#F7F7F7] text-[#232323] antialiased">
        {children}
        {process.env.NODE_ENV === "development" && <Agentation endpoint="http://localhost:4747" />}
      </body>
    </html>
  );
}
