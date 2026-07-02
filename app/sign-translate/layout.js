export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      "https://mercan-check-psi.vercel.app"
  ),
  title: "Gebärdensprache KI",
  description:
    "Webcam-App zum Trainieren und Live-Erkennen von Gebärden mit KI-Tracking.",
  applicationName: "Gebärdensprache KI",
  icons: {
    icon: "/sign-icon.svg",
    apple: "/sign-icon.svg",
  },
  openGraph: {
    title: "Gebärdensprache KI",
    description:
      "Gebärden aufnehmen, korrigieren und live als Text anzeigen.",
    url: "/gebaerdensprache",
    siteName: "Gebärdensprache KI",
    images: [
      {
        url: "/sign-translate/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Gebärdensprache KI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gebärdensprache KI",
    description:
      "Gebärden aufnehmen, korrigieren und live als Text anzeigen.",
    images: ["/sign-translate/opengraph-image"],
  },
};

export default function SignTranslateLayout({ children }) {
  return children;
}
