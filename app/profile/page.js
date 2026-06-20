"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getProfileAvatar, profileAvatars } from "../../lib/profileAvatars";

const ADMIN_EMAILS = ["genckurecikli@gmail.com"];

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [avatarId, setAvatarId] = useState("star");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [message, setMessage] = useState(
    supabase ? "" : "Supabase ist nicht konfiguriert."
  );
  const [loading, setLoading] = useState(Boolean(supabase));

  const isAdmin = user
    ? ADMIN_EMAILS.includes(String(user.email || "").trim().toLowerCase())
    : false;
  const currentAvatar = getProfileAvatar(isAdmin ? "spark" : avatarId);

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

      const { data } = await supabase
        .from("user_profiles")
        .select("display_name,avatar_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const profileName = isAdmin ? "Admin" : data?.display_name || fallbackName;
      const profileAvatarId = data?.avatar_id || "star";

      setDisplayName(profileName);
      setNameDraft(profileName);
      setAvatarId(profileAvatarId);
      setLoading(false);
    }

    loadProfile();
  }, [isAdmin]);

  async function saveProfile() {
    if (!supabase || !user || isAdmin) return;

    const trimmedName = nameDraft.trim().slice(0, 60);

    if (trimmedName.length < 2) {
      setMessage("Bitte mindestens 2 Zeichen fuer den Namen eingeben.");
      return;
    }

    const { error } = await supabase.from("user_profiles").upsert({
      user_id: user.id,
      email: user.email,
      display_name: trimmedName,
      avatar_id: avatarId,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage("Fehler: " + error.message);
    } else {
      setDisplayName(trimmedName);
      setMessage("Profil wurde gespeichert.");
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

              <button
                onClick={saveProfile}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: "#43a047",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Profil speichern
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
