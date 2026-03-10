import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// simples Limit: 20 Requests/Stunde pro IP (nur für DEV ok)
const requestLimit = new Map();

export async function POST(req) {
  // Rate limit
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
    const { grade, subject, task, imageData, mode, language } = await req.json();
const languageNames = {
  de: "Deutsch",
  tr: "Türkisch",
  en: "English",
};

const selectedLanguage = languageNames[language] || "Deutsch";
    if (!grade || !subject) {
      return Response.json(
        { error: "Bitte Klasse und Fach angeben." },
        { status: 400 }
      );
    }
    if (!task && !imageData) {
      return Response.json(
        { error: "Bitte Text eingeben oder ein Bild hochladen." },
        { status: 400 }
      );
    }

    const system = `
Du bist ein Lern-Tutor für Kinder der Klassen 4 bis 6.
- Bei Aufgabe 1: Liste ALLE einzelnen Sätze/Lücken (jede Zeile = eine eigene Einzelaufgabe).
- Bei Aufgabe 2: Liste ALLE Übersetzungszeilen (jede Zeile = eine eigene Einzelaufgabe).
WICHTIG BEI ARBEITSBLÄTTERN:

1. Erkenne zuerst die Hauptaufgabe (Überschrift).
2. Danach erkenne ALLE einzelnen Aufgaben darunter.

Erkenne besonders:
- nummerierte Aufgaben (1., 2., 3., 4., 5.)
- Listen mit mehreren Zeilen
- Lückensätze
- Übersetzungslisten

Wenn ein Arbeitsblatt mehrere Aufgaben enthält, strukturiere so:

AUFGABEN:

Aufgabe 1: Fill in the right preposition
Einzelaufgaben:
1. ...
2. ...
3. ...
4. ...
5. ...

Aufgabe 2: Put the following expressions into English
Einzelaufgaben:
1. ...
2. ...
3. ...
4. ...
5. ...
6. ...
7. ...
8. ...

Regeln:
- Jede einzelne Zeile ist eine eigene Aufgabe.
- Lass keine Aufgabe weg.
- Wenn Text schwer lesbar ist, schreibe [UNKLAR].

Wenn der Nutzer "Aufgaben erkennen" wählt:
→ Nur Aufgaben extrahieren.

Wenn der Nutzer "Aufgabe erklären" wählt:
→ Aufgaben + kurze Erklärung geben.

Wenn der Nutzer "Lösung prüfen" wählt:
→ Prüfe die eingegebene oder fotografierte Lösung.
→ Schreibe klar:
1. ob die Lösung richtig oder falsch ist,
2. falls falsch: wo der Fehler liegt,
3. die richtige Lösung in kurzer Form.
`;

    const prompt = `WICHTIG: Antworte vollständig auf ${selectedLanguage}.

Klasse: ${grade}
Fach: ${subject}
Aufgabe/Text: ${task || "(nur Bild)"}`;

 const instruction =
  mode === "check"
    ? "\n\nWICHTIG: Prüfe die Lösung des Nutzers. Schreibe klar, ob sie richtig oder falsch ist. Wenn falsch, zeige kurz den Fehler und die richtige Lösung."
    : "\n\nWICHTIG: Erkläre die erkannte Aufgabe kurz Schritt für Schritt.";

    const userContent = imageData
  ? [
      { type: "input_text", text: prompt + instruction },
      { type: "input_image", image_url: imageData },
    ]
  : [{ type: "input_text", text: prompt + instruction }];

    
const response = await client.responses.create({
  model: "gpt-4.1-mini",
  input: [
    { role: "system", content: system },
    { role: "user", content: userContent },
  ],
});

    const answer = response.output_text || "Keine Antwort erhalten.";
    return Response.json({ answer });
    } catch (error) {
    console.error("API ERROR:", error);
    return Response.json(
      { error: String(error?.message || error) },
      { status: 500 }
    );
  }
}