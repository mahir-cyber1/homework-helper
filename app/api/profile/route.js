import { createClient } from "@supabase/supabase-js";

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

function getDisplayNameKey(displayName) {
  return String(displayName || "").trim().toLowerCase();
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

  const { displayName, avatarId } = await req.json();
  const trimmedName = String(displayName || "").trim().slice(0, 60);
  const displayNameKey = getDisplayNameKey(trimmedName);

  if (trimmedName.length < 2) {
    return Response.json(
      { error: "Bitte mindestens 2 Zeichen fuer den Namen eingeben." },
      { status: 400 }
    );
  }

  const [{ data: profileMatch }, { data: approvedMatch }, { data: requestMatch }] =
    await Promise.all([
      adminClient
        .from("user_profiles")
        .select("user_id")
        .eq("display_name_key", displayNameKey)
        .neq("user_id", auth.user.id)
        .maybeSingle(),
      adminClient
        .from("approved_login_emails")
        .select("email")
        .eq("display_name_key", displayNameKey)
        .neq("email", auth.user.email)
        .maybeSingle(),
      adminClient
        .from("login_access_requests")
        .select("email")
        .eq("display_name_key", displayNameKey)
        .neq("email", auth.user.email)
        .maybeSingle(),
    ]);

  if (profileMatch || approvedMatch || requestMatch) {
    return Response.json(
      {
        error:
          "Dieser Name existiert bereits. Bitte waehle einen anderen Namen.",
      },
      { status: 409 }
    );
  }

  const { error } = await adminClient.from("user_profiles").upsert({
    user_id: auth.user.id,
    email: auth.user.email,
    display_name: trimmedName,
    display_name_key: displayNameKey,
    avatar_id: avatarId || "star",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    const message = error.message?.includes("duplicate")
      ? "Dieser Name existiert bereits. Bitte waehle einen anderen Namen."
      : error.message;

    return Response.json({ error: message }, { status: 500 });
  }

  return Response.json({
    displayName: trimmedName,
    avatarId: avatarId || "star",
  });
}
