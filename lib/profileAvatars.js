export const profileAvatars = [
  { id: "star", icon: "⭐", label: "Stern", background: "#4a148c" },
  { id: "rocket", icon: "🚀", label: "Rakete", background: "#0d47a1" },
  { id: "book", icon: "📘", label: "Buch", background: "#00695c" },
  { id: "pencil", icon: "✏️", label: "Stift", background: "#ef6c00" },
  { id: "medal", icon: "🏅", label: "Medaille", background: "#795548" },
  { id: "bulb", icon: "💡", label: "Idee", background: "#f9a825" },
  { id: "planet", icon: "🪐", label: "Planet", background: "#283593" },
  { id: "rainbow", icon: "🌈", label: "Regenbogen", background: "#ad1457" },
  { id: "calculator", icon: "🧮", label: "Rechnen", background: "#2e7d32" },
  { id: "globe", icon: "🌍", label: "Welt", background: "#0277bd" },
  { id: "music", icon: "🎵", label: "Musik", background: "#6a1b9a" },
  { id: "spark", icon: "✨", label: "Glanz", background: "#455a64" },
];

export function getProfileAvatar(avatarId) {
  return (
    profileAvatars.find((avatar) => avatar.id === avatarId) ||
    profileAvatars[0]
  );
}
