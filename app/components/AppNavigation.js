"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getProfileAvatar } from "../../lib/profileAvatars";

const NAV_ITEMS = [
  { href: "/", label: "Start", icon: "⌂" },
  { href: "/history", label: "Aufgaben", icon: "▤" },
  { href: "/league", label: "Liga", icon: "★" },
  { href: "/profile", label: "Profil", icon: "●" },
];

const VISIBLE_PATHS = new Set([
  "/",
  "/history",
  "/league",
  "/profile",
  "/admin",
]);
const ADMIN_EMAILS = ["genckurecikli@gmail.com"];

export default function AppNavigation() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [avatarId, setAvatarId] = useState("star");

  useEffect(() => {
    if (!supabase) return undefined;

    async function loadUser(currentUser) {
      setUser(currentUser);

      if (!currentUser) {
        setAvatarId("star");
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

  if (!VISIBLE_PATHS.has(pathname)) return null;

  const isAdmin = ADMIN_EMAILS.includes(
    String(user?.email || "").trim().toLowerCase()
  );
  const profileAvatar = getProfileAvatar(isAdmin ? "spark" : avatarId);

  return (
    <nav className="app-bottom-nav no-print" aria-label="App Navigation">
      {NAV_ITEMS.map((item) => {
        const href =
          item.href === "/profile" && isAdmin ? "/admin" : item.href;
        const isActive =
          pathname === href ||
          (item.href === "/profile" && pathname === "/admin");

        return (
          <a
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
                    fontSize: 15,
                  }}
                >
                  {profileAvatar.icon}
                </span>
              ) : (
                item.icon
              )}
            </span>
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
