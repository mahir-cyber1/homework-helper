import { Geist, Geist_Mono } from "next/font/google";
import AppNavigation from "./components/AppNavigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      "https://homework-helper-psi.vercel.app"
  ),
  title: "Pflanzencheck",
  description: "KI-Hilfe zum Erkennen von Pflanzen und möglichen Blattkrankheiten",
  applicationName: "Pflanzencheck",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pflanzencheck",
  },
  formatDetection: {
    telephone: false,
  },

  icons: {
    icon: "/icon2.png",
    apple: "/icon2.png",
  },

  openGraph: {
    title: "Pflanzencheck",
    description: "KI-Hilfe zum Erkennen von Pflanzen und möglichen Blattkrankheiten",
    images: [
      {
        url: "/icon2.png",
        width: 512,
        height: 512,
      },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#111318",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <AppNavigation />
      </body>
    </html>
  );
}
