"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { text, useAppLanguage } from "../../lib/i18n";
import {
  getProfileAvatar,
  getProfileFrame,
  getProfileTheme,
} from "../../lib/profileAvatars";

const NAV_ITEMS = [
  { href: "/", label: { de: "Start", en: "Home", tr: "Ana sayfa" }, icon: "⌂" },
  { href: "/plant-doctor", label: { de: "Scan", en: "Scan", tr: "Tara" }, icon: "◉" },
  { href: "/sign-translate", label: { de: "Gebärden", en: "Signs", tr: "İşaret" }, icon: "✋" },
  { href: "/history", label: { de: "Verlauf", en: "History", tr: "Geçmiş" }, icon: "▤" },
  { href: "/profile", label: { de: "Profil", en: "Profile", tr: "Profil" }, icon: "●" },
];

const SIGN_NAV_ITEMS = [
  {
    href: "/gebaerdensprache?mode=live",
    mode: "live",
    label: { de: "Live", en: "Live", tr: "Canlı" },
    icon: "◉",
  },
  {
    href: "/gebaerdensprache?mode=train",
    mode: "train",
    label: { de: "Training", en: "Train", tr: "Eğitim" },
    icon: "✋",
  },
  {
    href: "/login",
    mode: "login",
    label: { de: "Login", en: "Login", tr: "Giriş" },
    icon: "●",
  },
];

const VISIBLE_PATHS = new Set([
  "/",
  "/plant-doctor",
  "/sign-translate",
  "/gebärdensprache",
  "/gebaerdensprache",
  "/history",
  "/training",
  "/league",
  "/profile",
  "/admin",
  "/login",
]);

export default function AppNavigation() {
  const pathname = usePathname();
  const { language } = useAppLanguage();
  const [user, setUser] = useState(null);
  const [avatarId, setAvatarId] = useState("star");
  const [frameId, setFrameId] = useState("none");
  const [themeId, setThemeId] = useState("blue");
  const [currentMode, setCurrentMode] = useState("live");

  useEffect(() => {
    if (!supabase) return undefined;

    async function loadUser(currentUser) {
      setUser(currentUser);

      if (!currentUser) {
        setAvatarId("star");
        setFrameId("none");
        setThemeId("blue");
        return;
      }

      const { data } = await supabase
        .from("user_profiles")
        .select("avatar_id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      setAvatarId(
        data?.avatar_id || currentUser.user_metadata?.avatar_id || "star"
      );
      setFrameId(currentUser.user_metadata?.frame_id || "none");
      setThemeId(currentUser.user_metadata?.theme_id || "blue");
    }

    supabase.auth.getUser().then(({ data }) => {
      loadUser(data.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mode = new URLSearchParams(window.location.search).get("mode");
    setCurrentMode(mode === "train" ? "train" : "live");
  }, [pathname]);

  if (!VISIBLE_PATHS.has(pathname)) return null;

  const signUsername = String(user?.user_metadata?.sign_username || "");
  const isAdmin =
    String(user?.user_metadata?.role || "").toLowerCase() === "admin" ||
    signUsername.trim().toLowerCase() === "memed" ||
    String(user?.email || "").trim().toLowerCase() === "memed@sign.local";
  const profileAvatar = getProfileAvatar(isAdmin ? "spark" : avatarId);
  const profileFrame = getProfileFrame(frameId);
  const profileTheme = getProfileTheme(themeId);
  const isSignPath =
    pathname === "/sign-translate" ||
    pathname === "/gebärdensprache" ||
    pathname === "/gebaerdensprache";
  const navItems = isSignPath
    ? SIGN_NAV_ITEMS.map((item) =>
        item.mode === "login" && user
          ? {
              ...item,
              href: isAdmin ? "/admin" : "/profile",
              label: isAdmin
                ? { de: "Admin", en: "Admin", tr: "Admin" }
                : { de: "Profil", en: "Profile", tr: "Profil" },
            }
          : item
      )
    : NAV_ITEMS;

  return (
    <nav
      className="app-bottom-nav no-print"
      aria-label="App Navigation"
      style={{
        "--app-accent": profileTheme.color,
        gridTemplateColumns: `repeat(${navItems.length}, 1fr)`,
      }}
    >
      {navItems.map((item) => {
        const href =
          item.href === "/profile" && isAdmin ? "/admin" : item.href;
        const isActive =
          (isSignPath && item.mode && item.mode === currentMode) ||
          (item.mode === "login" &&
            (pathname === "/login" || pathname === "/admin")) ||
          pathname === href ||
          (item.href === "/sign-translate" &&
            (pathname === "/gebärdensprache" ||
              pathname === "/gebaerdensprache")) ||
          (item.href === "/history" && pathname === "/training") ||
          (item.href === "/profile" && pathname === "/admin");

        return (
          <Link
            key={item.href}
            href={href}
            className={`app-bottom-nav__item${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="app-bottom-nav__icon" aria-hidden="true">
              {item.href === "/profile" && user ? (
                <span
                  style={{
                    display: "grid",
                    width: 25,
                    height: 25,
                    placeItems: "center",
                    borderRadius: "50%",
                    backgroundColor: profileAvatar.background,
                    border:
                      profileFrame.id === "none"
                        ? "none"
                        : `2px solid ${profileFrame.color}`,
                    fontSize: 15,
                  }}
                >
                  {profileAvatar.icon}
                </span>
              ) : (
                item.icon
              )}
            </span>
            <span>{text(item.label, language)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
