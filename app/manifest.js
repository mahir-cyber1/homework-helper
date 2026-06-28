export default function manifest() {
  return {
    name: "Pflanzencheck",
    short_name: "Pflanzen",
    description: "KI-Hilfe zum Erkennen von Pflanzen und möglichen Blattkrankheiten",
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
