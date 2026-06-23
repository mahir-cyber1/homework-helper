"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getLeague } from "../../lib/gamification";
import { getProfileAvatar, profileAvatars } from "../../lib/profileAvatars";

const ADMIN_EMAILS = ["genckurecikli@gmail.com"];

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [avatarId, setAvatarId] = useState("star");
  const [gradeLevel, setGradeLevel] = useState("4");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [gameStats, setGameStats] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [message, setMessage] = useState(
    supabase ? "" : "Supabase ist nicht konfiguriert."
  );
  const [loading, setLoading] = useState(Boolean(supabase));

  const isAdmin = user
    ? ADMIN_EMAILS.includes(String(user.email || "").trim().toLowerCase())
    : false;
  const currentAvatar = getProfileAvatar(isAdmin ? "spark" : avatarId);
  const currentLeague = gameStats?.league || getLeague(0);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      const fallbackName =
        user.user_metadata?.display_name || user.email?.split("@")[0] || "";

      let { data, error } = await supabase
        .from("user_profiles")
        .select("display_name,avatar_id,grade_level")
        .eq("user_id", user.id)
        .maybeSingle();

      if (
        error &&
        (String(error.message || "").includes("avatar_id") ||
          String(error.message || "").includes("grade_level"))
      ) {
        let fallbackResult = await supabase
          .from("user_profiles")
          .select("display_name,avatar_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (
          fallbackResult.error &&
          String(fallbackResult.error.message || "").includes("avatar_id")
        ) {
          fallbackResult = await supabase
            .from("user_profiles")
            .select("display_name")
            .eq("user_id", user.id)
            .maybeSingle();
        }

        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      const profileName = isAdmin ? "Admin" : data?.display_name || fallbackName;
      const profileAvatarId =
        data?.avatar_id || user.user_metadata?.avatar_id || "star";
      const profileGradeLevel = String(
        data?.grade_level || user.user_metadata?.grade_level || "4"
      );

      setDisplayName(profileName);
      setNameDraft(profileName);
      setAvatarId(profileAvatarId);
      setGradeLevel(
        ["4", "5", "6"].includes(profileGradeLevel)
          ? profileGradeLevel
          : "4"
      );

      if (error) {
        setMessage("Profil konnte nicht vollständig geladen werden.");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        const res = await fetch("/api/gamification", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setGameStats(data.stats);
        }
      }

      setLoading(false);
    }

    loadProfile();
  }, [isAdmin]);

  async function saveProfile() {
    if (!supabase || !user || isAdmin || savingProfile) return;

    const trimmedName = nameDraft.trim().slice(0, 60);

    if (trimmedName.length < 2) {
      setMessage("Bitte mindestens 2 Zeichen fuer den Namen eingeben.");
      return;
    }

    setSavingProfile(true);
    setMessage("Profil wird gespeichert...");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: trimmedName,
          avatarId,
          gradeLevel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage("Fehler: " + (data?.error || "Unbekannt"));
        return;
      }

      setDisplayName(data.displayName);
      setNameDraft(data.displayName);
      setAvatarId(data.avatarId);
      setGradeLevel(data.gradeLevel);
      await supabase.auth.refreshSession();
      window.location.replace("/");
    } catch {
      setMessage("Fehler: Das Profil konnte nicht gespeichert werden.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    if (!supabase || !user) return;

    if (newPassword.length < 6) {
      setMessage("Das Passwort muss mindestens 6 Zeichen haben.");
      return;
    }

    if (newPassword !== repeatPassword) {
      setMessage("Die Passwoerter stimmen nicht ueberein.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage("Fehler: " + error.message);
    } else {
      setNewPassword("");
      setRepeatPassword("");
      setMessage("Passwort wurde gespeichert.");
    }
  }

  async function signOut() {
    if (!supabase) return;

    await supabase.auth.signOut();
    window.location.href = "/";
  }

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
      <button
        onClick={() => {
          window.location.href = "/";
        }}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "10px",
          border: "none",
          backgroundColor: "#333",
          color: "white",
          fontWeight: "bold",
          marginBottom: 14,
        }}
      >
        Zurueck zur App
      </button>

      <h1 style={{ fontSize: 28, marginTop: 0 }}>Profil</h1>

      {loading && <p>Wird geladen...</p>}

      {!loading && !user && (
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            backgroundColor: "#1b1b1b",
            border: "1px solid #333",
          }}
        >
          <p style={{ marginTop: 0 }}>Bitte logge dich zuerst ein.</p>
          <button
            onClick={() => {
              window.location.href = "/login";
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#1976d2",
              color: "white",
              fontWeight: "bold",
            }}
          >
            Einloggen
          </button>
        </div>
      )}

      {!loading && user && (
        <>
          <section
            style={{
              padding: 14,
              borderRadius: 12,
              backgroundColor: "#1b1b1b",
              border: "1px solid #333",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  backgroundColor: currentAvatar.background,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 31,
                  flex: "0 0 auto",
                }}
              >
                {currentAvatar.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: "0 0 4px", fontWeight: "bold" }}>
                  {isAdmin ? "Admin" : displayName}
                </p>
                <p style={{ margin: 0, color: "#bbb", fontSize: 13 }}>
                  {user.email}
                </p>
              </div>
            </div>
          </section>

          {!isAdmin && (
            <section
              style={{
                padding: 14,
                borderRadius: 12,
                backgroundColor: "#1b1b1b",
                border: "1px solid #333",
                marginBottom: 14,
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: "bold" }}>
                {currentLeague.icon} {currentLeague.name}
              </p>
              <p style={{ margin: "0 0 8px", color: "#ccc" }}>
                {gameStats?.points || 0} Punkte ·{" "}
                {gameStats?.correctChecks || 0} richtige Prüfungen
              </p>
              {gameStats?.nextLeague ? (
                <p style={{ margin: 0, color: "#aaa", fontSize: 13 }}>
                  Noch {gameStats.pointsToNextLeague} Punkte bis{" "}
                  {gameStats.nextLeague.name}.
                </p>
              ) : (
                <p style={{ margin: 0, color: "#aaa", fontSize: 13 }}>
                  Hoechste Liga erreicht.
                </p>
              )}
            </section>
          )}

          {isAdmin ? (
            <section
              style={{
                padding: 14,
                borderRadius: 12,
                backgroundColor: "#1b1b1b",
                border: "1px solid #333",
                marginBottom: 14,
              }}
            >
              <p style={{ margin: 0 }}>
                Admin-Name und Admin-Profilbild koennen nicht geaendert werden.
              </p>
            </section>
          ) : (
            <section
              style={{
                padding: 14,
                borderRadius: 12,
                backgroundColor: "#1b1b1b",
                border: "1px solid #333",
                marginBottom: 14,
              }}
            >
              <label style={{ display: "block", marginBottom: 6 }}>
                Name oder Nickname
              </label>
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => {
                  setNameDraft(e.target.value);
                  setMessage("");
                }}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid #444",
                  backgroundColor: "#111",
                  color: "white",
                  boxSizing: "border-box",
                  marginBottom: 14,
                }}
              />

              <p style={{ margin: "0 0 10px" }}>Profilbild</p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {profileAvatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => {
                      setAvatarId(avatar.id);
                      setMessage("");
                    }}
                    aria-label={avatar.label}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "50%",
                      border:
                        avatarId === avatar.id
                          ? "3px solid white"
                          : "1px solid #444",
                      backgroundColor: avatar.background,
                      color: "white",
                      fontSize: 26,
                    }}
                  >
                    {avatar.icon}
                  </button>
                ))}
              </div>

              <label style={{ display: "block", marginBottom: 6 }}>
                Meine Klasse
              </label>
              <select
                value={gradeLevel}
                onChange={(event) => {
                  setGradeLevel(event.target.value);
                  setMessage("");
                }}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid #444",
                  backgroundColor: "#111",
                  color: "white",
                  boxSizing: "border-box",
                  marginBottom: 14,
                  fontSize: 16,
                }}
              >
                <option value="4">4. Klasse</option>
                <option value="5">5. Klasse</option>
                <option value="6">6. Klasse</option>
              </select>

              <button
                onClick={saveProfile}
                disabled={savingProfile}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: "#43a047",
                  color: "white",
                  fontWeight: "bold",
                  opacity: savingProfile ? 0.65 : 1,
                }}
              >
                {savingProfile ? "Wird gespeichert..." : "Profil speichern"}
              </button>
            </section>
          )}

          <section
            style={{
              padding: 14,
              borderRadius: 12,
              backgroundColor: "#1b1b1b",
              border: "1px solid #333",
              marginBottom: 14,
            }}
          >
            <p style={{ marginTop: 0, fontWeight: "bold" }}>
              Passwort aendern
            </p>
            <input
              type="password"
              placeholder="Neues Passwort"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setMessage("");
              }}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #444",
                backgroundColor: "#111",
                color: "white",
                boxSizing: "border-box",
                marginBottom: 8,
              }}
            />
            <input
              type="password"
              placeholder="Passwort wiederholen"
              value={repeatPassword}
              onChange={(e) => {
                setRepeatPassword(e.target.value);
                setMessage("");
              }}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #444",
                backgroundColor: "#111",
                color: "white",
                boxSizing: "border-box",
                marginBottom: 10,
              }}
            />
            <button
              onClick={savePassword}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "none",
                backgroundColor: "#fb8c00",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Passwort speichern
            </button>
          </section>

          <button
            onClick={() => {
              window.location.href = "/history";
            }}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "none",
              backgroundColor: "#1976d2",
              color: "white",
              fontWeight: "bold",
              marginBottom: 10,
            }}
          >
            Meine Aufgaben
          </button>

          <button
            onClick={signOut}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "none",
              backgroundColor: "#444",
              color: "white",
              fontWeight: "bold",
            }}
          >
            Abmelden
          </button>
        </>
      )}

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </main>
  );
}
