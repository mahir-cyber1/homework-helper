"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import styles from "./sign-translate.module.css";

const TRAINING_KEY = "sign-translate-training-v1";
const MAX_SAMPLES = 48;
const CAPTURE_SIZE = 16;

const starterPhrases = [
  "Hallo",
  "Danke",
  "Ich brauche Hilfe",
  "Ja",
  "Nein",
];

function createId() {
  return window.crypto?.randomUUID?.() || String(Date.now());
}

function normalizeVector(vector) {
  if (!vector.length) return [];

  const average = vector.reduce((sum, value) => sum + value, 0) / vector.length;
  const variance =
    vector.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    vector.length;
  const deviation = Math.sqrt(variance) || 1;

  return vector.map((value) => Number(((value - average) / deviation).toFixed(4)));
}

function distance(left, right) {
  const length = Math.min(left.length, right.length);
  if (!length) return Number.POSITIVE_INFINITY;

  let total = 0;
  for (let index = 0; index < length; index += 1) {
    total += (left[index] - right[index]) ** 2;
  }

  return Math.sqrt(total / length);
}

function buildSuggestion(trainingEntries, featureVector, durationMs) {
  if (!featureVector.length) {
    return {
      text: "Keine Bewegung erkannt",
      confidence: 0,
      source: "empty",
    };
  }

  if (trainingEntries.length > 0) {
    const scored = trainingEntries
      .filter((entry) => Array.isArray(entry.features) && entry.features.length)
      .map((entry) => ({
        entry,
        score: distance(featureVector, entry.features),
      }))
      .sort((a, b) => a.score - b.score);

    const best = scored[0];
    if (best) {
      const confidence = Math.max(12, Math.round((1 - Math.min(best.score, 2) / 2) * 100));
      return {
        text: best.entry.text,
        confidence,
        source: "training",
      };
    }
  }

  const phraseIndex = Math.min(
    starterPhrases.length - 1,
    Math.floor((durationMs || 0) / 1200)
  );

  return {
    text: starterPhrases[phraseIndex],
    confidence: 18,
    source: "starter",
  };
}

function loadTrainingEntries() {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(window.localStorage.getItem(TRAINING_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveTrainingEntries(entries) {
  window.localStorage.setItem(TRAINING_KEY, JSON.stringify(entries));
}

export default function SignTranslatePage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const captureTimerRef = useRef(null);
  const liveResultTimerRef = useRef(null);
  const previousFrameRef = useRef(null);
  const samplesRef = useRef([]);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const videoUrlRef = useRef("");
  const router = useRouter();

  const [cameraState, setCameraState] = useState("idle");
  const [mode, setMode] = useState("live");
  const [isRecording, setIsRecording] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [trainingEntries, setTrainingEntries] = useState(() => loadTrainingEntries());
  const [currentResult, setCurrentResult] = useState(null);
  const [liveResult, setLiveResult] = useState({
    text: "Noch keine Live-Uebersetzung",
    confidence: 0,
  });
  const [correctedText, setCorrectedText] = useState("");
  const [status, setStatus] = useState("Kamera starten, dann eine kurze Gebaerde aufnehmen.");
  const [cloudStatus, setCloudStatus] = useState("Lokales Training aktiv.");
  const [videoUrl, setVideoUrl] = useState("");

  const learnedPhrases = useMemo(() => {
    const counts = new Map();
    trainingEntries.forEach((entry) => {
      counts.set(entry.text, (counts.get(entry.text) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [trainingEntries]);

  useEffect(() => {
    let cancelled = false;

    async function loadRemoteTraining() {
      if (!supabase) {
        setCloudStatus("Supabase ist noch nicht konfiguriert.");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setCloudStatus("Nicht eingeloggt: Korrekturen bleiben lokal.");
        return;
      }

      const response = await fetch("/api/sign-training", {
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
      });
      const payload = await response.json().catch(() => ({}));

      if (cancelled) return;

      if (!response.ok) {
        setCloudStatus(payload.error || "Cloud-Training nicht erreichbar.");
        return;
      }

      const remoteItems = Array.isArray(payload.items) ? payload.items : [];
      setTrainingEntries((current) => {
        const known = new Set(current.map((entry) => entry.id));
        const merged = [
          ...remoteItems.filter((entry) => !known.has(entry.id)),
          ...current,
        ].slice(0, 120);
        saveTrainingEntries(merged);
        return merged;
      });
      setCloudStatus(`Supabase verbunden: ${remoteItems.length} Beispiele geladen.`);
    }

    loadRemoteTraining();

    return () => {
      cancelled = true;
      window.clearInterval(captureTimerRef.current);
      window.clearInterval(liveResultTimerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextMode = new URLSearchParams(window.location.search).get("mode");
    setMode(nextMode === "train" ? "train" : "live");
  }, []);

  async function startCamera() {
    setStatus("Kamera wird gestartet...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraState("ready");
      setStatus("Bereit. Nimm 3 bis 8 Sekunden Gebaerdensprache auf.");
    } catch (error) {
      setCameraState("error");
      setStatus("Kamera konnte nicht gestartet werden. Bitte Browser-Berechtigung pruefen.");
    }
  }

  function sampleFrame() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const canvas = document.createElement("canvas");
    canvas.width = CAPTURE_SIZE;
    canvas.height = CAPTURE_SIZE;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    context.drawImage(video, 0, 0, CAPTURE_SIZE, CAPTURE_SIZE);
    const { data } = context.getImageData(0, 0, CAPTURE_SIZE, CAPTURE_SIZE);
    const frame = [];

    for (let index = 0; index < data.length; index += 4) {
      frame.push((data[index] + data[index + 1] + data[index + 2]) / 3 / 255);
    }

    if (previousFrameRef.current) {
      let motion = 0;
      for (let index = 0; index < frame.length; index += 1) {
        motion += Math.abs(frame[index] - previousFrameRef.current[index]);
      }
      samplesRef.current.push(motion / frame.length);
    }

    previousFrameRef.current = frame;
  }

  function startRecording() {
    if (!streamRef.current || isRecording) return;

    chunksRef.current = [];
    samplesRef.current = [];
    previousFrameRef.current = null;
    startedAtRef.current = Date.now();
    setCurrentResult(null);
    setCorrectedText("");
    setVideoUrl((oldUrl) => {
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      videoUrlRef.current = "";
      return "";
    });

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : undefined,
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      window.clearInterval(captureTimerRef.current);
      const durationMs = Date.now() - startedAtRef.current;
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const nextVideoUrl = URL.createObjectURL(blob);
      videoUrlRef.current = nextVideoUrl;
      const features = normalizeVector(samplesRef.current.slice(0, MAX_SAMPLES));
      const suggestion = buildSuggestion(trainingEntries, features, durationMs);

      setVideoUrl(nextVideoUrl);
      setCurrentResult({
        ...suggestion,
        features,
        durationMs,
        createdAt: new Date().toISOString(),
      });
      setCorrectedText(suggestion.text);
      setStatus(
        suggestion.source === "training"
          ? "Vorschlag aus deinen gespeicherten Trainingsbeispielen."
          : "Erster Vorschlag. Korrigiere ihn, damit die App lernen kann."
      );
      setIsRecording(false);
    };

    recorderRef.current = recorder;
    recorder.start();
    captureTimerRef.current = window.setInterval(sampleFrame, 220);
    setIsRecording(true);
    setStatus("Aufnahme laeuft...");
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  function startLiveMode() {
    if (!streamRef.current || isLive) return;

    samplesRef.current = [];
    previousFrameRef.current = null;
    startedAtRef.current = Date.now();
    setIsLive(true);
    setLiveResult({ text: "Ich hoere zu...", confidence: 0 });
    setStatus("Live-Modus laeuft. Die App vergleicht Bewegungen mit gespeicherten Trainingsbeispielen.");

    captureTimerRef.current = window.setInterval(sampleFrame, 180);
    liveResultTimerRef.current = window.setInterval(() => {
      const recentSamples = samplesRef.current.slice(-MAX_SAMPLES);
      const features = normalizeVector(recentSamples);
      const durationMs = Date.now() - startedAtRef.current;
      const suggestion = buildSuggestion(trainingEntries, features, durationMs);

      setLiveResult(suggestion);
    }, 1800);
  }

  function stopLiveMode() {
    window.clearInterval(captureTimerRef.current);
    window.clearInterval(liveResultTimerRef.current);
    setIsLive(false);
    setStatus("Live-Modus gestoppt.");
  }

  function switchMode(nextMode) {
    if (isRecording) stopRecording();
    if (isLive) stopLiveMode();
    setMode(nextMode);
    router.push(`/gebaerdensprache?mode=${nextMode}`);
  }

  async function saveCorrection() {
    const text = correctedText.trim();
    if (!text || !currentResult?.features?.length) {
      setStatus("Bitte zuerst aufnehmen und den richtigen Text eintragen.");
      return;
    }

    const nextEntry = {
      id: createId(),
      text,
      features: currentResult.features,
      durationMs: currentResult.durationMs,
      createdAt: new Date().toISOString(),
    };

    const nextEntries = [nextEntry, ...trainingEntries].slice(0, 120);
    saveTrainingEntries(nextEntries);
    setTrainingEntries(nextEntries);
    setStatus("Korrektur lokal gespeichert. Die naechste aehnliche Gebaerde kann besser erkannt werden.");

    if (!supabase) {
      setCloudStatus("Supabase ist noch nicht konfiguriert.");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setCloudStatus("Nicht eingeloggt: Korrektur wurde nur lokal gespeichert.");
      return;
    }

    const response = await fetch("/api/sign-training", {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text,
        features: currentResult.features,
        durationMs: currentResult.durationMs,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setCloudStatus(payload.error || "Supabase-Speichern fehlgeschlagen.");
      return;
    }

    setCloudStatus("Korrektur auch in Supabase gespeichert.");
  }

  function clearTraining() {
    saveTrainingEntries([]);
    setTrainingEntries([]);
    setStatus("Trainingsbeispiele geloescht.");
  }

  function exportTraining() {
    const payload = {
      project: "sign-translate-training",
      language: "DGS",
      exportedAt: new Date().toISOString(),
      entries: trainingEntries,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gebaerden-training.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <span>DGS Prototyp</span>
        <h1>
          {mode === "live"
            ? "Live uebersetzen mit deinen Trainingsdaten."
            : "Video aufnehmen, Text korrigieren, App trainieren."}
        </h1>
        <p>
          {mode === "live"
            ? "Der Live-Modus nutzt die gespeicherten Korrekturen als einfache Wiedererkennung."
            : "Der Trainingsmodus sammelt korrigierte Beispiele lokal und in Supabase."}
        </p>
      </section>

      <div className={styles.modeTabs} role="tablist" aria-label="Modus">
        <button
          type="button"
          className={mode === "live" ? styles.activeMode : ""}
          onClick={() => switchMode("live")}
        >
          Live
        </button>
        <button
          type="button"
          className={mode === "train" ? styles.activeMode : ""}
          onClick={() => switchMode("train")}
        >
          Training
        </button>
      </div>

      <section className={styles.cameraPanel} aria-label="Kamera und Aufnahme">
        <div className={styles.videoFrame}>
          <video ref={videoRef} autoPlay muted playsInline />
          {cameraState !== "ready" && (
            <div className={styles.videoOverlay}>
              <strong>Kamera bereit machen</strong>
              <span>Haende, Oberkoerper und Gesicht gut sichtbar positionieren.</span>
            </div>
          )}
          {isRecording && <div className={styles.recordingDot}>REC</div>}
        </div>

        <div className={styles.controls}>
          {cameraState !== "ready" ? (
            <button type="button" onClick={startCamera} className={styles.primaryButton}>
              Kamera starten
            </button>
          ) : mode === "live" ? (
            <button
              type="button"
              onClick={isLive ? stopLiveMode : startLiveMode}
              className={isLive ? styles.stopButton : styles.primaryButton}
            >
              {isLive ? "Live stoppen" : "Live starten"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={isRecording ? styles.stopButton : styles.primaryButton}
              >
                {isRecording ? "Aufnahme stoppen" : "Aufnahme starten"}
              </button>
              <button
                type="button"
                onClick={startRecording}
                disabled={isRecording}
                className={styles.secondaryButton}
              >
                Neu aufnehmen
              </button>
            </>
          )}
        </div>

        <p className={styles.status}>{status}</p>
        <p className={styles.cloudStatus}>{cloudStatus}</p>
      </section>

      {mode === "live" ? (
        <section className={styles.livePanel}>
          <div className={styles.panelHeader}>
            <span>Live Text</span>
            <strong>{liveResult.confidence || 0}%</strong>
          </div>
          <p className={styles.liveText}>{liveResult.text}</p>
          <p className={styles.emptyState}>
            Wenn der Live-Text falsch ist, wechsle in Training, nimm die
            Gebaerde auf und speichere die richtige Bedeutung.
          </p>
        </section>
      ) : (
      <section className={styles.resultGrid}>
        <div className={styles.resultPanel}>
          <div className={styles.panelHeader}>
            <span>Uebersetzung</span>
            {currentResult && <strong>{currentResult.confidence}%</strong>}
          </div>

          {videoUrl && (
            <video className={styles.playback} src={videoUrl} controls playsInline />
          )}

          <label className={styles.textLabel} htmlFor="correction">
            Korrigierter Text
          </label>
          <textarea
            id="correction"
            value={correctedText}
            onChange={(event) => setCorrectedText(event.target.value)}
            placeholder="Hier steht der erkannte oder korrigierte Text..."
            rows={5}
          />

          <button
            type="button"
            onClick={saveCorrection}
            disabled={!currentResult}
            className={styles.saveButton}
          >
            Als richtig speichern
          </button>
        </div>

        <div className={styles.trainingPanel}>
          <div className={styles.panelHeader}>
            <span>Training</span>
            <strong>{trainingEntries.length}</strong>
          </div>

          {learnedPhrases.length > 0 ? (
            <div className={styles.phraseList}>
              {learnedPhrases.map(([phrase, count]) => (
                <div key={phrase} className={styles.phraseItem}>
                  <span>{phrase}</span>
                  <strong>{count}x</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>
              Noch keine Trainingsdaten. Speichere ein paar korrigierte Aufnahmen.
            </p>
          )}

          <div className={styles.trainingActions}>
            <button type="button" onClick={exportTraining} disabled={!trainingEntries.length}>
              Export
            </button>
            <button type="button" onClick={clearTraining} disabled={!trainingEntries.length}>
              Loeschen
            </button>
          </div>
        </div>
      </section>
      )}
    </main>
  );
}
