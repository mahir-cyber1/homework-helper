import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeDisplayName(displayName) {
  return String(displayName || "").trim().slice(0, 60);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function sendApprovalEmail({ email, displayName, approvalUrl }) {
  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const from =
    process.env.RESEND_FROM_EMAIL || "Homework Helper <onboarding@resend.dev>";

  if (!resendKey || !adminEmail) {
    return {
      sent: false,
      reason: "RESEND_API_KEY oder ADMIN_EMAIL fehlt.",
    };
  }

  const safeEmail = escapeHtml(email);
  const safeDisplayName = escapeHtml(displayName);
  const safeApprovalUrl = escapeHtml(approvalUrl);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: adminEmail,
      subject: "Neue Login-Freigabe fuer Homework Helper",
      html: `
        <h2>Neue Login-Anfrage</h2>
        <p>Diese Person moechte sich einloggen:</p>
        <p>Name: <strong>${safeDisplayName}</strong></p>
        <p><strong>${safeEmail}</strong></p>
        <p>
          <a href="${safeApprovalUrl}" style="display:inline-block;padding:12px 18px;background:#1976d2;color:white;text-decoration:none;border-radius:8px;">
            E-Mail freigeben
          </a>
        </p>
        <p>Falls der Button nicht funktioniert, diesen Link oeffnen:</p>
        <p>${safeApprovalUrl}</p>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { sent: false, reason: text };
  }

  return { sent: true };
}

async function createApprovalRequest({
  adminClient,
  req,
  email,
  displayName,
}) {
  const token = randomBytes(32).toString("hex");
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.headers.get("origin") ||
    new URL(req.url).origin;
  const approvalUrl = `${origin}/api/approve-login?token=${token}`;

  const { error: requestError } = await adminClient
    .from("login_access_requests")
    .upsert(
      {
        email,
        display_name: displayName,
        token,
        status: "pending",
        requested_at: new Date().toISOString(),
        approved_at: null,
      },
      { onConflict: "email" }
    );

  if (requestError) {
    return { error: requestError.message, status: 500 };
  }

  const mailResult = await sendApprovalEmail({
    email,
    displayName,
    approvalUrl,
  });

  if (!mailResult.sent) {
    console.error("Approval email failed:", mailResult.reason);

    return {
      error:
        "Login-Anfrage wurde gespeichert, aber die Freigabe-Mail konnte nicht gesendet werden. Bitte Resend- und Vercel-Einstellungen pruefen.",
      status: 500,
    };
  }

  return {
    message:
      "Deine Login-Anfrage wurde gesendet. Nach Freigabe kannst du dich mit diesem Passwort einloggen.",
  };
}

export async function POST(req) {
  try {
    const { email, displayName, password } = await req.json();
    const normalizedEmail = normalizeEmail(email);
    const normalizedDisplayName = normalizeDisplayName(displayName);

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return Response.json(
        { error: "Bitte eine gueltige E-Mail-Adresse eingeben." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return Response.json(
        { error: "Das Passwort muss mindestens 6 Zeichen haben." },
        { status: 400 }
      );
    }

    const adminClient = getAdminClient();
    const publicClient = getPublicClient();

    if (!adminClient || !publicClient) {
      return Response.json(
        { error: "Supabase ist noch nicht vollstaendig konfiguriert." },
        { status: 500 }
      );
    }

    const { data: approved, error: approvedError } = await adminClient
      .from("approved_login_emails")
      .select("email,display_name")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (approvedError) {
      return Response.json({ error: approvedError.message }, { status: 500 });
    }

    const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
    const isAdminEmail = adminEmail && normalizedEmail === adminEmail;
    const loginAllowed = approved || isAdminEmail;
    const finalDisplayName =
      approved?.display_name || normalizedDisplayName || normalizedEmail;

    if (!loginAllowed) {
      if (normalizedDisplayName.length < 2) {
        return Response.json(
          {
            error:
              "Diese E-Mail ist noch nicht freigegeben. Bitte Name oder Nickname eingeben, damit der Admin dich erkennen kann.",
          },
          { status: 400 }
        );
      }

      const result = await createApprovalRequest({
        adminClient,
        req,
        email: normalizedEmail,
        displayName: normalizedDisplayName,
      });

      if (result.error) {
        return Response.json({ error: result.error }, { status: result.status });
      }

      return Response.json({ message: result.message });
    }

    if (isAdminEmail && !approved) {
      await adminClient.from("approved_login_emails").upsert(
        {
          email: normalizedEmail,
          display_name: finalDisplayName,
        },
        { onConflict: "email" }
      );
    }

    let signInResult = await publicClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInResult.error) {
      const { error: createError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: finalDisplayName,
        },
      });

      if (createError) {
        return Response.json(
          {
            error:
              "Login fehlgeschlagen. Falls du schon ein Passwort hast, pruefe bitte dein Passwort.",
          },
          { status: 401 }
        );
      }

      signInResult = await publicClient.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
    }

    if (signInResult.error || !signInResult.data.session) {
      return Response.json(
        { error: signInResult.error?.message || "Login fehlgeschlagen." },
        { status: 401 }
      );
    }

    const user = signInResult.data.user;

    await adminClient.from("user_profiles").upsert({
      user_id: user.id,
      email: normalizedEmail,
      display_name: finalDisplayName,
      updated_at: new Date().toISOString(),
    });

    return Response.json({
      message: "Login erfolgreich.",
      session: signInResult.data.session,
    });
  } catch (error) {
    return Response.json(
      { error: String(error?.message || error) },
      { status: 500 }
    );
  }
}
