"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";

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

  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!VISIBLE_PATHS.has(pathname)) return null;

  const isAdmin = ADMIN_EMAILS.includes(
    String(user?.email || "").trim().toLowerCase()
  );

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
              {item.icon}
            </span>
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
