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
  const [language, setLanguage] = useState("de");
  const [imageData, setImageData] = useState(null);
  const [grade, setGrade] = useState("4");
const [subject, setSubject] = useState("Mathe");
const [mode, setMode] = useState("explain"); // "extract" oder "explain"
const translations = {
  de: {
    selectLanguage: "Sprache",
    takePhoto: "📷 Foto aufnehmen",
    detectTasks: "🧠 Aufgabe erkennen & erklären",
    checkSolution: "✅ Lösung prüfen",
    taskText: "Aufgabe (Text optional)",
    taskPlaceholder: "Schreibe deine Aufgabe hier rein (optional)...",
    gradeLabel: "Klasse",
    subjectLabel: "Fach",
    gradePlaceholder: "Klasse wählen",
    subjectPlaceholder: "Fach wählen",
    subjectGerman: "Deutsch",
    subjectMath: "Mathe",
    subjectEnglish: "Englisch",
    title: "Hausaufgaben Hilfe",
  },
  tr: {
    selectLanguage: "Dil",
    takePhoto: "📷 Foto çek",
    detectTasks: "🧠 Ödevi algıla ve açıkla",
    checkSolution: "✅ Cevabı kontrol et",
    taskText: "Ödev (metin, isteğe bağlı)",
    taskPlaceholder: "Ödevini buraya yaz (isteğe bağlı)...",
    gradeLabel: "Sınıf",
    subjectLabel: "Ders",
    gradePlaceholder: "Sınıf seç",
    subjectPlaceholder: "Ders seç",
    subjectGerman: "Almanca",
    subjectMath: "Matematik",
    subjectEnglish: "İngilizce",
    title: "Ödev Yardımı",
  },
  en: {
    selectLanguage: "Language",
    takePhoto: "📷 Take photo",
    detectTasks: "🧠 Detect & explain task",
    checkSolution: "✅ Check solution",
    taskText: "Task (text optional)",
    taskPlaceholder: "Write your task here (optional)...",
    gradeLabel: "Grade",
    subjectLabel: "Subject",
    gradePlaceholder: "Choose grade",
    subjectPlaceholder: "Choose subject",
    subjectGerman: "German",
    subjectMath: "Math",
    subjectEnglish: "English",
    title: "Homework Helper",
  }
};



const t = translations[language];

  async function explainTask() {
    setLoading(true);
    setAnswer("");

    try {
      console.log("mode:", mode);
console.log("task:", task);
console.log("imageData vorhanden:", !!imageData);
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  grade: grade,
  subject: subject,
  task: task,
  imageData: imageData,
  mode: mode,
  language: language
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
<div style={{ marginBottom: 16 }}>
  <label style={{ display: "block", marginBottom: 6 }}>
    {t.selectLanguage}
  </label>

  <select
  value={language}
  onChange={(e) => setLanguage(e.target.value)}
  style={{
    width: "100%",
    padding: "10px",
    borderRadius: "10px",
    fontSize: "16px"
  }}
>
  <option value="de">Deutsch</option>
  <option value="tr">Türkçe</option>
  <option value="en">English</option>
</select>
</div>

<style>{printStyles}</style>

<div
  style={{
    textAlign: "center",
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  }}
>
  <img
    src="/logo2.png"
    alt="Homework Helper Logo"
    style={{
      width: "90px",
      height: "90px",
      marginBottom: "10px",
      borderRadius: "20px",
    }}
  />

  <h1
    style={{
      fontSize: "30px",
      lineHeight: "1.2",
      margin: 0,
      textAlign: "center",
    }}
  >
    {t.title}
  </h1>
</div>



   <p>Bild hochladen (optional):</p>

<input
  id="cameraInput"
  type="file"
  accept="image/*"
  capture
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageData("");
setAnswer("");

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
 <button
  style={{
    width: "100%",
    padding: "18px",
    fontSize: "20px",
    fontWeight: "bold",
    borderRadius: "14px",
    border: "none",
    backgroundColor: "#e53935",
    color: "white",
    marginBottom: "12px",
  }}
>
  {t.takePhoto}
</button>
</button>
      <p style={{ marginTop: 16 }}>{t.taskText}</p>
      <textarea
        placeholder={t.taskPlaceholder}
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
    onClick={() => { setMode("explain"); explainTask(); }}
    disabled={loading}
    style={{
      width: "100%",
      padding: "18px",
      fontSize: "20px",
      fontWeight: "bold",
      borderRadius: "14px",
      border: "none",
      backgroundColor: "#fb8c00",
      color: "white",
      marginBottom: "12px",
    }}
  >
    {t.detectTasks}
  </button>

  
  

  <button
  onClick={() => { setMode("check"); explainTask(); }}
  disabled={loading}
  style={{
    width: "100%",
    padding: "18px",
    fontSize: "20px",
    fontWeight: "bold",
    borderRadius: "14px",
    border: "none",
    backgroundColor: "#43a047",
    color: "white",
    marginBottom: "12px",
  }}
>
  {t.checkSolution}
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