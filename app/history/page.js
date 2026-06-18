"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function HistoryPage() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [message, setMessage] = useState(
    supabase ? "" : "Supabase ist noch nicht konfiguriert."
  );

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    async function loadHistory() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("homework_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage("Fehler beim Laden: " + error.message);
      } else {
        setItems(data || []);
      }

      setLoading(false);
    }

    loadHistory();
  }, []);

  async function handleSignOut() {
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
        Zurück zur App
      </button>

      <h1 style={{ fontSize: 28, marginTop: 0 }}>Meine Aufgaben</h1>

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
          <p style={{ marginTop: 0 }}>
            Bitte logge dich ein, um deinen Verlauf zu sehen.
          </p>
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
          <p style={{ fontSize: 14, color: "#ccc" }}>
            Eingeloggt als: {user.email}
          </p>

          <button
            onClick={handleSignOut}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#444",
              color: "white",
              fontWeight: "bold",
              marginBottom: 16,
            }}
          >
            Abmelden
          </button>

          {message && <p>{message}</p>}

          {items.length === 0 && !message && (
            <p>Du hast noch keine gespeicherten Aufgaben.</p>
          )}

          {items.map((item) => (
            <article
              key={item.id}
              style={{
                padding: 14,
                borderRadius: 12,
                backgroundColor: "#1b1b1b",
                border: "1px solid #333",
                marginBottom: 14,
              }}
            >
              <p style={{ margin: "0 0 8px", color: "#bbb", fontSize: 13 }}>
                {new Date(item.created_at).toLocaleString("de-DE")} | Klasse{" "}
                {item.grade} | {item.subject}
              </p>
              <p style={{ margin: "0 0 8px", fontWeight: "bold" }}>
                {item.mode === "check" ? "Lösung prüfen" : "Erklärung"}
              </p>
              {item.task && (
                <>
                  <p style={{ marginBottom: 6, color: "#ccc" }}>Aufgabe:</p>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      fontFamily: "Arial, sans-serif",
                      marginTop: 0,
                    }}
                  >
                    {item.task}
                  </pre>
                </>
              )}
              {item.file_name && (
                <p style={{ color: "#ccc" }}>Datei: {item.file_name}</p>
              )}
              <p style={{ marginBottom: 6, color: "#ccc" }}>Antwort:</p>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "Arial, sans-serif",
                  margin: 0,
                }}
              >
                {item.answer}
              </pre>
            </article>
          ))}
        </>
      )}
    </main>
  );
}
