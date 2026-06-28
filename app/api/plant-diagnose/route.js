import OpenAI from "openai";

export const runtime = "nodejs";

const requestLimit = new Map();

function getJsonFromText(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

const languageSettings = {
  de: {
    name: "Deutsch",
    none: "(keine)",
    noLocation: "(nicht angegeben)",
    noCorrection: "Der Nutzer hat die Pflanzenart noch nicht korrigiert.",
    correctionPrefix: "Der Nutzer meint oder korrigiert",
    missingImage: "Bitte ein Foto der Pflanze hochladen.",
    limit: "Limit erreicht. Bitte in 1 Stunde erneut versuchen.",
    missingKey: "OPENAI_API_KEY fehlt in den Umgebungsvariablen.",
  },
  en: {
    name: "English",
    none: "(none)",
    noLocation: "(not provided)",
    noCorrection: "The user has not corrected the plant species yet.",
    correctionPrefix: "The user thinks or corrects",
    missingImage: "Please upload a photo of the plant.",
    limit: "Limit reached. Please try again in 1 hour.",
    missingKey: "OPENAI_API_KEY is missing from the environment variables.",
  },
  tr: {
    name: "Türkçe",
    none: "(yok)",
    noLocation: "(belirtilmedi)",
    noCorrection: "Kullanıcı bitki türünü henüz düzeltmedi.",
    correctionPrefix: "Kullanıcı şöyle düşünüyor veya düzeltiyor",
    missingImage: "Lütfen bitkinin bir fotoğrafını yükle.",
    limit: "Limit doldu. Lütfen 1 saat sonra tekrar dene.",
    missingKey: "OPENAI_API_KEY ortam değişkenlerinde eksik.",
  },
};

export async function POST(req) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";

  const now = Date.now();
  const hour = 60 * 60 * 1000;
  let entry = requestLimit.get(ip);
  if (!entry) entry = { count: 0, resetAt: now + hour };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + hour;
  }

  entry.count += 1;
  requestLimit.set(ip, entry);

  if (entry.count > 20) {
    return Response.json(
      { error: languageSettings.de.limit },
      { status: 429 }
    );
  }

  try {
    const {
      imageData,
      userPlantName,
      symptoms,
      location,
      language = "de",
    } = await req.json();
    const selectedLanguage = languageSettings[language] || languageSettings.de;

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: selectedLanguage.missingKey },
        { status: 500 }
      );
    }

    if (!imageData) {
      return Response.json(
        { error: selectedLanguage.missingImage },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const correctionText = userPlantName
      ? `${selectedLanguage.correctionPrefix}: ${userPlantName}`
      : selectedLanguage.noCorrection;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `
Du bist ein vorsichtiger Pflanzen- und Baumdiagnose-Assistent für Hobbygärtner.
Antworte vollständig auf: ${selectedLanguage.name}.

Regeln:
- Erkenne zuerst die wahrscheinlich sichtbare Pflanze oder den Baum.
- Nenne Unsicherheit klar, wenn das Foto nicht reicht.
- Prüfe sichtbare Blattsymptome: Flecken, Kräuselung, Löcher, Beläge, Vergilbung, Trockenschäden, Fraßspuren.
- Gib mögliche Krankbilder oder Schadursachen, aber keine absolute Diagnose.
- Gib praktische, sichere Maßnahmen für Garten und Balkon.
- Empfiehl bei starkem Befall, essbaren Pflanzen oder unklaren Mitteln eine lokale Gärtnerei, Pflanzenschutzberatung oder Fachstelle.
- Erfinde keine Live-Internetsuche und keine konkreten Webquellen. Diese App-Version nutzt Bildanalyse und botanisches Wissen.
- Keine gefährlichen Chemikalienmischungen, keine übertriebenen Pestizidempfehlungen.
- Wenn der Nutzer Text in einer anderen Sprache eingibt, übersetze und beantworte trotzdem auf ${selectedLanguage.name}.
- Textwerte wie Namen, Begründungen, Schritte, Fragen und Hinweise müssen auf ${selectedLanguage.name} sein.
- Die Felder "plantConfidence" und "likelihood" müssen immer exakt einen dieser englischen Codes enthalten: "low", "medium", "high".

Gib ausschließlich valides JSON mit genau diesen Feldern zurück:
{
  "plantGuess": "kurzer Name",
  "plantConfidence": "low|medium|high",
  "confirmQuestion": "kurze Frage, ob die Pflanze stimmt",
  "visibleSymptoms": ["..."],
  "possibleCauses": [
    {
      "name": "Krankbild oder Ursache",
      "likelihood": "low|medium|high",
      "why": "kurze Begründung"
    }
  ],
  "careSteps": ["konkreter Schritt"],
  "prevention": ["konkreter Vorbeugeschritt"],
  "whenToAskExpert": "ein kurzer Satz",
  "disclaimer": "kurzer Hinweis, dass es eine Foto-Einschätzung ist"
}
`,
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
${correctionText}
Zusatzangaben des Nutzers: ${symptoms || selectedLanguage.none}
Standort/Kontext: ${location || selectedLanguage.noLocation}

Analysiere das Foto und berücksichtige eine Nutzer-Korrektur stärker als deine erste Pflanzenerkennung.
`,
            },
            {
              type: "input_image",
              image_url: imageData,
            },
          ],
        },
      ],
    });

    const raw = response.output_text || "";
    const result = getJsonFromText(raw);

    return Response.json({ result });
  } catch (error) {
    console.error("PLANT DIAGNOSE API ERROR:", error);
    return Response.json(
      { error: String(error?.message || error) },
      { status: 500 }
    );
  }
}
