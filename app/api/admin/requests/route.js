import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const EXTRA_ADMIN_EMAILS = ["genckurecikli@gmail.com"];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isAdminEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const envAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL);

  return (
    normalizedEmail &&
    (normalizedEmail === envAdminEmail ||
      EXTRA_ADMIN_EMAILS.includes(normalizedEmail))
  );
}

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

async function getAdminUser(req, adminClient) {
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

  if (!isAdminEmail(user.email)) {
    return { error: "Nur der Admin darf diese Seite nutzen.", status: 403 };
  }

  return { user };
}

export async function GET(req) {
  const adminClient = getAdminClient();

  if (!adminClient) {
    return Response.json(
      { error: "Admin-Client ist nicht konfiguriert." },
      { status: 500 }
    );
  }

  const admin = await getAdminUser(req, adminClient);

  if (admin.error) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }

  const { data, error } = await adminClient
    .from("login_access_requests")
    .select("id,email,display_name,status,requested_at,approved_at")
    .order("requested_at", { ascending: false })
    .limit(100);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { data: approvedUsers, error: usersError } = await adminClient
    .from("approved_login_emails")
    .select("email,display_name,created_at")
    .order("created_at", { ascending: false });

  if (usersError) {
    return Response.json({ error: usersError.message }, { status: 500 });
  }

  const pendingRequests = (data || []).filter(
    (request) => request.status === "pending"
  );

  return Response.json({
    requests: data || [],
    pendingRequests,
    users: approvedUsers || [],
  });
}

export async function POST(req) {
  const adminClient = getAdminClient();

  if (!adminClient) {
    return Response.json(
      { error: "Admin-Client ist nicht konfiguriert." },
      { status: 500 }
    );
  }

  const admin = await getAdminUser(req, adminClient);

  if (admin.error) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }

  const { id, email, action } = await req.json();

  if ((!id && !email) || !["approve", "reject", "remove"].includes(action)) {
    return Response.json(
      { error: "Ungueltige Admin-Aktion." },
      { status: 400 }
    );
  }

  if (action === "remove") {
    const normalizedEmail = normalizeEmail(email);

    const { error: deleteError } = await adminClient
      .from("approved_login_emails")
      .delete()
      .eq("email", normalizedEmail);

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    await adminClient
      .from("login_access_requests")
      .update({
        status: "rejected",
        approved_at: null,
      })
      .eq("email", normalizedEmail);

    return Response.json({ ok: true });
  }

  const { data: request, error: requestError } = await adminClient
    .from("login_access_requests")
    .select("id,email,display_name")
    .eq("id", id)
    .maybeSingle();

  if (requestError || !request) {
    return Response.json(
      { error: requestError?.message || "Anfrage nicht gefunden." },
      { status: 404 }
    );
  }

  if (action === "approve") {
    const { error: approvalError } = await adminClient
      .from("approved_login_emails")
      .upsert(
        {
          email: request.email,
          display_name: request.display_name,
        },
        { onConflict: "email" }
      );

    if (approvalError) {
      return Response.json({ error: approvalError.message }, { status: 500 });
    }
  } else {
    const { error: deleteError } = await adminClient
      .from("approved_login_emails")
      .delete()
      .eq("email", request.email);

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 });
    }
  }

  const { error: updateError } = await adminClient
    .from("login_access_requests")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      approved_at: action === "approve" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
