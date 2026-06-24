"use client";

import { useEffect, useRef, useState } from "react";

const NOTES = [
  { id: "c4", label: "C", frequency: 261.63, staffStep: -2 },
  { id: "d4", label: "D", frequency: 293.66, staffStep: -1 },
  { id: "e4", label: "E", frequency: 329.63, staffStep: 0 },
  { id: "f4", label: "F", frequency: 349.23, staffStep: 1 },
  { id: "g4", label: "G", frequency: 392.0, staffStep: 2 },
  { id: "a4", label: "A", frequency: 440.0, staffStep: 3 },
  { id: "b4", label: "H", frequency: 493.88, staffStep: 4 },
  { id: "c5", label: "C", frequency: 523.25, staffStep: 5 },
];

const ROUND_COUNT = 10;
const BEST_SCORE_KEY = "homework-helper-music-best-score";

function getRandomNote(previousId) {
  const choices = NOTES.filter((note) => note.id !== previousId);
  return choices[Math.floor(Math.random() * choices.length)];
}

function NoteStaff({ note }) {
  const bottom = 24 + note.staffStep * 8;

  return (
    <div className="note-staff" aria-label="Notensystem">
      <span className="note-staff__clef" aria-hidden="true">
        𝄞
      </span>
      {[0, 1, 2, 3, 4].map((line) => (
        <span
          className="note-staff__line"
          key={line}
          style={{ bottom: 32 + line * 16 }}
        />
      ))}
      {note.id === "c4" && (
        <span className="note-staff__ledger" style={{ bottom: 16 }} />
      )}
      <span
        className="note-staff__note"
        style={{ bottom }}
        aria-label="Gesuchte Note"
      >
        <span className="note-staff__head" />
        <span className="note-staff__stem" />
      </span>
    </div>
  );
}

export default function MusicPage() {
  const [target, setTarget] = useState(NOTES[0]);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [finished, setFinished] = useState(false);
  const audioContextRef = useRef(null);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const savedBest = Number(localStorage.getItem(BEST_SCORE_KEY) || 0);
      setBestScore(savedBest);
      setTarget(getRandomNote(""));
    }, 0);

    return () => {
      window.clearTimeout(initialize);
      audioContextRef.current?.close();
    };
  }, []);

  function playNote(note) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(note.frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.42, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.9);
  }

  function finishRound(nextScore) {
    setFinished(true);
    setFeedback(`${nextScore} von ${ROUND_COUNT} richtig`);

    if (nextScore > bestScore) {
      setBestScore(nextScore);
      localStorage.setItem(BEST_SCORE_KEY, String(nextScore));
    }
  }

  function selectNote(note) {
    if (selectedId || finished) return;

    playNote(note);
    setSelectedId(note.id);
    const correct = note.id === target.id;
    const nextScore = score + (correct ? 1 : 0);

    setScore(nextScore);
    setStreak(correct ? streak + 1 : 0);
    setFeedback(correct ? "Richtig!" : `Das war ${target.label}.`);

    window.setTimeout(() => {
      if (round >= ROUND_COUNT) {
        finishRound(nextScore);
        return;
      }

      setTarget(getRandomNote(target.id));
      setRound((current) => current + 1);
      setSelectedId("");
      setFeedback("");
    }, 900);
  }

  function restart() {
    setTarget(getRandomNote(target.id));
    setRound(1);
    setScore(0);
    setStreak(0);
    setFeedback("");
    setSelectedId("");
    setFinished(false);
  }

  return (
    <main className="music-page">
      <header className="music-header">
        <div>
          <span>Notentraining</span>
          <h1>Klavier üben</h1>
        </div>
        <div className="music-best">
          <strong>{bestScore}/{ROUND_COUNT}</strong>
          <span>Bestwert</span>
        </div>
      </header>

      <section className="music-scoreboard">
        <div>
          <strong>{finished ? ROUND_COUNT : round}/{ROUND_COUNT}</strong>
          <span>Runde</span>
        </div>
        <div>
          <strong>{score}</strong>
          <span>Richtig</span>
        </div>
        <div>
          <strong>{streak}</strong>
          <span>Serie</span>
        </div>
      </section>

      <section className="music-challenge">
        <div className="music-challenge__top">
          <h2>{finished ? "Training geschafft" : "Welche Note ist das?"}</h2>
          {!finished && (
            <button
              className="music-listen-button"
              onClick={() => playNote(target)}
              aria-label="Gesuchten Ton anhören"
              title="Ton anhören"
            >
              ♪
            </button>
          )}
        </div>

        {finished ? (
          <div className="music-result">
            <strong>{score}/{ROUND_COUNT}</strong>
            <p>{feedback}</p>
            <button onClick={restart}>Noch einmal</button>
          </div>
        ) : (
          <>
            <NoteStaff note={target} />
            <p
              className={`music-feedback${
                feedback.startsWith("Richtig") ? " is-correct" : ""
              }`}
              aria-live="polite"
            >
              {feedback || "Drücke die passende Taste."}
            </p>
          </>
        )}
      </section>

      {!finished && (
        <section className="piano" aria-label="Klaviatur">
          {NOTES.map((note) => {
            const selected = selectedId === note.id;
            const correct = selectedId && note.id === target.id;

            return (
              <button
                key={note.id}
                className={`piano__key${selected ? " is-selected" : ""}${
                  correct ? " is-correct" : ""
                }`}
                onClick={() => selectNote(note)}
                aria-label={`Klaviernote ${note.label}`}
              >
                <span>{note.label}</span>
              </button>
            );
          })}
        </section>
      )}

      <section className="music-note-names">
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>F</span>
        <span>G</span>
        <span>A</span>
        <span>H</span>
        <span>C</span>
      </section>
    </main>
  );
}
