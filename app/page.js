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
          setImageData(compressed);
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
