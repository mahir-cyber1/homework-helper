"use client";

import { useEffect, useRef, useState } from "react";
import { text, useAppLanguage } from "../../lib/i18n";

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
    name: { de: "Ode an die Freude", en: "Ode to Joy", tr: "Neşeye Övgü" },
    notes: [
      "e4", "e4", "f4", "g4", "g4", "f4", "e4", "d4",
      "c4", "c4", "d4", "e4", "e4", "d4", "d4",
    ],
  },
  {
    id: "star",
    name: { de: "Funkel, funkel kleiner Stern", en: "Twinkle, Twinkle, Little Star", tr: "Parla, Parla Küçük Yıldız" },
    notes: [
      "c4", "c4", "g4", "g4", "a4", "a4", "g4",
      "f4", "f4", "e4", "e4", "d4", "d4", "c4",
    ],
  },
  {
    id: "bells",
    name: { de: "Bruder Jakob", en: "Brother John", tr: "Frère Jacques" },
    notes: [
      "c4", "d4", "e4", "c4", "c4", "d4", "e4", "c4",
      "e4", "f4", "g4", "e4", "f4", "g4",
    ],
  },
];

const ROUND_COUNT = 10;
const BEST_SCORE_KEY = "homework-helper-music-best-score";
const MUSIC_TEXT = {
  de: {
    workshop: "Musikwerkstatt", title: "Klavier spielen", best: "Bestwert",
    quiz: "Quiz", piano: "Klavier", songs: "Lieder", round: "Runde",
    correct: "Richtig", streak: "Serie", done: "Training geschafft",
    which: "Welche Note ist das?", again: "Noch einmal", free: "Freies Klavier",
    melody: "Spiele deine eigene Melodie.", chooseSong: "Lied auswählen",
    mistakes: "Fehler", finished: "Geschafft!", wholeSong: "Du hast das ganze Lied gespielt.",
    playAgain: "Noch einmal spielen", nextNote: "Spiele die unterste leuchtende Note.",
    pressKey: "Drücke die passende Taste.", right: "Richtig!", continue: "Super, weiter!",
    tryNote: "Versuche", back: "Profil", sound: "Bitte Medienlautstärke erhöhen und den Stummmodus ausschalten.",
    target: "Hier spielen", notesCorrect: "Noten richtig erkannt",
  },
  en: {
    workshop: "Music workshop", title: "Play piano", best: "Best score",
    quiz: "Quiz", piano: "Piano", songs: "Songs", round: "Round",
    correct: "Correct", streak: "Streak", done: "Training complete",
    which: "Which note is this?", again: "Try again", free: "Free piano",
    melody: "Play your own melody.", chooseSong: "Choose a song",
    mistakes: "Mistakes", finished: "Well done!", wholeSong: "You played the whole song.",
    playAgain: "Play again", nextNote: "Play the lowest glowing note.",
    pressKey: "Press the matching key.", right: "Correct!", continue: "Great, keep going!",
    tryNote: "Try", back: "Profile", sound: "Please turn up media volume and disable silent mode.",
    target: "Play here", notesCorrect: "notes identified correctly",
  },
  tr: {
    workshop: "Müzik atölyesi", title: "Piyano çal", best: "En iyi",
    quiz: "Test", piano: "Piyano", songs: "Şarkılar", round: "Tur",
    correct: "Doğru", streak: "Seri", done: "Alıştırma tamamlandı",
    which: "Bu hangi nota?", again: "Tekrar dene", free: "Serbest piyano",
    melody: "Kendi melodini çal.", chooseSong: "Şarkı seç",
    mistakes: "Hata", finished: "Başardın!", wholeSong: "Şarkının tamamını çaldın.",
    playAgain: "Tekrar çal", nextNote: "En alttaki parlayan notayı çal.",
    pressKey: "Uygun tuşa bas.", right: "Doğru!", continue: "Harika, devam et!",
    tryNote: "Şunu dene", back: "Profil", sound: "Medya sesini yükselt ve sessiz modu kapat.",
    target: "Burada çal", notesCorrect: "nota doğru tanındı",
  },
};

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

function FallingNotes({ song, position, targetLabel }) {
  const upcoming = song.notes.slice(position, position + 6);

  return (
    <div className="falling-notes" aria-label="Kommende Liednoten">
      <div className="falling-notes__target">{targetLabel}</div>
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
  const { language } = useAppLanguage();
  const tx = text(MUSIC_TEXT, language);
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
        tx.sound
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
    setFeedback(correct ? tx.right : `${target.label}`);

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
      setFeedback(tx.continue);
      setSongPosition((current) => current + 1);
    } else {
      setFeedback(`${tx.tryNote} ${getNote(expectedId).label}.`);
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
        {tx.back}
      </button>

      <header className="music-header">
        <div>
          <span>{tx.workshop}</span>
          <h1>{tx.title}</h1>
        </div>
        {mode === "quiz" && (
          <div className="music-best">
            <strong>{bestScore}/{ROUND_COUNT}</strong>
            <span>{tx.best}</span>
          </div>
        )}
      </header>

      <div className="music-modes" role="tablist" aria-label="Musikmodus">
        <button className={mode === "quiz" ? "is-active" : ""} onClick={() => setMode("quiz")}>{tx.quiz}</button>
        <button className={mode === "free" ? "is-active" : ""} onClick={() => setMode("free")}>{tx.piano}</button>
        <button className={mode === "song" ? "is-active" : ""} onClick={() => setMode("song")}>{tx.songs}</button>
      </div>

      {soundMessage && <p className="music-sound-message">{soundMessage}</p>}

      {mode === "quiz" && (
        <>
          <section className="music-scoreboard">
            <div><strong>{finished ? ROUND_COUNT : round}/{ROUND_COUNT}</strong><span>{tx.round}</span></div>
            <div><strong>{score}</strong><span>{tx.correct}</span></div>
            <div><strong>{streak}</strong><span>{tx.streak}</span></div>
          </section>
          <section className="music-challenge">
            <div className="music-challenge__top">
              <h2>{finished ? tx.done : tx.which}</h2>
              {!finished && <button className="music-listen-button" onClick={() => playNote(target)} aria-label="Gesuchten Ton anhören">♪</button>}
            </div>
            {finished ? (
              <div className="music-result">
                <strong>{score}/{ROUND_COUNT}</strong>
                <p>{score} {tx.notesCorrect}</p>
                <button onClick={restartQuiz}>{tx.again}</button>
              </div>
            ) : (
              <>
                <NoteStaff note={target} />
                <p className={`music-feedback${feedback === tx.right ? " is-correct" : ""}`}>
                  {feedback || tx.pressKey}
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
              <h2>{tx.free}</h2>
              <p>{tx.melody}</p>
            </div>
          </section>
          <Piano onNote={playFreeNote} selectedId={selectedId} />
        </>
      )}

      {mode === "song" && (
        <>
          <label className="song-picker">
            {tx.chooseSong}
            <select value={songId} onChange={(event) => resetSong(event.target.value)}>
              {SONGS.map((item) => <option value={item.id} key={item.id}>{text(item.name, language)}</option>)}
            </select>
          </label>
          <section className="song-status">
            <strong>{text(song.name, language)}</strong>
            <span>{Math.min(songPosition, song.notes.length)} / {song.notes.length} · {songMistakes} {tx.mistakes}</span>
          </section>
          {songFinished ? (
            <section className="song-finished">
              <strong>{tx.finished}</strong>
              <p>{tx.wholeSong}</p>
              <button onClick={() => resetSong()}>{tx.playAgain}</button>
            </section>
          ) : (
            <>
              <FallingNotes song={song} position={songPosition} targetLabel={tx.target} />
              <p className={`music-feedback${feedback === tx.continue ? " is-correct" : ""}`}>
                {feedback || tx.nextNote}
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
