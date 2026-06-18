"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/request-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          displayName,
          redirectTo: window.location.origin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage("Fehler: " + (data?.error || "Unbekannt"));
      } else {
        setMessage(data?.message || "Anfrage wurde verarbeitet.");
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
        Gib deinen Namen und deine E-Mail-Adresse ein. Freigegebene Nutzer
        bekommen direkt einen Login-Link.
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

      <button
        onClick={handleLogin}
        disabled={loading || !email || !displayName}
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
