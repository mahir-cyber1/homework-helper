"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getLeague } from "../lib/gamification";
import { getProfileAvatar } from "../lib/profileAvatars";

const FREE_USAGE_KEY = "homework-helper-free-task-used";
const ADMIN_EMAILS = ["genckurecikli@gmail.com"];

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
  const [subject, setSubject] = useState("Mathe");
  const [user, setUser] = useState(null);
  const [freeTaskUsed, setFreeTaskUsed] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarId, setAvatarId] = useState("star");
  const [gameStats, setGameStats] = useState(null);
  const [pointsMessage, setPointsMessage] = useState("");
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
  const isAdmin = user
    ? ADMIN_EMAILS.includes(String(user.email || "").trim().toLowerCase())
    : false;
  const currentAvatar = getProfileAvatar(isAdmin ? "spark" : avatarId);
  const currentLeague = gameStats?.league || getLeague(0);

  const getAccessToken = useCallback(async () => {
    if (!supabase) return "";

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }, []);

  const loadGameStats = useCallback(async () => {
    const token = await getAccessToken();

    if (!token) return;

    const res = await fetch("/api/gamification", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      setGameStats(data.stats);
    }
  }, [getAccessToken]);

  async function loadProfile(currentUser) {
    if (!supabase || !currentUser) return;

    const fallbackName =
      currentUser.user_metadata?.display_name ||
      currentUser.email?.split("@")[0] ||
      "";

    const { data } = await supabase
      .from("user_profiles")
      .select("display_name,avatar_id")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    const profileName = data?.display_name || fallbackName;
    const profileAvatarId = data?.avatar_id || "star";

    setDisplayName(profileName);
    setAvatarId(profileAvatarId);

    if (!data && profileName) {
      await supabase.from("user_profiles").upsert({
        user_id: currentUser.id,
        email: currentUser.email,
        display_name: profileName,
        avatar_id: profileAvatarId,
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
      await loadGameStats();
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
        loadGameStats();
      } else {
        setDisplayName("");
        setAvatarId("star");
        setGameStats(null);
      }
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, [loadGameStats]);

  async function handleSignOut() {
    if (!supabase) return;

    await supabase.auth.signOut();
    setUser(null);
    setDisplayName("");
    setAvatarId("star");
    setGameStats(null);
  }

  async function saveTaskToHistory(mode, savedAnswer) {
    if (!supabase || !user) return;

    const { error } = await supabase.from("homework_history").insert({
      user_id: user.id,
      grade,
      subject,
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

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade,
          subject,
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
          .replace(/^\s*RICHTIGE_AUFGABEN\s*:\s*\d+\s*$/gim, "")
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
                  subject,
                  grade,
                }),
              });

              if (pointsRes.ok) {
                const pointsData = await pointsRes.json();
                setGameStats(pointsData.stats);
                setPointsMessage(
                  pointsData.pointsAwarded > 0
                    ? `${pointsData.correctTaskCount} richtig geloest · +${pointsData.pointsAwarded} Punkte · ${pointsData.stats.league.name}`
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
        {user ? (
          <>
            <button
              onClick={() => {
                window.location.href = isAdmin ? "/admin" : "/profile";
              }}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "12px",
                border: "1px solid #333",
                backgroundColor: "#111",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  backgroundColor: currentAvatar.background,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 19,
                  flex: "0 0 auto",
                }}
              >
                {currentAvatar.icon}
              </span>
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: "#aaa",
                    marginBottom: 2,
                  }}
                >
                  {isAdmin ? "Admin" : "Profil"}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 15,
                    fontWeight: "bold",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isAdmin ? "Admin" : displayName || user.email}
                </span>
                {!isAdmin && (
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "#ddd",
                      marginTop: 3,
                    }}
                  >
                    {currentLeague.icon} {currentLeague.name} ·{" "}
                    {gameStats?.points || 0} Punkte
                  </span>
                )}
              </span>
            </button>
          </>
        ) : (
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
        )}
      </div>

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

      <div style={{ marginTop: 10, marginBottom: 16 }}>
        <label>{t.gradeLabel}: </label>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          style={{
            marginLeft: 8,
            padding: "8px",
            borderRadius: "8px",
            fontSize: "16px",
          }}
        >
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
        </select>

        <span style={{ marginLeft: 20 }}>{t.subjectLabel}: </span>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{
            marginLeft: 8,
            padding: "8px",
            borderRadius: "8px",
            fontSize: "16px",
          }}
        >
          <option value="Mathe">{t.subjectMath}</option>
          <option value="Deutsch">{t.subjectGerman}</option>
          <option value="Englisch">{t.subjectEnglish}</option>
        </select>
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
          <h3>{t.answerLabel}</h3>
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
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{answer}</pre>

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
