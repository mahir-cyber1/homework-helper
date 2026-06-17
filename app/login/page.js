"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}`,
      },
    });

    if (error) {
      setMessage("Fehler: " + error.message);
    } else {
      setMessage("Login-Link wurde gesendet. Bitte E-Mail prüfen.");
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

      <p>Gib deine E-Mail-Adresse ein. Du bekommst einen Login-Link.</p>

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

      <button
        onClick={handleLogin}
        disabled={loading || !email}
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
        {loading ? "Bitte warten..." : "Login-Link senden"}
      </button>

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </main>
  );
}