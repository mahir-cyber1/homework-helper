export default function manifest() {
  return {
    name: "Hausaufgaben Hilfe",
    short_name: "Hausaufgaben",
    description: "KI-Hilfe zum Erklären und Prüfen von Hausaufgaben",
    start_url: "/",
    display: "standalone",
    background_color: "#090b10",
    theme_color: "#111318",
    orientation: "portrait",
    icons: [
      {
        src: "/icon2.png",
        sizes: "any",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
