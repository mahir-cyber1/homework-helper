"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    try {
      if (!supabase) {
        setMessage("Fehler: Supabase ist noch nicht konfiguriert.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage("Fehler: " + (data?.error || "Login fehlgeschlagen."));
      } else if (data?.session) {
        const { error } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (error) {
          setMessage("Fehler: " + error.message);
        } else {
          window.location.href =
            displayName.trim().toLowerCase() === "memed"
              ? "/admin"
              : "/gebaerdensprache";
        }
      } else {
        setMessage(data?.message || "Login verarbeitet.");
      }
    } catch (error) {
      setMessage("Fehler: " + (error?.message || "Unbekannt"));
    }

    setLoading(false);
  }

  return (
    <main
      style={{
        maxWidth: 430,
        margin: "0 auto",
        minHeight: "100vh",
        padding: 20,
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#0d1016",
        color: "white",
      }}
    >
      <h1 style={{ marginTop: 0 }}>Login</h1>

      <p style={{ color: "#b9c1cf", lineHeight: 1.5 }}>
        Melde dich mit deinem Namen und Passwort an. Neue Benutzer legt der
        Admin an.
      </p>

      <input
        type="text"
        placeholder="Name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        autoComplete="username"
        style={{
          width: "100%",
          padding: 14,
          fontSize: 18,
          borderRadius: 8,
          border: "1px solid #334052",
          marginBottom: 12,
          boxSizing: "border-box",
          background: "#111722",
          color: "white",
        }}
      />

      <input
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        onKeyDown={(event) => {
          if (event.key === "Enter" && displayName && password.length >= 6) {
            handleLogin();
          }
        }}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 18,
          borderRadius: 8,
          border: "1px solid #334052",
          marginBottom: 12,
          boxSizing: "border-box",
          background: "#111722",
          color: "white",
        }}
      />

      <button
        onClick={handleLogin}
        disabled={loading || !displayName.trim() || password.length < 6}
        style={{
          width: "100%",
          padding: 16,
          fontSize: 18,
          fontWeight: "bold",
          borderRadius: 8,
          border: "none",
          backgroundColor: "#1fb895",
          color: "#07100d",
        }}
      >
        {loading ? "Bitte warten..." : "Einloggen"}
      </button>

      {message && (
        <p
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            backgroundColor: "#141924",
            border: "1px solid #28313d",
            color: "#dbe3ed",
          }}
        >
          {message}
        </p>
      )}
    </main>
  );
}
