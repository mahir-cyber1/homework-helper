"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getLeague, leagues } from "../../lib/gamification";

export default function LeaguePage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [message, setMessage] = useState(
    supabase ? "" : "Supabase ist nicht konfiguriert."
  );

  useEffect(() => {
    if (!supabase) return undefined;

    async function loadLeague() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch("/api/gamification", {
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });
      const data = await res.json();

      if (res.ok) {
        setStats(data.stats);
      } else {
        setMessage(data?.error || "Liga konnte nicht geladen werden.");
      }

      setLoading(false);
    }

    loadLeague();
  }, []);

  const points = stats?.points || 0;
  const currentLeague = stats?.league || getLeague(points);
  const nextLeague = stats?.nextLeague || null;
  const currentStart = currentLeague.minPoints;
  const nextStart = nextLeague?.minPoints || currentStart;
  const progress = nextLeague
    ? Math.min(
        100,
        Math.max(
          0,
          ((points - currentStart) / (nextStart - currentStart)) * 100
        )
      )
    : 100;

  return (
    <main
      style={{
        maxWidth: 430,
        margin: "0 auto",
        minHeight: "100vh",
        padding: 20,
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#111",
        color: "white",
        borderRadius: 24,
      }}
    >
      <h1 style={{ fontSize: 28, margin: "4px 0 18px" }}>Meine Liga</h1>

      {loading && <p>Wird geladen...</p>}

      {!loading && !user && (
        <section
          style={{
            padding: 16,
            border: "1px solid #333",
            borderRadius: 8,
            backgroundColor: "#1b1b1b",
          }}
        >
          <p style={{ margin: "0 0 12px" }}>
            Bitte logge dich ein, um deine Liga zu sehen.
          </p>
          <button
            onClick={() => {
              window.location.href = "/login";
            }}
            style={{
              width: "100%",
              padding: 12,
              border: 0,
              borderRadius: 8,
              backgroundColor: "#1976d2",
              color: "white",
              fontWeight: "bold",
            }}
          >
            Einloggen
          </button>
        </section>
      )}

      {!loading && user && (
        <>
          <section
            style={{
              padding: 20,
              border: "1px solid #3a3f49",
              borderRadius: 8,
              backgroundColor: "#181b21",
              textAlign: "center",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                position: "relative",
                width: 190,
                height: 190,
                margin: "0 auto",
              }}
            >
              <Image
                src={currentLeague.image}
                alt={`${currentLeague.name} Pokal`}
                fill
                priority
                sizes="190px"
                style={{ objectFit: "contain" }}
              />
            </div>
            <h2 style={{ margin: "10px 0 4px", fontSize: 24 }}>
              {currentLeague.name}
            </h2>
            <p style={{ margin: 0, color: "#aeb4bf" }}>{points} Punkte</p>

            <div
              style={{
                height: 12,
                marginTop: 18,
                overflow: "hidden",
                borderRadius: 6,
                backgroundColor: "#30343c",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  borderRadius: 6,
                  backgroundColor: "#43a047",
                }}
              />
            </div>

            <p style={{ margin: "9px 0 0", color: "#c7cbd2", fontSize: 13 }}>
              {nextLeague
                ? `Noch ${stats.pointsToNextLeague} Punkte bis ${nextLeague.name}`
                : "Du hast die höchste Liga erreicht."}
            </p>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                padding: 14,
                border: "1px solid #333",
                borderRadius: 8,
                backgroundColor: "#1b1b1b",
              }}
            >
              <strong style={{ display: "block", fontSize: 22 }}>
                {stats?.correctChecks || 0}
              </strong>
              <span style={{ color: "#aaa", fontSize: 13 }}>
                richtig gelöst
              </span>
            </div>
            <div
              style={{
                padding: 14,
                border: "1px solid #333",
                borderRadius: 8,
                backgroundColor: "#1b1b1b",
              }}
            >
              <strong style={{ display: "block", fontSize: 22 }}>
                {stats?.totalChecks || 0}
              </strong>
              <span style={{ color: "#aaa", fontSize: 13 }}>
                Prüfungen
              </span>
            </div>
          </section>

          <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Alle Ligen</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {leagues.map((league) => {
              const reached = points >= league.minPoints;
              const active = league.id === currentLeague.id;

              return (
                <div
                  key={league.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    border: active
                      ? "2px solid #43a047"
                      : "1px solid #333",
                    borderRadius: 8,
                    backgroundColor: reached ? "#1b1b1b" : "#141414",
                    opacity: reached ? 1 : 0.58,
                  }}
                >
                  <span
                    style={{
                      position: "relative",
                      width: 58,
                      height: 58,
                      flex: "0 0 auto",
                      overflow: "hidden",
                      borderRadius: 6,
                    }}
                  >
                    <Image
                      src={league.image}
                      alt={`${league.name} Pokal`}
                      fill
                      sizes="58px"
                      style={{ objectFit: "contain" }}
                    />
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong style={{ display: "block" }}>{league.name}</strong>
                    <span style={{ color: "#aaa", fontSize: 12 }}>
                      ab {league.minPoints} Punkten
                    </span>
                  </span>
                  <span style={{ color: reached ? "#66bb6a" : "#888" }}>
                    {active ? "Aktiv" : reached ? "Erreicht" : "Gesperrt"}
                  </span>
                </div>
              );
            })}
          </div>

          {message && <p style={{ color: "#ef9a9a" }}>{message}</p>}
        </>
      )}
    </main>
  );
}
