import type { Metadata } from "next";
import "./globals.css";
import "./rank-effects.css";
import "./reset-account.css";
import "./kiro-live.css";
import "./champion-world.css";
import "./finish.css";
import "./plan.css";
import "./training-update.css";

export const metadata: Metadata = {
  title: "Fit — Dein Fitness-Assistent",
  description: "Dein persönlicher Chat für Training, Ernährung und Motivation.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://fit-mercan.vercel.app'),
  openGraph: {type:'website',locale:'de_DE',title:'Fit — Dein Fitness-Assistent',description:'Dein Training, dein Kalender und dein Fortschritt. Mit Kiro.',images:[{url:'/fit-icon.jpg',width:1035,height:1005,alt:'Fit App'}]},
  twitter: {card:'summary_large_image',title:'Fit — Dein Fitness-Assistent',images:['/fit-icon.jpg']},
  icons: {
    icon: "/fit-icon.jpg",
    shortcut: "/fit-icon.jpg",
    apple: "/fit-icon.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
