import OpenAI from "openai";

export const runtime = "nodejs";

// simples Limit: 20 Requests/Stunde pro IP
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
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY fehlt in den Umgebungsvariablen." },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const {
      grade,
      subject,
      task,
      imageData,
      fileData,
      fileName,
      fileMime,
      mode,
      language,
    } = await req.json();

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

    if (!task && !imageData && !fileData) {
      return Response.json(
        { error: "Bitte Text eingeben, ein Bild oder eine PDF hochladen." },
        { status: 400 }
      );
    }

    const system = `
Du bist ein Lern-Tutor für Kinder der Klassen 4 bis 6.

Sprache:
- Antworte vollständig auf: ${selectedLanguage}
- Nutze einfache, kindgerechte Sprache.
- Schreibe klar, ruhig und verständlich.

Grundregeln:
- Klasse: ${grade}
- Fach: ${subject}
- Erfinde keine Aufgaben dazu.
- Wenn etwas auf dem Bild oder in der PDF nicht lesbar ist, schreibe [UNKLAR].
- Lass keine erkennbare Einzelaufgabe weg.
- Schreibe keine langen Einleitungen.
- Schreibe nicht "Hier sind..." oder ähnliche Füllsätze.

Aufgabenerkennung:
- Erkenne Hauptaufgaben, Unteraufgaben, nummerierte Aufgaben, Lückensätze und Listen.
- Jede Zeile, jeder Satz oder jede Lücke kann eine eigene Einzelaufgabe sein.
- Bei Arbeitsblättern mit mehreren Aufgaben: behandle jede erkennbare Einzelaufgabe einzeln.

WICHTIG für Erklärungen:
- Schreibe die Aufgabenstellung NICHT erneut vollständig ab.
- Schreibe NICHT zuerst alle Aufgaben untereinander.
- Beginne direkt mit der Erklärung.
- Jede erkannte Aufgabe bekommt eine eigene Nummer.
- Zu jeder Aufgabe muss es eine kurze Erklärung und ein Beispiel geben.
- Das Beispiel soll ähnlich sein, aber NICHT exakt dieselbe Aufgabe.
- Wenn möglich, erkläre in 2 bis 4 kurzen Schritten.
`;

    let instruction = "";

    if (mode === "check") {
      instruction = `
Modus: Lösung prüfen.

Prüfe die eingegebene, fotografierte oder als PDF hochgeladene Lösung.

Ausgabeformat:

1. Prüfung
Richtig oder falsch?

Fehler:
Falls falsch, erkläre kurz den Fehler. Falls richtig, schreibe: Kein Fehler.

Richtige Lösung:
Schreibe die richtige Lösung kurz und klar.

Beispiel:
Gib ein kurzes ähnliches Beispiel mit Lösung.

Wenn mehrere Aufgaben vorhanden sind, prüfe jede Aufgabe einzeln nummeriert:

1. Prüfung
...

2. Prüfung
...

Wichtig:
- Wiederhole die Aufgabenstellung nicht vollständig.
- Schreibe direkt die Prüfung.
`;
    } else {
      instruction = `
Modus: Aufgabe erkennen und erklären.

Erkläre alle erkannten Aufgaben direkt nummeriert.

Ausgabeformat exakt so:

1. Erklärung
Kurze Erklärung zur ersten Aufgabe.
Schritt 1: ...
Schritt 2: ...
Schritt 3: ...

Beispiel:
Ein ähnliches einfaches Beispiel mit Lösung.

2. Erklärung
Kurze Erklärung zur zweiten Aufgabe.
Schritt 1: ...
Schritt 2: ...
Schritt 3: ...

Beispiel:
Ein ähnliches einfaches Beispiel mit Lösung.

Wenn nur eine Aufgabe vorhanden ist, nutze trotzdem:

1. Erklärung
...
Beispiel:
...

Wichtig:
- Schreibe die Aufgaben NICHT nochmal vollständig ab.
- Keine separate Liste "Aufgaben".
- Keine Überschrift "AUFGABEN".
- Keine Wiederholung der Arbeitsblatt-Texte.
- Direkt erklären.
- Jede Aufgabe nummerieren.
- Zu jeder Aufgabe ein Beispiel geben.
`;
    }

    const prompt = `
Klasse: ${grade}
Fach: ${subject}
Aufgabe/Text: ${task || "(kein Text eingegeben)"}
Datei: ${fileName || "(keine Datei)"}
Dateityp: ${fileMime || "(kein Dateityp)"}
`;

    const userContent = [{ type: "input_text", text: prompt + instruction }];

    if (imageData) {
      userContent.push({
        type: "input_image",
        image_url: imageData,
      });
    }

    if (fileData && fileMime === "application/pdf") {
      userContent.push({
        type: "input_file",
        filename: fileName || "arbeitsblatt.pdf",
        file_data: fileData,
      });
    }

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
