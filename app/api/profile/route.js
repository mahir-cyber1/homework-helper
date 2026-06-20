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

function isMissingDisplayNameKeyError(error) {
  const message = String(error?.message || "");

  return (
    message.includes("display_name_key") &&
    (message.includes("schema cache") ||
      message.includes("column") ||
      message.includes("Could not find"))
  );
}

async function findNameMatch(client, table, displayNameKey, currentUser) {
  const { data, error } = await client
    .from(table)
    .select(table === "user_profiles" ? "user_id,email" : "email")
    .eq("display_name_key", displayNameKey)
    .maybeSingle();

  if (isMissingDisplayNameKeyError(error)) {
    return null;
  }

  if (error) {
    throw error;
  }

  if (!data) return null;

  if (table === "user_profiles") {
    return data.user_id === currentUser.id ? null : data;
  }

  return data.email === currentUser.email ? null : data;
}

async function upsertProfile(client, payload) {
  const { error } = await client
    .from("user_profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (!isMissingDisplayNameKeyError(error)) {
    return error;
  }

  const fallbackPayload = { ...payload };
  delete fallbackPayload.display_name_key;

  const { error: fallbackError } = await client
    .from("user_profiles")
    .upsert(fallbackPayload, { onConflict: "user_id" });

  return fallbackError;
}

async function updateStoredDisplayName(client, table, email, displayName, displayNameKey) {
  const payload = {
    display_name: displayName,
    display_name_key: displayNameKey,
  };

  const { error } = await client.from(table).update(payload).eq("email", email);

  if (!isMissingDisplayNameKeyError(error)) {
    return;
  }

  delete payload.display_name_key;
  await client.from(table).update(payload).eq("email", email);
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

  let profileMatch = null;
  let approvedMatch = null;
  let requestMatch = null;

  try {
    [profileMatch, approvedMatch, requestMatch] = await Promise.all([
      findNameMatch(adminClient, "user_profiles", displayNameKey, auth.user),
      findNameMatch(
        adminClient,
        "approved_login_emails",
        displayNameKey,
        auth.user
      ),
      findNameMatch(
        adminClient,
        "login_access_requests",
        displayNameKey,
        auth.user
      ),
    ]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (profileMatch || approvedMatch || requestMatch) {
    return Response.json(
      {
        error:
          "Dieser Name existiert bereits. Bitte waehle einen anderen Namen.",
      },
      { status: 409 }
    );
  }

  const error = await upsertProfile(adminClient, {
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

  await Promise.all([
    updateStoredDisplayName(
      adminClient,
      "approved_login_emails",
      auth.user.email,
      trimmedName,
      displayNameKey
    ),
    updateStoredDisplayName(
      adminClient,
      "login_access_requests",
      auth.user.email,
      trimmedName,
      displayNameKey
    ),
  ]);

  return Response.json({
    displayName: trimmedName,
    avatarId: avatarId || "star",
  });
}
