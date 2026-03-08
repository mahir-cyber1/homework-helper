"use client";
const printStyles = `
@media print {
  body * {
    visibility: hidden;
  }

  #printArea, #printArea * {
    visibility: visible;
  }

  #printArea {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    color: black;
    background: white;
    padding: 20px;
  }

  button, input, textarea, select {
    display: none !important;
  }
}
`;
import { useState } from "react";


export default function Home() {
  const [task, setTask] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [grade, setGrade] = useState("4");
const [subject, setSubject] = useState("Mathe");
const [mode, setMode] = useState("explain"); // "extract" oder "explain"

  async function explainTask() {
    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  grade: grade,
  subject: subject,
  task: task,
  imageData: imageData,
  mode: mode,
}),

      });

      const data = await res.json();

      if (!res.ok) {
        setAnswer("FEHLER: " + (data?.error || "Unbekannt"));
      } else {
        setAnswer(data?.answer || "Keine Antwort im Response.");
      }
    } catch (e) {
      setAnswer("FEHLER: " + (e?.message || "Unbekannt"));
    } finally {
      setLoading(false);
    }
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

    <style>{printStyles}</style>

    <h1 style={{ fontSize: "42px", marginBottom: 20, textAlign: "center" }}>
      Hausaufgaben Hilfe
    </h1>
      <div style={{ marginTop: 10 }}>
  <label>Klasse: </label>
  <select value={grade} onChange={(e) => setGrade(e.target.value)}>
    <option value="4">4</option>
    <option value="5">5</option>
    <option value="6">6</option>
  </select>

  <span style={{ marginLeft: 20 }}>Fach: </span>
  <select value={subject} onChange={(e) => setSubject(e.target.value)}>
    <option value="Mathe">Mathe</option>
    <option value="Deutsch">Deutsch</option>
    <option value="Englisch">Englisch</option>
  </select>
</div>

   <p>Bild hochladen (optional):</p>

<input
  id="cameraInput"
  type="file"
  accept="image/*"
  capture="environment"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1200;
        const scale = Math.min(1, maxWidth / img.width);

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressed = canvas.toDataURL("image/jpeg", 0.8);
        setImageData(compressed);
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  }}
/>

<button
  onClick={() => document.getElementById("cameraInput").click()}
  style={{
    padding: "14px 18px",
    fontSize: "18px",
    borderRadius: "10px",
    marginTop: 10,
    marginLeft: 10,
    color: "red",
  }}
>
  📷 Foto aufnehmen
</button>
      <p style={{ marginTop: 16 }}>Aufgabe (Text, optional):</p>
      <textarea
        placeholder="Schreibe deine Aufgabe hier rein (optional)..."
        value={task}
        onChange={(e) => setTask(e.target.value)}
        style={{
  width: "100%",
  height: 140,
  fontSize: "18px",
  padding: 14,
  borderRadius: 14,
  border: "1px solid #444",
  marginTop: 10,
  backgroundColor: "#1b1b1b",
  color: "white"
}}
      />

      <div style={{ marginTop: 12 }}>
 <button
onClick={() => { setMode("extract"); explainTask(); }}
disabled={loading}
style={{ padding: "14px 18px", fontSize: "18px", borderRadius: "10px" }}
>
Aufgaben erkennen
</button>
  

  <button
    onClick={() => {
      setTask("Bitte prüfe meine Lösung und erkläre Fehler:\n\n" + task);
      explainTask();
    }}
    disabled={loading}
    style={{ marginLeft: 10, padding: "14px 18px", fontSize: "18px", borderRadius: "10px" }}
  >
    Lösung prüfen
  </button>
</div>

      {answer && (
        <div
  id="printArea"
  style={{
    marginTop: 20,
    padding: 12,
    border: "1px solid #ddd",
    borderRadius: 8,
    backgroundColor: "white",
    color: "black"
  }}
>
          <h3>Antwort:</h3>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{answer}</pre>
          <button
onClick={() => window.print()}
style={{
  marginTop: 20,
  padding: "12px 16px",
  fontSize: "16px",
  borderRadius: "10px"
}}
>
📄 Als PDF speichern / Drucken
</button>
        </div>
      )}
    </main>
  );
}