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
        src: "/plant-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/plant-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
