"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const FREE_USAGE_KEY = "homework-helper-free-task-used";
const AUTOMATIC_SUBJECT = "Automatisch erkannt";

function formatAnswerSections(answer) {
  const lines = String(answer || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const sections = [];
  let current = { title: "", lines: [] };

  for (const line of lines) {
    if (/^\d+\.\s+/.test(line)) {
      if (current.title || current.lines.length) sections.push(current);
      current = { title: line, lines: [] };
    } else {
      current.lines.push(line);
    }
  }

  if (current.title || current.lines.length) sections.push(current);
  return sections;
}

function FormattedAnswer({ answer }) {
  const sections = formatAnswerSections(answer);

  return (
    <div className="learning-answer">
      {sections.map((section, sectionIndex) => (
        <article
          className="learning-answer__section"
          key={`${section.title}-${sectionIndex}`}
        >
          {section.title && <h4>{section.title}</h4>}
          {section.lines.map((line, lineIndex) => {
            const stepMatch = line.match(
              /^(?:Schritt|Adım|Step)\s+(\d+)\s*:\s*(.*)$/i
            );
            const isExample = /^(?:Beispiel|Örnek|Example)\s*:/i.test(line);
            const isLabel =
              /^(Prüfung|Fehler|Richtige Lösung|Kontrol|Hata|Doğru çözüm|Check|Error|Correct solution)\s*:/i.test(
                line
              );

            if (stepMatch) {
              return (
                <div
                  className="learning-answer__step"
                  key={`${line}-${lineIndex}`}
                >
                  <span>{stepMatch[1]}</span>
                  <p>{stepMatch[2]}</p>
                </div>
              );
            }

            if (isExample) {
              return (
                <div
                  className="learning-answer__example"
                  key={`${line}-${lineIndex}`}
                >
                  <strong>
                    {line.match(/^(Beispiel|Örnek|Example)/i)?.[1] || "Beispiel"}
                  </strong>
                  <p>
                    {line.replace(/^(?:Beispiel|Örnek|Example)\s*:\s*/i, "")}
                  </p>
                </div>
              );
            }

            if (isLabel) {
              const [label, ...content] = line.split(":");
              return (
                <div
                  className="learning-answer__label"
                  key={`${line}-${lineIndex}`}
                >
                  <strong>{label}</strong>
                  {content.join(":").trim() && <p>{content.join(":").trim()}</p>}
                </div>
              );
            }

            return <p key={`${line}-${lineIndex}`}>{line}</p>;
          })}
        </article>
      ))}
    </div>
  );
}

const printStyles = `
@media print {
  body {
    background: white !important;
  }

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
    color: black !important;
    background: white !important;
    padding: 30px;
    font-family: Arial, sans-serif;
    box-sizing: border-box;
  }

  .no-print {
    display: none !important;
  }

  button, input, textarea, select {
    display: none !important;
  }
}
`;

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const overlayBoxStyle = {
  backgroundColor: "#1e1e1e",
  color: "white",
  padding: "30px",
  borderRadius: "20px",
  textAlign: "center",
  minWidth: "200px",
};

const defaultScannerCorners = [
  { x: 0.08, y: 0.08 },
  { x: 0.92, y: 0.08 },
  { x: 0.92, y: 0.92 },
  { x: 0.08, y: 0.92 },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getScannerPointFromEvent(event, rect) {
  const pointer = event.touches?.[0] || event;

  return {
    x: clamp((pointer.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((pointer.clientY - rect.top) / rect.height, 0, 1),
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function detectDocumentCorners(dataUrl) {
  const img = await loadImage(dataUrl);
  const maxScanSize = 700;
  const scale = Math.min(1, maxScanSize / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return defaultScannerCorners;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const { data, width, height } = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );
  const rowHits = new Array(height).fill(0);
  const colHits = new Array(width).fill(0);
  const borderSamples = [];
  const border = Math.max(4, Math.round(Math.min(width, height) * 0.04));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x > border && x < width - border && y > border && y < height - border) {
        continue;
      }

      const index = (y * width + x) * 4;
      borderSamples.push((data[index] + data[index + 1] + data[index + 2]) / 3);
    }
  }

  const borderAverage =
    borderSamples.reduce((sum, value) => sum + value, 0) / borderSamples.length;
  const lightThreshold = clamp(borderAverage + 25, 145, 230);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const luma = (r + g + b) / 3;
      const contrast = Math.abs(luma - borderAverage);
      const isPaperLike = luma > lightThreshold || (luma > 125 && contrast > 35);

      if (isPaperLike) {
        rowHits[y] += 1;
        colHits[x] += 1;
      }
    }
  }

  const minRowHits = width * 0.12;
  const minColHits = height * 0.12;
  const top = rowHits.findIndex((hits) => hits >= minRowHits);
  const bottom =
    height - 1 - [...rowHits].reverse().findIndex((hits) => hits >= minRowHits);
  const left = colHits.findIndex((hits) => hits >= minColHits);
  const right =
    width - 1 - [...colHits].reverse().findIndex((hits) => hits >= minColHits);

  if (top < 0 || left < 0 || bottom <= top || right <= left) {
    return defaultScannerCorners;
  }

  const paddingX = width * 0.015;
  const paddingY = height * 0.015;

  return [
    { x: clamp((left - paddingX) / width, 0.02, 0.98), y: clamp((top - paddingY) / height, 0.02, 0.98) },
    { x: clamp((right + paddingX) / width, 0.02, 0.98), y: clamp((top - paddingY) / height, 0.02, 0.98) },
    { x: clamp((right + paddingX) / width, 0.02, 0.98), y: clamp((bottom + paddingY) / height, 0.02, 0.98) },
    { x: clamp((left - paddingX) / width, 0.02, 0.98), y: clamp((bottom + paddingY) / height, 0.02, 0.98) },
  ];
}

async function createScannedImage(dataUrl, corners) {
  const img = await loadImage(dataUrl);
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = img.width;
  sourceCanvas.height = img.height;

  const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!sourceCtx) return dataUrl;

  sourceCtx.drawImage(img, 0, 0);

  const points = corners.map((corner) => ({
    x: corner.x * img.width,
    y: corner.y * img.height,
  }));
  const [topLeft, topRight, bottomRight, bottomLeft] = points;
  const outputWidth = Math.round(
    Math.min(
      1600,
      Math.max(distance(topLeft, topRight), distance(bottomLeft, bottomRight))
    )
  );
  const outputHeight = Math.round(
    Math.min(
      2200,
      Math.max(distance(topLeft, bottomLeft), distance(topRight, bottomRight))
    )
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, outputWidth);
  canvas.height = Math.max(1, outputHeight);

  const sourceImage = sourceCtx.getImageData(0, 0, img.width, img.height);
  const outputCtx = canvas.getContext("2d", { willReadFrequently: true });
  if (!outputCtx) return dataUrl;

  const outputImage = outputCtx.createImageData(canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 1) {
    const v = canvas.height === 1 ? 0 : y / (canvas.height - 1);

    for (let x = 0; x < canvas.width; x += 1) {
      const u = canvas.width === 1 ? 0 : x / (canvas.width - 1);
      const sx =
        (1 - u) * (1 - v) * topLeft.x +
        u * (1 - v) * topRight.x +
        u * v * bottomRight.x +
        (1 - u) * v * bottomLeft.x;
      const sy =
        (1 - u) * (1 - v) * topLeft.y +
        u * (1 - v) * topRight.y +
        u * v * bottomRight.y +
        (1 - u) * v * bottomLeft.y;
      const sourceX = clamp(Math.round(sx), 0, img.width - 1);
      const sourceY = clamp(Math.round(sy), 0, img.height - 1);
      const sourceIndex = (sourceY * img.width + sourceX) * 4;
      const outputIndex = (y * canvas.width + x) * 4;

      outputImage.data[outputIndex] = sourceImage.data[sourceIndex];
      outputImage.data[outputIndex + 1] = sourceImage.data[sourceIndex + 1];
      outputImage.data[outputIndex + 2] = sourceImage.data[sourceIndex + 2];
      outputImage.data[outputIndex + 3] = 255;
    }
  }

  outputCtx.putImageData(outputImage, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.88);
}

export default function Home() {
  const [task, setTask] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("de");
  const [imageData, setImageData] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileMime, setFileMime] = useState("");
  const [grade, setGrade] = useState("4");
  const [user, setUser] = useState(null);
  const [freeTaskUsed, setFreeTaskUsed] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [pointsMessage, setPointsMessage] = useState("");
  const [trainingAvailable, setTrainingAvailable] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [scannerImage, setScannerImage] = useState(null);
  const [scannerFileName, setScannerFileName] = useState("");
  const [scannerCorners, setScannerCorners] = useState(defaultScannerCorners);
  const [activeScannerCorner, setActiveScannerCorner] = useState(null);
  const [scannerProcessing, setScannerProcessing] = useState(false);

  const translations = {
    de: {
      selectLanguage: "Sprache",
      uploadFile: "📄 Datei hochladen",
      takePhoto: "📷 Foto aufnehmen",
      detectTasks: "🧠 Aufgabe erkennen & erklären",
      checkSolution: "✅ Lösung prüfen",
      taskText: "Aufgabe (Text optional)",
      taskPlaceholder: "Schreibe deine Aufgabe hier rein (optional)...",
      gradeLabel: "Klasse",
      subjectLabel: "Fach",
      subjectGerman: "Deutsch",
      subjectMath: "Mathe",
      subjectEnglish: "Englisch",
      title: "Hausaufgaben Hilfe",
      uploadImage: "Datei oder Bild hochladen:",
      answerLabel: "Antwort:",
      printPdf: "📄 Als PDF speichern / Drucken",
      loadingText: "Wird bearbeitet...",
      pleaseWait: "⏳ Bitte warten...",
    },
    tr: {
      selectLanguage: "Dil",
      uploadFile: "📄 Dosya yükle",
      takePhoto: "📷 Foto çek",
      detectTasks: "🧠 Ödevi algıla ve açıkla",
      checkSolution: "✅ Cevabı kontrol et",
      taskText: "Ödev (metin, isteğe bağlı)",
      taskPlaceholder: "Ödevini buraya yaz (isteğe bağlı)...",
      gradeLabel: "Sınıf",
      subjectLabel: "Ders",
      subjectGerman: "Almanca",
      subjectMath: "Matematik",
      subjectEnglish: "İngilizce",
      title: "Ödev Yardımı",
      uploadImage: "Dosya veya görsel yükle:",
      answerLabel: "Cevap:",
      printPdf: "📄 PDF olarak kaydet / Yazdır",
      loadingText: "İşleniyor...",
      pleaseWait: "⏳ Lütfen bekleyin...",
    },
    en: {
      selectLanguage: "Language",
      uploadFile: "📄 Upload file",
      takePhoto: "📷 Take photo",
      detectTasks: "🧠 Detect & explain task",
      checkSolution: "✅ Check solution",
      taskText: "Task (text optional)",
      taskPlaceholder: "Write your task here (optional)...",
      gradeLabel: "Grade",
      subjectLabel: "Subject",
      subjectGerman: "German",
      subjectMath: "Math",
      subjectEnglish: "English",
      title: "Homework Helper",
      uploadImage: "Upload file or image:",
      answerLabel: "Answer:",
      printPdf: "📄 Save as PDF / Print",
      loadingText: "Processing...",
      pleaseWait: "⏳ Please wait...",
    },
  };

  const t = translations[language];

  const getAccessToken = useCallback(async () => {
    if (!supabase) return "";

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }, []);

  async function loadProfile(currentUser) {
    if (!supabase || !currentUser) return;

    const fallbackName =
      currentUser.user_metadata?.display_name ||
      currentUser.email?.split("@")[0] ||
      "";

    let { data, error } = await supabase
      .from("user_profiles")
      .select("user_id,grade_level")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error && String(error.message || "").includes("grade_level")) {
      const fallbackResult = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("user_id", currentUser.id)
        .maybeSingle();
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    const savedGrade = String(
      data?.grade_level || currentUser.user_metadata?.grade_level || "4"
    );
    setGrade(["4", "5", "6"].includes(savedGrade) ? savedGrade : "4");

    if (!data && fallbackName) {
      await supabase.from("user_profiles").upsert({
        user_id: currentUser.id,
        email: currentUser.email,
        display_name: fallbackName,
        avatar_id: "star",
        grade_level: savedGrade,
        updated_at: new Date().toISOString(),
      });
    }
  }

  useEffect(() => {
    setFreeTaskUsed(localStorage.getItem(FREE_USAGE_KEY) === "true");

    if (!supabase) {
      setAuthReady(true);
      return undefined;
    }

    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      await loadProfile(user);
      setAuthReady(true);
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        loadProfile(currentUser);
      }
      setAuthReady(true);
    });

    return () => {
      subscription.unsubscribe();
      window.speechSynthesis?.cancel();
    };
  }, []);

  function toggleSpeech() {
    if (!("speechSynthesis" in window)) {
      setPointsMessage("Vorlesen wird von diesem Gerät nicht unterstützt.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.lang =
      language === "tr" ? "tr-TR" : language === "en" ? "en-US" : "de-DE";
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  async function saveTaskToHistory(mode, savedAnswer) {
    if (!supabase || !user) return;

    const { error } = await supabase.from("homework_history").insert({
      user_id: user.id,
      grade,
      subject: AUTOMATIC_SUBJECT,
      language,
      mode,
      task: task || "",
      answer: savedAnswer,
      file_name: fileName || null,
      file_mime: fileMime || null,
    });

    if (error) {
      console.error("History save error:", error);
    }
  }

  function resetScanner() {
    setScannerImage(null);
    setScannerFileName("");
    setScannerCorners(defaultScannerCorners);
    setActiveScannerCorner(null);
    setScannerProcessing(false);
  }

  async function openScanner(dataUrl, selectedFileName) {
    setScannerImage(dataUrl);
    setScannerFileName(selectedFileName);
    setScannerCorners(defaultScannerCorners);
    setScannerProcessing(true);

    try {
      const detectedCorners = await detectDocumentCorners(dataUrl);
      setScannerCorners(detectedCorners);
    } catch (error) {
      console.error("Scanner detection error:", error);
      setScannerCorners(defaultScannerCorners);
    } finally {
      setScannerProcessing(false);
    }
  }

  function handleScannerMove(event) {
    if (activeScannerCorner === null) return;

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const point = getScannerPointFromEvent(event, rect);

    setScannerCorners((currentCorners) =>
      currentCorners.map((corner, index) =>
        index === activeScannerCorner ? point : corner
      )
    );
  }

  function handleScannerEnd() {
    setActiveScannerCorner(null);
  }

  function useOriginalScanImage() {
    if (!scannerImage) return;

    setImageData(scannerImage);
    setFileData(null);
    setFileName(scannerFileName);
    setFileMime("image/jpeg");
    resetScanner();
  }

  async function acceptScannedImage() {
    if (!scannerImage) return;

    setScannerProcessing(true);

    try {
      const scannedImage = await createScannedImage(scannerImage, scannerCorners);
      setImageData(scannedImage);
      setFileData(null);
      setFileName(scannerFileName);
      setFileMime("image/jpeg");
      resetScanner();
    } catch (error) {
      console.error("Scanner crop error:", error);
      setAnswer("FEHLER: Scan konnte nicht verarbeitet werden.");
      setScannerProcessing(false);
    }
  }

  async function explainTask(selectedMode) {
    if (!authReady) return;

    if (!user && freeTaskUsed) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setAnswer("");
    setPointsMessage("");
    setTrainingAvailable(false);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade,
          subject: AUTOMATIC_SUBJECT,
          task,
          imageData,
          fileData,
          fileName,
          fileMime,
          mode: selectedMode,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAnswer("FEHLER: " + (data?.error || "Unbekannt"));
      } else {
        const newAnswer = data?.answer || "Keine Antwort im Response.";
        const visibleAnswer = newAnswer
          .replace(
            /^\s*(RICHTIGE|GESAMTE)_AUFGABEN\s*:\s*\d+\s*$/gim,
            ""
          )
          .trim();
        setAnswer(visibleAnswer || newAnswer);

        if (user) {
          await saveTaskToHistory(selectedMode, visibleAnswer || newAnswer);
          if (selectedMode === "check") {
            const token = await getAccessToken();
            if (token) {
              const pointsRes = await fetch("/api/gamification", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  mode: selectedMode,
                  answer: newAnswer,
                  subject: AUTOMATIC_SUBJECT,
                  grade,
                  task: task || fileName || "Aufgabe aus Bild oder PDF",
                  language,
                }),
              });

              if (pointsRes.ok) {
                const pointsData = await pointsRes.json();
                setTrainingAvailable(Boolean(pointsData.savedForTraining));
                setPointsMessage(
                  pointsData.pointsAwarded > 0
                    ? `${pointsData.correctTaskCount} richtig gelöst · +${pointsData.pointsAwarded} Punkte · ${pointsData.stats.league.name}${pointsData.savedForTraining ? " · Fehlertraining aktualisiert" : ""}`
                    : pointsData.savedForTraining
                      ? "Fehler gespeichert. Im Fehlertraining kannst du ähnlich üben."
                      : "Geprueft. Fuer jede richtig geloeste Aufgabe gibt es 1 Punkt."
                );
              }
            }
          }
        } else {
          localStorage.setItem(FREE_USAGE_KEY, "true");
          setFreeTaskUsed(true);
        }
      }
    } catch (e) {
      setAnswer("FEHLER: " + (e?.message || "Unbekannt"));
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImageData(null);
    setFileData(null);
    setFileName(file.name);
    setFileMime(file.type);
    setAnswer("");

    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileData(event.target.result);
      };
      reader.readAsDataURL(file);
      return;
    }

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new window.Image();

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxWidth = 1200;
          const scale = Math.min(1, maxWidth / img.width);

          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setAnswer("FEHLER: Bild konnte nicht verarbeitet werden.");
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressed = canvas.toDataURL("image/jpeg", 0.8);
          openScanner(compressed, file.name);
        };

        img.src = event.target.result;
      };

      reader.readAsDataURL(file);
      return;
    }

    setAnswer("FEHLER: Bitte nur Bild oder PDF hochladen.");
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

      {!user && (
        <div
          className="no-print"
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            backgroundColor: "#1b1b1b",
            border: "1px solid #333",
          }}
        >
          <>
            <p style={{ margin: "0 0 10px", fontSize: 14 }}>
              {freeTaskUsed
                ? "Eine Aufgabe wurde kostenlos gelöst. Für weitere Aufgaben bitte einloggen."
                : "Du bist nicht eingeloggt. Eine Aufgabe kannst du kostenlos lösen."}
            </p>
            <button
              onClick={() => {
                window.location.href = "/login";
              }}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#1976d2",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Einloggen
            </button>
          </>
        </div>
      )}

      {loading && (
        <div style={overlayStyle}>
          <div style={overlayBoxStyle}>
            <div style={{ fontSize: 50, marginBottom: 10 }}>⏳</div>
            <p>{t.loadingText}</p>
          </div>
        </div>
      )}

      {scannerImage && (
        <div
          className="no-print"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            backgroundColor: "rgba(0,0,0,0.92)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 14,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 430,
              maxHeight: "96vh",
              overflow: "auto",
              backgroundColor: "#151515",
              border: "1px solid #333",
              borderRadius: 16,
              padding: 14,
              boxSizing: "border-box",
            }}
          >
            <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>
              Seite scannen
            </h2>
            <p style={{ margin: "0 0 12px", color: "#ddd", fontSize: 14 }}>
              Ziehe die vier Punkte an die Ecken der Seite.
            </p>

            <div
              role="presentation"
              onMouseMove={handleScannerMove}
              onMouseUp={handleScannerEnd}
              onMouseLeave={handleScannerEnd}
              onTouchMove={handleScannerMove}
              onTouchEnd={handleScannerEnd}
              style={{
                position: "relative",
                width: "100%",
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: "#050505",
                touchAction: "none",
                userSelect: "none",
              }}
            >
              <img
                src={scannerImage}
                alt="Scan Vorschau"
                draggable={false}
                style={{
                  display: "block",
                  width: "100%",
                  maxHeight: "58vh",
                  objectFit: "contain",
                }}
              />

              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
              >
                <polygon
                  points={scannerCorners
                    .map((corner) => `${corner.x * 100},${corner.y * 100}`)
                    .join(" ")}
                  fill="rgba(67, 160, 71, 0.18)"
                  stroke="#43a047"
                  strokeWidth="0.8"
                />
              </svg>

              {scannerCorners.map((corner, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Scan-Ecke ${index + 1}`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setActiveScannerCorner(index);
                  }}
                  onTouchStart={(event) => {
                    event.preventDefault();
                    setActiveScannerCorner(index);
                  }}
                  style={{
                    position: "absolute",
                    left: `${corner.x * 100}%`,
                    top: `${corner.y * 100}%`,
                    width: 34,
                    height: 34,
                    transform: "translate(-50%, -50%)",
                    borderRadius: "50%",
                    border: "3px solid white",
                    backgroundColor: "#43a047",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.55)",
                    cursor: "grab",
                  }}
                />
              ))}

              {scannerProcessing && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  Kanten werden erkannt...
                </div>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 10,
                marginTop: 12,
              }}
            >
              <button
                onClick={acceptScannedImage}
                disabled={scannerProcessing}
                style={{
                  padding: "14px",
                  borderRadius: 12,
                  border: "none",
                  backgroundColor: "#43a047",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: 16,
                  opacity: scannerProcessing ? 0.7 : 1,
                }}
              >
                Scan übernehmen
              </button>

              <button
                onClick={useOriginalScanImage}
                disabled={scannerProcessing}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: "1px solid #444",
                  backgroundColor: "#222",
                  color: "white",
                  fontWeight: "bold",
                  opacity: scannerProcessing ? 0.7 : 1,
                }}
              >
                Original verwenden
              </button>

              <button
                onClick={() => {
                  setImageData(null);
                  setFileData(null);
                  setFileName("");
                  setFileMime("");
                  resetScanner();
                }}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: "1px solid #444",
                  backgroundColor: "#111",
                  color: "#ddd",
                  fontWeight: "bold",
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

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
            fontSize: "16px",
          }}
        >
          <option value="de">Deutsch</option>
          <option value="tr">Türkçe</option>
          <option value="en">English</option>
        </select>
      </div>

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

      <div
        style={{
          margin: "10px 0 18px",
          padding: "9px 12px",
          borderRadius: 8,
          backgroundColor: "#1b1b1b",
          border: "1px solid #333",
          color: "#d7dbe2",
          fontSize: 14,
          textAlign: "center",
        }}
      >
        Erklärung für die {grade}. Klasse
      </div>

      <p>{t.uploadImage}</p>

      <input
        id="fileInput"
        type="file"
        accept="image/*,.pdf,application/pdf"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <button
        onClick={() => document.getElementById("fileInput")?.click()}
        disabled={loading}
        style={{
          width: "100%",
          padding: "18px",
          fontSize: "20px",
          fontWeight: "bold",
          borderRadius: "14px",
          border: "none",
          backgroundColor: "#1976d2",
          color: "white",
          marginBottom: "12px",
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {t.uploadFile}
      </button>

      {fileName && (
        <p style={{ fontSize: 14, marginTop: -4, marginBottom: 12 }}>
          Ausgewählt: {fileName}
        </p>
      )}

      <input
        id="cameraInput"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <button
        onClick={() => document.getElementById("cameraInput")?.click()}
        disabled={loading}
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
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {t.takePhoto}
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
          color: "white",
          boxSizing: "border-box",
        }}
      />

      <div style={{ marginTop: 12 }}>
        <button
          onClick={() => explainTask("explain")}
          disabled={loading || !authReady}
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
            opacity: loading || !authReady ? 0.7 : 1,
            cursor: loading || !authReady ? "not-allowed" : "pointer",
          }}
        >
          {loading ? t.pleaseWait : t.detectTasks}
        </button>

        <button
          onClick={() => explainTask("check")}
          disabled={loading || !authReady}
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
            opacity: loading || !authReady ? 0.7 : 1,
            cursor: loading || !authReady ? "not-allowed" : "pointer",
          }}
        >
          {loading ? t.pleaseWait : t.checkSolution}
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
            color: "black",
          }}
        >
          <div className="learning-answer__header">
            <span>Lernhilfe</span>
            <h3>{t.answerLabel}</h3>
            <p>{grade}. Klasse · Fach automatisch erkannt</p>
          </div>
          {pointsMessage && (
            <p
              className="no-print"
              style={{
                marginTop: 0,
                padding: "10px",
                borderRadius: "8px",
                backgroundColor: "#e8f5e9",
                color: "#1b5e20",
                fontWeight: "bold",
              }}
            >
              {pointsMessage}
            </p>
          )}
          {trainingAvailable && (
            <button
              className="no-print"
              onClick={() => {
                window.location.href = "/training";
              }}
              style={{
                width: "100%",
                marginBottom: 14,
                padding: 12,
                border: 0,
                borderRadius: 8,
                backgroundColor: "#fb8c00",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Jetzt Fehler trainieren
            </button>
          )}
          <FormattedAnswer answer={answer} />

          <button
            className="no-print"
            onClick={toggleSpeech}
            style={{
              width: "100%",
              marginTop: 16,
              padding: "12px 16px",
              fontSize: 16,
              border: "none",
              borderRadius: 8,
              backgroundColor: isSpeaking ? "#c62828" : "#1976d2",
              color: "white",
              fontWeight: "bold",
            }}
          >
            {isSpeaking ? "Vorlesen stoppen" : "Antwort vorlesen"}
          </button>

          <button
            className="no-print"
            onClick={() => window.print()}
            style={{
              marginTop: 20,
              padding: "12px 16px",
              fontSize: "16px",
              borderRadius: "10px",
            }}
          >
            {t.printPdf}
          </button>
        </div>
      )}
    </main>
  );
}
