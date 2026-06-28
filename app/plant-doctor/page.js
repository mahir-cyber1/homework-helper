"use client";

import { useMemo, useState } from "react";
import styles from "./plant-doctor.module.css";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 1400;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const context = canvas.getContext("2d");
        if (!context) {
          resolve(reader.result);
          return;
        }

        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      img.onerror = () => resolve(reader.result);
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Confidence({ value }) {
  const label = value || "niedrig";
  return <span className={`${styles.confidence} ${styles[label]}`}>{label}</span>;
}

export default function PlantDoctorPage() {
  const [imageData, setImageData] = useState("");
  const [fileName, setFileName] = useState("");
  const [plantCorrection, setPlantCorrection] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => Boolean(imageData) && !isLoading, [imageData, isLoading]);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setResult(null);
    setFileName(file.name);
    setImageData(await readFileAsDataUrl(file));
  }

  async function analyzePlant(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/plant-diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData,
          userPlantName: plantCorrection,
          symptoms,
          location,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analyse fehlgeschlagen.");
      setResult(data.result);
    } catch (currentError) {
      setError(String(currentError?.message || currentError));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <span>Pflanzencheck</span>
          <h1>Blätter fotografieren, Ursache einschätzen.</h1>
        </div>
        <p>
          Die App erkennt zuerst die Pflanze, fragt dich nach einer Bestätigung
          und erklärt mögliche Krankbilder mit einfachen Maßnahmen.
        </p>
      </section>

      <form className={styles.workspace} onSubmit={analyzePlant}>
        <label className={styles.photoPicker}>
          <input
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            type="file"
          />
          {imageData ? (
            <img alt="Ausgewählte Pflanze" src={imageData} />
          ) : (
            <div>
              <strong>Foto aufnehmen</strong>
              <span>Blätter, Stängel und kranke Stellen möglichst scharf zeigen.</span>
            </div>
          )}
        </label>

        <div className={styles.controls}>
          <label>
            Pflanze korrigieren
            <input
              placeholder="z. B. Aprikose, Rose, Tomate"
              value={plantCorrection}
              onChange={(event) => setPlantCorrection(event.target.value)}
            />
          </label>

          <label>
            Beobachtung
            <textarea
              placeholder="z. B. gelbe Flecken, Blätter rollen sich, weißer Belag"
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
            />
          </label>

          <label>
            Standort
            <input
              placeholder="z. B. Balkon, Garten, Gewächshaus"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </label>

          <button disabled={!canSubmit} type="submit">
            {isLoading ? "Analysiere..." : "Pflanze prüfen"}
          </button>

          {fileName && <p className={styles.fileName}>{fileName}</p>}
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </form>

      {result && (
        <section className={styles.result}>
          <div className={styles.resultTop}>
            <div>
              <span>Erkannte Pflanze</span>
              <h2>{result.plantGuess}</h2>
            </div>
            <Confidence value={result.plantConfidence} />
          </div>

          <div className={styles.confirmBox}>
            <strong>{result.confirmQuestion}</strong>
            <p>
              Falls nicht: Namen oben eintragen und erneut prüfen. Die zweite
              Analyse nimmt deine Korrektur stärker.
            </p>
          </div>

          <div className={styles.grid}>
            <article>
              <h3>Sichtbare Symptome</h3>
              <ul>
                {result.visibleSymptoms?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article>
              <h3>Mögliche Ursachen</h3>
              <div className={styles.causes}>
                {result.possibleCauses?.map((cause) => (
                  <div key={`${cause.name}-${cause.why}`}>
                    <strong>{cause.name}</strong>
                    <Confidence value={cause.likelihood} />
                    <p>{cause.why}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className={styles.grid}>
            <article>
              <h3>Was du tun kannst</h3>
              <ol>
                {result.careSteps?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </article>

            <article>
              <h3>Vorbeugung</h3>
              <ul>
                {result.prevention?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <aside className={styles.notice}>
            <strong>{result.whenToAskExpert}</strong>
            <p>{result.disclaimer}</p>
          </aside>
        </section>
      )}
    </main>
  );
}
