"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [resetLoginId, setResetLoginId] = useState("");
  const [showReset, setShowReset] = useState(false);
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
          email,
          displayName,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage("Fehler: " + (data?.error || "Unbekannt"));
      } else if (data?.session) {
        const { error } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (error) {
          setMessage("Fehler: " + error.message);
        } else {
          window.location.href = "/";
        }
      } else {
        setMessage(data?.message || "Anfrage wurde verarbeitet.");
      }
    } catch (error) {
      setMessage("Fehler: " + (error?.message || "Unbekannt"));
    }

    setLoading(false);
  }

  async function handlePasswordReset() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId: resetLoginId || email || displayName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage("Fehler: " + (data?.error || "Unbekannt"));
      } else {
        setMessage(data?.message || "Reset-Link wurde gesendet.");
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
        backgroundColor: "#111",
        color: "white",
      }}
    >
      <h1>Login</h1>

      <p>
        Gib deinen Namen, deine E-Mail-Adresse und dein Passwort ein.
        Freigegebene Nutzer werden direkt eingeloggt.
      </p>

      <input
        type="text"
        placeholder="Name oder Nickname"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 18,
          borderRadius: 12,
          border: "1px solid #444",
          marginBottom: 12,
          boxSizing: "border-box",
        }}
      />

      <input
        type="email"
        placeholder="E-Mail-Adresse"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 18,
          borderRadius: 12,
          border: "1px solid #444",
          marginBottom: 12,
          boxSizing: "border-box",
        }}
      />

      <input
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 18,
          borderRadius: 12,
          border: "1px solid #444",
          marginBottom: 12,
          boxSizing: "border-box",
        }}
      />

      <button
        onClick={handleLogin}
        disabled={loading || !email || !displayName || password.length < 6}
        style={{
          width: "100%",
          padding: 16,
          fontSize: 18,
          fontWeight: "bold",
          borderRadius: 14,
          border: "none",
          backgroundColor: "#1976d2",
          color: "white",
        }}
      >
        {loading ? "Bitte warten..." : "Einloggen"}
      </button>

      <button
        onClick={() => {
          setShowReset(!showReset);
          setMessage("");
        }}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          fontWeight: "bold",
          borderRadius: 12,
          border: "1px solid #444",
          backgroundColor: "#222",
          color: "white",
          marginTop: 12,
        }}
      >
        Passwort vergessen?
      </button>

      {showReset && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: "#1b1b1b",
            border: "1px solid #333",
          }}
        >
          <p style={{ marginTop: 0 }}>
            Gib deine E-Mail-Adresse oder deinen Namen ein. Du bekommst einen
            Link, um ein neues Passwort zu erstellen.
          </p>
          <input
            type="text"
            placeholder="E-Mail oder Name"
            value={resetLoginId}
            onChange={(e) => setResetLoginId(e.target.value)}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 18,
              borderRadius: 12,
              border: "1px solid #444",
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handlePasswordReset}
            disabled={loading || !(resetLoginId || email || displayName)}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 16,
              fontWeight: "bold",
              borderRadius: 12,
              border: "none",
              backgroundColor: "#43a047",
              color: "white",
            }}
          >
            Reset-Link senden
          </button>
        </div>
      )}

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </main>
  );
}
