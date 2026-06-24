"use client";

import { useEffect, useRef, useState } from "react";

const NOTES = [
  { id: "c4", label: "C", staffStep: -2 },
  { id: "d4", label: "D", staffStep: -1 },
  { id: "e4", label: "E", staffStep: 0 },
  { id: "f4", label: "F", staffStep: 1 },
  { id: "g4", label: "G", staffStep: 2 },
  { id: "a4", label: "A", staffStep: 3 },
  { id: "b4", label: "H", staffStep: 4 },
  { id: "c5", label: "C", staffStep: 5 },
];

const SONGS = [
  {
    id: "joy",
    name: "Ode an die Freude",
    notes: [
      "e4", "e4", "f4", "g4", "g4", "f4", "e4", "d4",
      "c4", "c4", "d4", "e4", "e4", "d4", "d4",
    ],
  },
  {
    id: "star",
    name: "Funkel, funkel kleiner Stern",
    notes: [
      "c4", "c4", "g4", "g4", "a4", "a4", "g4",
      "f4", "f4", "e4", "e4", "d4", "d4", "c4",
    ],
  },
  {
    id: "bells",
    name: "Bruder Jakob",
    notes: [
      "c4", "d4", "e4", "c4", "c4", "d4", "e4", "c4",
      "e4", "f4", "g4", "e4", "f4", "g4",
    ],
  },
];

const ROUND_COUNT = 10;
const BEST_SCORE_KEY = "homework-helper-music-best-score";

function getRandomNote(previousId) {
  const choices = NOTES.filter((note) => note.id !== previousId);
  return choices[Math.floor(Math.random() * choices.length)];
}

function getNote(noteId) {
  return NOTES.find((note) => note.id === noteId) || NOTES[0];
}

function NoteStaff({ note }) {
  const bottom = 24 + note.staffStep * 8;

  return (
    <div className="note-staff" aria-label="Notensystem">
      <span className="note-staff__clef" aria-hidden="true">𝄞</span>
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
      <span className="note-staff__note" style={{ bottom }}>
        <span className="note-staff__head" />
        <span className="note-staff__stem" />
      </span>
    </div>
  );
}

function Piano({ onNote, selectedId = "", correctId = "" }) {
  return (
    <>
      <section className="piano" aria-label="Klaviatur">
        {NOTES.map((note) => (
          <button
            key={note.id}
            className={`piano__key${
              selectedId === note.id ? " is-selected" : ""
            }${correctId === note.id ? " is-correct" : ""}`}
            onClick={() => onNote(note)}
            aria-label={`Klaviernote ${note.label} ${note.id.endsWith("5") ? "hoch" : ""}`.trim()}
          >
            <span>{note.label}</span>
          </button>
        ))}
      </section>
      <section className="music-note-names" aria-hidden="true">
        {NOTES.map((note) => <span key={note.id}>{note.label}</span>)}
      </section>
    </>
  );
}

function FallingNotes({ song, position }) {
  const upcoming = song.notes.slice(position, position + 6);

  return (
    <div className="falling-notes" aria-label="Kommende Liednoten">
      <div className="falling-notes__target">Hier spielen</div>
      {NOTES.map((note) => (
        <span className="falling-notes__lane" key={note.id} />
      ))}
      {upcoming.map((noteId, index) => {
        const noteIndex = NOTES.findIndex((note) => note.id === noteId);

        return (
          <span
            className={`falling-notes__note${index === 0 ? " is-next" : ""}`}
            key={`${position}-${index}-${noteId}`}
            style={{
              left: `${(noteIndex + 0.5) * 12.5}%`,
              bottom: `${18 + index * 27}px`,
            }}
          >
            {getNote(noteId).label}
          </span>
        );
      })}
    </div>
  );
}

export default function MusicPage() {
  const [mode, setMode] = useState("quiz");
  const [target, setTarget] = useState(NOTES[0]);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [finished, setFinished] = useState(false);
  const [soundMessage, setSoundMessage] = useState("");
  const [songId, setSongId] = useState(SONGS[0].id);
  const [songPosition, setSongPosition] = useState(0);
  const [songMistakes, setSongMistakes] = useState(0);
  const audioElementRef = useRef(null);
  const audioElementsRef = useRef(new Map());

  const song = SONGS.find((item) => item.id === songId) || SONGS[0];
  const songFinished = songPosition >= song.notes.length;

  useEffect(() => {
    const audioElements = audioElementsRef.current;
    const initialize = window.setTimeout(() => {
      setBestScore(Number(localStorage.getItem(BEST_SCORE_KEY) || 0));
      setTarget(getRandomNote(""));

      for (const note of NOTES) {
        const audio = new Audio(`/sounds/piano-${note.id}.wav`);
        audio.preload = "auto";
        audio.load();
        audioElements.set(note.id, audio);
      }
    }, 0);

    return () => {
      window.clearTimeout(initialize);
      audioElementRef.current?.pause();
      for (const audio of audioElements.values()) audio.pause();
      audioElements.clear();
    };
  }, []);

  async function playNote(note) {
    try {
      audioElementRef.current?.pause();
      const audio =
        audioElementsRef.current.get(note.id) ||
        new Audio(`/sounds/piano-${note.id}.wav`);
      audio.currentTime = 0;
      audio.volume = 1;
      audioElementRef.current = audio;
      await audio.play();
      setSoundMessage("");
    } catch {
      setSoundMessage(
        "Bitte Medienlautstärke erhöhen und den Stummmodus ausschalten."
      );
    }
  }

  function restartQuiz() {
    setTarget(getRandomNote(target.id));
    setRound(1);
    setScore(0);
    setStreak(0);
    setFeedback("");
    setSelectedId("");
    setFinished(false);
  }

  async function playQuizNote(note) {
    if (selectedId || finished) return;
    await playNote(note);
    setSelectedId(note.id);
    const correct = note.id === target.id;
    const nextScore = score + (correct ? 1 : 0);
    setScore(nextScore);
    setStreak(correct ? streak + 1 : 0);
    setFeedback(correct ? "Richtig!" : `Das war ${target.label}.`);

    if (!correct) window.setTimeout(() => playNote(target), 350);

    window.setTimeout(() => {
      if (round >= ROUND_COUNT) {
        setFinished(true);
        if (nextScore > bestScore) {
          setBestScore(nextScore);
          localStorage.setItem(BEST_SCORE_KEY, String(nextScore));
        }
        return;
      }
      setTarget(getRandomNote(target.id));
      setRound((current) => current + 1);
      setSelectedId("");
      setFeedback("");
    }, 900);
  }

  async function playFreeNote(note) {
    setSelectedId(note.id);
    await playNote(note);
    window.setTimeout(() => setSelectedId(""), 180);
  }

  async function playSongNote(note) {
    if (songFinished) return;
    await playNote(note);
    setSelectedId(note.id);
    const expectedId = song.notes[songPosition];

    if (note.id === expectedId) {
      setFeedback("Super, weiter!");
      setSongPosition((current) => current + 1);
    } else {
      setFeedback(`Versuche ${getNote(expectedId).label}.`);
      setSongMistakes((current) => current + 1);
    }

    window.setTimeout(() => setSelectedId(""), 180);
  }

  function resetSong(nextSongId = songId) {
    setSongId(nextSongId);
    setSongPosition(0);
    setSongMistakes(0);
    setFeedback("");
    setSelectedId("");
  }

  return (
    <main className="music-page">
      <button
        className="music-back-button"
        onClick={() => {
          window.location.href = "/profile";
        }}
        aria-label="Zurück zum Profil"
      >
        <span aria-hidden="true">‹</span>
        Profil
      </button>

      <header className="music-header">
        <div>
          <span>Musikwerkstatt</span>
          <h1>Klavier spielen</h1>
        </div>
        {mode === "quiz" && (
          <div className="music-best">
            <strong>{bestScore}/{ROUND_COUNT}</strong>
            <span>Bestwert</span>
          </div>
        )}
      </header>

      <div className="music-modes" role="tablist" aria-label="Musikmodus">
        <button className={mode === "quiz" ? "is-active" : ""} onClick={() => setMode("quiz")}>Quiz</button>
        <button className={mode === "free" ? "is-active" : ""} onClick={() => setMode("free")}>Klavier</button>
        <button className={mode === "song" ? "is-active" : ""} onClick={() => setMode("song")}>Lieder</button>
      </div>

      {soundMessage && <p className="music-sound-message">{soundMessage}</p>}

      {mode === "quiz" && (
        <>
          <section className="music-scoreboard">
            <div><strong>{finished ? ROUND_COUNT : round}/{ROUND_COUNT}</strong><span>Runde</span></div>
            <div><strong>{score}</strong><span>Richtig</span></div>
            <div><strong>{streak}</strong><span>Serie</span></div>
          </section>
          <section className="music-challenge">
            <div className="music-challenge__top">
              <h2>{finished ? "Training geschafft" : "Welche Note ist das?"}</h2>
              {!finished && <button className="music-listen-button" onClick={() => playNote(target)} aria-label="Gesuchten Ton anhören">♪</button>}
            </div>
            {finished ? (
              <div className="music-result">
                <strong>{score}/{ROUND_COUNT}</strong>
                <p>{score} Noten richtig erkannt</p>
                <button onClick={restartQuiz}>Noch einmal</button>
              </div>
            ) : (
              <>
                <NoteStaff note={target} />
                <p className={`music-feedback${feedback === "Richtig!" ? " is-correct" : ""}`}>
                  {feedback || "Drücke die passende Taste."}
                </p>
              </>
            )}
          </section>
          {!finished && <Piano onNote={playQuizNote} selectedId={selectedId} correctId={selectedId ? target.id : ""} />}
        </>
      )}

      {mode === "free" && (
        <>
          <section className="free-piano-intro">
            <span aria-hidden="true">♫</span>
            <div>
              <h2>Freies Klavier</h2>
              <p>Spiele deine eigene Melodie.</p>
            </div>
          </section>
          <Piano onNote={playFreeNote} selectedId={selectedId} />
        </>
      )}

      {mode === "song" && (
        <>
          <label className="song-picker">
            Lied auswählen
            <select value={songId} onChange={(event) => resetSong(event.target.value)}>
              {SONGS.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
          </label>
          <section className="song-status">
            <strong>{song.name}</strong>
            <span>{Math.min(songPosition, song.notes.length)} / {song.notes.length} Noten · {songMistakes} Fehler</span>
          </section>
          {songFinished ? (
            <section className="song-finished">
              <strong>Geschafft!</strong>
              <p>Du hast das ganze Lied gespielt.</p>
              <button onClick={() => resetSong()}>Noch einmal spielen</button>
            </section>
          ) : (
            <>
              <FallingNotes song={song} position={songPosition} />
              <p className={`music-feedback${feedback === "Super, weiter!" ? " is-correct" : ""}`}>
                {feedback || "Spiele die unterste leuchtende Note."}
              </p>
              <Piano
                onNote={playSongNote}
                selectedId={selectedId}
                correctId={getNote(song.notes[songPosition]).id}
              />
            </>
          )}
        </>
      )}
    </main>
  );
}
