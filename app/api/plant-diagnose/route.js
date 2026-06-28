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
      { error: "Limit erreicht. Bitte in 1 Stunde erneut versuchen." },
      { status: 429 }
    );
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY fehlt in den Umgebungsvariablen." },
        { status: 500 }
      );
    }

    const { imageData, userPlantName, symptoms, location } = await req.json();

    if (!imageData) {
      return Response.json(
        { error: "Bitte ein Foto der Pflanze hochladen." },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const correctionText = userPlantName
      ? `Der Nutzer meint oder korrigiert: ${userPlantName}`
      : "Der Nutzer hat die Pflanzenart noch nicht korrigiert.";

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `
Du bist ein vorsichtiger Pflanzen- und Baumdiagnose-Assistent für Hobbygärtner.
Antworte auf Deutsch.

Regeln:
- Erkenne zuerst die wahrscheinlich sichtbare Pflanze oder den Baum.
- Nenne Unsicherheit klar, wenn das Foto nicht reicht.
- Prüfe sichtbare Blattsymptome: Flecken, Kräuselung, Löcher, Beläge, Vergilbung, Trockenschäden, Fraßspuren.
- Gib mögliche Krankbilder oder Schadursachen, aber keine absolute Diagnose.
- Gib praktische, sichere Maßnahmen für Garten und Balkon.
- Empfiehl bei starkem Befall, essbaren Pflanzen oder unklaren Mitteln eine lokale Gärtnerei, Pflanzenschutzberatung oder Fachstelle.
- Erfinde keine Live-Internetsuche und keine konkreten Webquellen. Diese App-Version nutzt Bildanalyse und botanisches Wissen.
- Keine gefährlichen Chemikalienmischungen, keine übertriebenen Pestizidempfehlungen.

Gib ausschließlich valides JSON mit genau diesen Feldern zurück:
{
  "plantGuess": "kurzer Name",
  "plantConfidence": "niedrig|mittel|hoch",
  "confirmQuestion": "kurze Frage, ob die Pflanze stimmt",
  "visibleSymptoms": ["..."],
  "possibleCauses": [
    {
      "name": "Krankbild oder Ursache",
      "likelihood": "niedrig|mittel|hoch",
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
Zusatzangaben des Nutzers: ${symptoms || "(keine)"}
Standort/Kontext: ${location || "(nicht angegeben)"}

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
