import { createClient } from "@supabase/supabase-js";
import { getLeague, getNextLeague } from "../../../lib/gamification";

export const runtime = "nodejs";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function getUser(req, adminClient) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  if (!token) {
    return { error: "Nicht eingeloggt.", status: 401 };
  }

  const {
    data: { user },
    error,
  } = await adminClient.auth.getUser(token);

  if (error || !user) {
    return { error: "Session ist ungueltig.", status: 401 };
  }

  return { user };
}

function getCorrectTaskCount(answer) {
  const text = String(answer || "").toLowerCase();
  const markerMatch = text.match(/richtige_aufgaben\s*:\s*(\d+)/i);

  if (markerMatch) {
    return Number(markerMatch[1]);
  }

  const hasCorrectSignal =
    text.includes("richtig") ||
    text.includes("correct") ||
    text.includes("doğru") ||
    text.includes("dogru") ||
    text.includes("kein fehler");

  const hasWrongSignal =
    text.includes("falsch") ||
    text.includes("wrong") ||
    text.includes("yanlış") ||
    text.includes("yanlis");

  if (text.includes("kein fehler")) return 1;
  if (hasWrongSignal && !hasCorrectSignal) return 0;

  return hasCorrectSignal && !text.includes("[unklar]") ? 1 : 0;
}

async function getStats(adminClient, userId) {
  const { data } = await adminClient
    .from("user_points")
    .select("points,correct_checks,total_checks")
    .eq("user_id", userId)
    .maybeSingle();

  const points = data?.points || 0;
  const league = getLeague(points);
  const nextLeague = getNextLeague(points);

  return {
    points,
    correctChecks: data?.correct_checks || 0,
    totalChecks: data?.total_checks || 0,
    league,
    nextLeague,
    pointsToNextLeague: nextLeague
      ? Math.max(0, nextLeague.minPoints - points)
      : 0,
  };
}

export async function GET(req) {
  const adminClient = getAdminClient();

  if (!adminClient) {
    return Response.json(
      { error: "Admin-Client ist nicht konfiguriert." },
      { status: 500 }
    );
  }

  const auth = await getUser(req, adminClient);

  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const stats = await getStats(adminClient, auth.user.id);
  return Response.json({ stats });
}

export async function POST(req) {
  const adminClient = getAdminClient();

  if (!adminClient) {
    return Response.json(
      { error: "Admin-Client ist nicht konfiguriert." },
      { status: 500 }
    );
  }

  const auth = await getUser(req, adminClient);

  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { mode, answer, subject, grade } = await req.json();
  const isCheck = mode === "check";
  const correctTaskCount = isCheck ? getCorrectTaskCount(answer) : 0;
  const pointsAwarded = correctTaskCount;

  const currentStats = await getStats(adminClient, auth.user.id);
  const nextPoints = currentStats.points + pointsAwarded;
  const nextCorrectChecks =
    currentStats.correctChecks + correctTaskCount;
  const nextTotalChecks = currentStats.totalChecks + (isCheck ? 1 : 0);

  await adminClient.from("user_points").upsert({
    user_id: auth.user.id,
    email: auth.user.email,
    points: nextPoints,
    correct_checks: nextCorrectChecks,
    total_checks: nextTotalChecks,
    updated_at: new Date().toISOString(),
  });

  if (isCheck) {
    await adminClient.from("point_events").insert({
      user_id: auth.user.id,
      email: auth.user.email,
      points: pointsAwarded,
      event_type: correctTaskCount > 0 ? "correct_tasks" : "checked_incorrect",
      subject: subject || null,
      grade: grade || null,
    });
  }

  const stats = await getStats(adminClient, auth.user.id);

  return Response.json({
    pointsAwarded,
    correctTaskCount,
    isCorrect: correctTaskCount > 0,
    stats,
  });
}
