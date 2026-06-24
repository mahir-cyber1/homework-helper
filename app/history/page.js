"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { text, useAppLanguage } from "../../lib/i18n";

const HISTORY_TEXT = {
  de: { back: "Zurück zur App", title: "Meine Aufgaben", training: "Fehlertraining öffnen", loading: "Wird geladen...", loginInfo: "Bitte logge dich ein, um deinen Verlauf zu sehen.", login: "Einloggen", signedIn: "Eingeloggt als", logout: "Abmelden", empty: "Du hast noch keine gespeicherten Aufgaben.", check: "Lösung prüfen", explanation: "Erklärung", task: "Aufgabe", file: "Datei", answer: "Antwort", grade: "Klasse", loadError: "Fehler beim Laden" },
  en: { back: "Back to app", title: "My tasks", training: "Open mistake practice", loading: "Loading...", loginInfo: "Please log in to view your history.", login: "Log in", signedIn: "Logged in as", logout: "Log out", empty: "You do not have any saved tasks yet.", check: "Check solution", explanation: "Explanation", task: "Task", file: "File", answer: "Answer", grade: "Grade", loadError: "Loading error" },
  tr: { back: "Uygulamaya dön", title: "Ödevlerim", training: "Hata çalışmasını aç", loading: "Yükleniyor...", loginInfo: "Geçmişini görmek için giriş yap.", login: "Giriş yap", signedIn: "Giriş yapılan hesap", logout: "Çıkış yap", empty: "Henüz kaydedilmiş ödevin yok.", check: "Çözümü kontrol et", explanation: "Açıklama", task: "Ödev", file: "Dosya", answer: "Cevap", grade: "Sınıf", loadError: "Yükleme hatası" },
};

export default function HistoryPage() {
  const { language } = useAppLanguage();
  const tx = text(HISTORY_TEXT, language);
  const locale = language === "tr" ? "tr-TR" : language === "en" ? "en-US" : "de-DE";
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
        setMessage(`${tx.loadError}: ${error.message}`);
      } else {
        setItems(data || []);
      }

      setLoading(false);
    }

    loadHistory();
  }, [tx.loadError]);

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
        {tx.back}
      </button>

      <h1 style={{ fontSize: 28, marginTop: 0 }}>{tx.title}</h1>

      <button
        onClick={() => {
          window.location.href = "/training";
        }}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "none",
          backgroundColor: "#fb8c00",
          color: "white",
          fontWeight: "bold",
          marginBottom: 14,
        }}
      >
        {tx.training}
      </button>

      {loading && <p>{tx.loading}</p>}

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
            {tx.loginInfo}
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
            {tx.login}
          </button>
        </div>
      )}

      {!loading && user && (
        <>
          <p style={{ fontSize: 14, color: "#ccc" }}>
            {tx.signedIn}: {user.email}
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
            {tx.logout}
          </button>

          {message && <p>{message}</p>}

          {items.length === 0 && !message && (
            <p>{tx.empty}</p>
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
                {new Date(item.created_at).toLocaleString(locale)} | {tx.grade}{" "}
                {item.grade} | {item.subject}
              </p>
              <p style={{ margin: "0 0 8px", fontWeight: "bold" }}>
                {item.mode === "check" ? tx.check : tx.explanation}
              </p>
              {item.task && (
                <>
                  <p style={{ marginBottom: 6, color: "#ccc" }}>{tx.task}:</p>
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
                <p style={{ color: "#ccc" }}>{tx.file}: {item.file_name}</p>
              )}
              <p style={{ marginBottom: 6, color: "#ccc" }}>{tx.answer}:</p>
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
