"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function initSession() {
      if (!supabase) {
        setMessage("Supabase ist noch nicht konfiguriert.");
        setReady(true);
        return;
      }

      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setMessage("Fehler: " + error.message);
        }
      }

      setReady(true);
    }

    initSession();
  }, []);

  async function handleUpdatePassword() {
    setLoading(true);
    setMessage("");

    if (!supabase) {
      setMessage("Fehler: Supabase ist noch nicht konfiguriert.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Das Passwort muss mindestens 6 Zeichen haben.");
      setLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setMessage("Die Passwoerter stimmen nicht ueberein.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage("Fehler: " + error.message);
    } else {
      setMessage("Passwort wurde gespeichert. Du kannst dich jetzt einloggen.");
      await supabase.auth.signOut();
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
      <h1>Neues Passwort</h1>

      <p>Erstelle ein neues Passwort fuer dein Konto.</p>

      <input
        type="password"
        placeholder="Neues Passwort"
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

      <input
        type="password"
        placeholder="Passwort wiederholen"
        value={repeatPassword}
        onChange={(e) => setRepeatPassword(e.target.value)}
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
        onClick={handleUpdatePassword}
        disabled={loading || !ready}
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
        {loading ? "Bitte warten..." : "Passwort speichern"}
      </button>

      <button
        onClick={() => {
          window.location.href = "/login";
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
        Zurueck zum Login
      </button>

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </main>
  );
}
