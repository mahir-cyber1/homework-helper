"use client";

import { useState } from "react";
import { text, useAppLanguage } from "../../lib/i18n";

const PLANT_HISTORY_KEY = "plant-doctor-history";

const HISTORY_TEXT = {
  de: {
    back: "Zurück zum Pflanzencheck",
    title: "Pflanzen-Verlauf",
    empty: "Du hast noch keine Pflanzenanalyse gespeichert.",
    clear: "Verlauf löschen",
    plant: "Pflanze",
    symptoms: "Beobachtung",
    location: "Standort",
    causes: "Mögliche Ursachen",
    care: "Was du tun kannst",
    prevention: "Vorbeugung",
    unknown: "Unbekannt",
  },
  en: {
    back: "Back to plant check",
    title: "Plant history",
    empty: "You do not have any saved plant analyses yet.",
    clear: "Clear history",
    plant: "Plant",
    symptoms: "Observation",
    location: "Location",
    causes: "Possible causes",
    care: "What you can do",
    prevention: "Prevention",
    unknown: "Unknown",
  },
  tr: {
    back: "Bitki kontrolüne dön",
    title: "Bitki geçmişi",
    empty: "Henüz kaydedilmiş bitki analizin yok.",
    clear: "Geçmişi sil",
    plant: "Bitki",
    symptoms: "Gözlem",
    location: "Konum",
    causes: "Olası nedenler",
    care: "Ne yapabilirsin",
    prevention: "Önleme",
    unknown: "Bilinmiyor",
  },
};

export default function HistoryPage() {
  const { language } = useAppLanguage();
  const tx = text(HISTORY_TEXT, language);
  const locale =
    language === "tr" ? "tr-TR" : language === "en" ? "en-US" : "de-DE";
  const [items, setItems] = useState(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(window.localStorage.getItem(PLANT_HISTORY_KEY) || "[]");
  });

  function clearHistory() {
    window.localStorage.removeItem(PLANT_HISTORY_KEY);
    setItems([]);
  }

  return (
    <main
      style={{
        maxWidth: 430,
        margin: "0 auto",
        minHeight: "100vh",
        padding: 20,
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#0d1110",
        color: "#f4f7f2",
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
          borderRadius: 8,
          border: "1px solid #344036",
          backgroundColor: "#161d18",
          color: "white",
          fontWeight: "bold",
          marginBottom: 14,
        }}
      >
        {tx.back}
      </button>

      <h1 style={{ fontSize: 28, margin: "0 0 14px" }}>{tx.title}</h1>

      {items.length > 0 && (
        <button
          onClick={clearHistory}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "none",
            backgroundColor: "#31402f",
            color: "white",
            fontWeight: "bold",
            marginBottom: 14,
          }}
        >
          {tx.clear}
        </button>
      )}

      {items.length === 0 && (
        <p style={{ color: "#b9c3b2", lineHeight: 1.5 }}>{tx.empty}</p>
      )}

      {items.map((item) => (
        <article
          key={item.id}
          style={{
            display: "grid",
            gap: 10,
            padding: 14,
            borderRadius: 8,
            backgroundColor: "#141b16",
            border: "1px solid #2f3c32",
            marginBottom: 14,
          }}
        >
          {item.imageData && (
            <img
              alt=""
              src={item.imageData}
              style={{
                width: "100%",
                maxHeight: 220,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          )}

          <p style={{ margin: 0, color: "#91a08d", fontSize: 13 }}>
            {new Date(item.createdAt).toLocaleString(locale)}
          </p>

          <h2 style={{ margin: 0, fontSize: 22 }}>
            {item.result?.plantGuess || tx.unknown}
          </h2>

          {item.symptoms && (
            <p style={{ margin: 0, color: "#d7e2d1" }}>
              <strong>{tx.symptoms}:</strong> {item.symptoms}
            </p>
          )}

          {item.location && (
            <p style={{ margin: 0, color: "#d7e2d1" }}>
              <strong>{tx.location}:</strong> {item.location}
            </p>
          )}

          <section>
            <h3 style={{ margin: "4px 0 8px", fontSize: 16 }}>
              {tx.causes}
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#d7e2d1" }}>
              {item.result?.possibleCauses?.map((cause) => (
                <li key={`${item.id}-${cause.name}`}>
                  <strong>{cause.name}:</strong> {cause.why}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 style={{ margin: "4px 0 8px", fontSize: 16 }}>{tx.care}</h3>
            <ol style={{ margin: 0, paddingLeft: 20, color: "#d7e2d1" }}>
              {item.result?.careSteps?.map((step) => (
                <li key={`${item.id}-${step}`}>{step}</li>
              ))}
            </ol>
          </section>

          <section>
            <h3 style={{ margin: "4px 0 8px", fontSize: 16 }}>
              {tx.prevention}
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#d7e2d1" }}>
              {item.result?.prevention?.map((step) => (
                <li key={`${item.id}-${step}`}>{step}</li>
              ))}
            </ul>
          </section>
        </article>
      ))}
    </main>
  );
}
