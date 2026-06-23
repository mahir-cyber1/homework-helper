"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function TrainingPage() {
  const [items, setItems] = useState([]);
  const [exercise, setExercise] = useState("");
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function getToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || "";
  }

  useEffect(() => {
    if (!supabase) return;

    async function loadItems() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      if (!token) {
        setMessage("Bitte logge dich ein.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/training", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setItems(data.items || []);
      else {
        setMessage(data.error || "Fehlertraining konnte nicht geladen werden.");
      }
      setLoading(false);
    }

    loadItems();
  }, []);

  async function createExercise(id) {
    setActiveId(id);
    setExercise("");
    const token = await getToken();
    const res = await fetch("/api/training", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setExercise(res.ok ? data.exercise : `Fehler: ${data.error}`);
    setActiveId("");
  }

  async function markResolved(id) {
    const token = await getToken();
    await fetch("/api/training", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
    setItems((current) => current.filter((item) => item.id !== id));
    setExercise("");
  }

  return (
    <main style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", padding: 20, background: "#111", color: "white", borderRadius: 24 }}>
      <h1 style={{ fontSize: 28, margin: "4px 0 8px" }}>Fehlertraining</h1>
      <p style={{ color: "#bbb", marginBottom: 18 }}>Übe gezielt mit neuen, ähnlichen Aufgaben.</p>

      {loading && <p>Wird geladen...</p>}
      {message && <p>{message}</p>}
      {!loading && !message && items.length === 0 && (
        <section style={{ padding: 16, border: "1px solid #333", borderRadius: 8, background: "#1b1b1b" }}>
          Noch keine Fehler gespeichert. Das ist entweder sehr gut oder du hast noch keine Lösung geprüft.
        </section>
      )}

      {items.map((item) => (
        <article key={item.id} style={{ padding: 14, marginBottom: 12, border: "1px solid #333", borderRadius: 8, background: "#1b1b1b" }}>
          <strong>{item.grade}. Klasse</strong>
          <p style={{ color: "#ccc", whiteSpace: "pre-wrap", maxHeight: 120, overflow: "hidden" }}>
            {item.correction}
          </p>
          <button onClick={() => createExercise(item.id)} disabled={activeId === item.id} style={{ width: "100%", padding: 12, border: 0, borderRadius: 8, background: "#fb8c00", color: "white", fontWeight: "bold", marginBottom: 8 }}>
            {activeId === item.id ? "Übung wird erstellt..." : "Ähnliche Übung erstellen"}
          </button>
          <button onClick={() => markResolved(item.id)} style={{ width: "100%", padding: 10, border: "1px solid #444", borderRadius: 8, background: "#222", color: "white" }}>
            Als geübt markieren
          </button>
        </article>
      ))}

      {exercise && (
        <section style={{ padding: 16, borderRadius: 8, background: "white", color: "#172033", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>Deine neue Übung</h2>
          {exercise}
        </section>
      )}
    </main>
  );
}
