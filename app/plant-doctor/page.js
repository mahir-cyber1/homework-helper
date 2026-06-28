"use client";

import { useMemo, useState } from "react";
import { text, useAppLanguage } from "../../lib/i18n";
import styles from "./plant-doctor.module.css";

const translations = {
  languageLabel: {
    de: "Sprache",
    en: "Language",
    tr: "Dil",
  },
  badge: {
    de: "Pflanzencheck",
    en: "Plant check",
    tr: "Bitki kontrolü",
  },
  title: {
    de: "Blätter fotografieren, Ursache einschätzen.",
    en: "Photograph leaves, estimate the cause.",
    tr: "Yaprakları fotoğrafla, nedeni tahmin et.",
  },
  intro: {
    de: "Die App erkennt zuerst die Pflanze, fragt dich nach einer Bestätigung und erklärt mögliche Krankbilder mit einfachen Maßnahmen.",
    en: "The app first identifies the plant, asks you to confirm it, and explains possible problems with simple care steps.",
    tr: "Uygulama önce bitkiyi tanır, senden onay ister ve olası sorunları basit bakım adımlarıyla açıklar.",
  },
  photoAction: {
    de: "Foto aufnehmen",
    en: "Take photo",
    tr: "Fotoğraf çek",
  },
  photoHint: {
    de: "Blätter, Stängel und kranke Stellen möglichst scharf zeigen.",
    en: "Show leaves, stems, and affected areas as clearly as possible.",
    tr: "Yaprakları, sapları ve sorunlu bölgeleri mümkün olduğunca net göster.",
  },
  imageAlt: {
    de: "Ausgewählte Pflanze",
    en: "Selected plant",
    tr: "Seçilen bitki",
  },
  plantCorrection: {
    de: "Pflanze korrigieren",
    en: "Correct plant",
    tr: "Bitkiyi düzelt",
  },
  plantPlaceholder: {
    de: "z. B. Aprikose, Rose, Tomate",
    en: "e.g. apricot, rose, tomato",
    tr: "örn. kayısı, gül, domates",
  },
  symptoms: {
    de: "Beobachtung",
    en: "Observation",
    tr: "Gözlem",
  },
  symptomsPlaceholder: {
    de: "z. B. gelbe Flecken, Blätter rollen sich, weißer Belag",
    en: "e.g. yellow spots, curled leaves, white coating",
    tr: "örn. sarı lekeler, kıvrılan yapraklar, beyaz tabaka",
  },
  location: {
    de: "Standort",
    en: "Location",
    tr: "Konum",
  },
  locationPlaceholder: {
    de: "z. B. Balkon, Garten, Gewächshaus",
    en: "e.g. balcony, garden, greenhouse",
    tr: "örn. balkon, bahçe, sera",
  },
  submit: {
    de: "Pflanze prüfen",
    en: "Check plant",
    tr: "Bitkiyi kontrol et",
  },
  loading: {
    de: "Analysiere...",
    en: "Analyzing...",
    tr: "Analiz ediliyor...",
  },
  fallbackError: {
    de: "Analyse fehlgeschlagen.",
    en: "Analysis failed.",
    tr: "Analiz başarısız oldu.",
  },
  plantGuess: {
    de: "Erkannte Pflanze",
    en: "Detected plant",
    tr: "Tanınan bitki",
  },
  correctionHint: {
    de: "Falls nicht: Namen oben eintragen und erneut prüfen. Die zweite Analyse nimmt deine Korrektur stärker.",
    en: "If not: enter the correct name above and check again. The next analysis will weigh your correction more strongly.",
    tr: "Doğru değilse: yukarıya doğru adı yazıp tekrar kontrol et. Sonraki analiz düzeltmeni daha güçlü dikkate alır.",
  },
  visibleSymptoms: {
    de: "Sichtbare Symptome",
    en: "Visible symptoms",
    tr: "Görünen belirtiler",
  },
  possibleCauses: {
    de: "Mögliche Ursachen",
    en: "Possible causes",
    tr: "Olası nedenler",
  },
  careSteps: {
    de: "Was du tun kannst",
    en: "What you can do",
    tr: "Ne yapabilirsin",
  },
  prevention: {
    de: "Vorbeugung",
    en: "Prevention",
    tr: "Önleme",
  },
  confidence: {
    de: { low: "niedrig", medium: "mittel", high: "hoch" },
    en: { low: "low", medium: "medium", high: "high" },
    tr: { low: "düşük", medium: "orta", high: "yüksek" },
  },
};

const confidenceMap = {
  niedrig: "low",
  mittel: "medium",
  hoch: "high",
  low: "low",
  medium: "medium",
  high: "high",
  dusuk: "low",
  "düşük": "low",
  orta: "medium",
  yuksek: "high",
  "yüksek": "high",
};

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

function Confidence({ language, value }) {
  const normalized = confidenceMap[String(value || "").toLowerCase()] || "low";
  const label =
    translations.confidence[language]?.[normalized] ||
    translations.confidence.de[normalized];

  return (
    <span className={`${styles.confidence} ${styles[normalized]}`}>
      {label}
    </span>
  );
}

export default function PlantDoctorPage() {
  const { language, setLanguage } = useAppLanguage();
  const [imageData, setImageData] = useState("");
  const [fileName, setFileName] = useState("");
  const [plantCorrection, setPlantCorrection] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(
    () => Boolean(imageData) && !isLoading,
    [imageData, isLoading]
  );
  const t = (key) => text(translations[key], language);

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
          language,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("fallbackError"));
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
          <div className={styles.topLine}>
            <span>{t("badge")}</span>
            <label className={styles.languagePicker}>
              {t("languageLabel")}
              <select
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value);
                  setResult(null);
                }}
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
                <option value="tr">Türkçe</option>
              </select>
            </label>
          </div>
          <h1>{t("title")}</h1>
        </div>
        <p>{t("intro")}</p>
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
            <img alt={t("imageAlt")} src={imageData} />
          ) : (
            <div>
              <strong>{t("photoAction")}</strong>
              <span>{t("photoHint")}</span>
            </div>
          )}
        </label>

        <div className={styles.controls}>
          <label>
            {t("plantCorrection")}
            <input
              placeholder={t("plantPlaceholder")}
              value={plantCorrection}
              onChange={(event) => setPlantCorrection(event.target.value)}
            />
          </label>

          <label>
            {t("symptoms")}
            <textarea
              placeholder={t("symptomsPlaceholder")}
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
            />
          </label>

          <label>
            {t("location")}
            <input
              placeholder={t("locationPlaceholder")}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </label>

          <button disabled={!canSubmit} type="submit">
            {isLoading ? t("loading") : t("submit")}
          </button>

          {fileName && <p className={styles.fileName}>{fileName}</p>}
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </form>

      {result && (
        <section className={styles.result}>
          <div className={styles.resultTop}>
            <div>
              <span>{t("plantGuess")}</span>
              <h2>{result.plantGuess}</h2>
            </div>
            <Confidence language={language} value={result.plantConfidence} />
          </div>

          <div className={styles.confirmBox}>
            <strong>{result.confirmQuestion}</strong>
            <p>{t("correctionHint")}</p>
          </div>

          <div className={styles.grid}>
            <article>
              <h3>{t("visibleSymptoms")}</h3>
              <ul>
                {result.visibleSymptoms?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article>
              <h3>{t("possibleCauses")}</h3>
              <div className={styles.causes}>
                {result.possibleCauses?.map((cause) => (
                  <div key={`${cause.name}-${cause.why}`}>
                    <strong>{cause.name}</strong>
                    <Confidence language={language} value={cause.likelihood} />
                    <p>{cause.why}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className={styles.grid}>
            <article>
              <h3>{t("careSteps")}</h3>
              <ol>
                {result.careSteps?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </article>

            <article>
              <h3>{t("prevention")}</h3>
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
