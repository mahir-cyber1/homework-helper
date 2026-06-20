"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [message, setMessage] = useState(
    supabase ? "" : "Supabase ist nicht konfiguriert."
  );
  const [busyId, setBusyId] = useState("");

  const getAccessToken = useCallback(async () => {
    if (!supabase) return "";

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const token = await getAccessToken();

    if (!token) {
      setMessage("Bitte zuerst als Admin einloggen.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/admin/requests", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data?.error || "Admin-Anfragen konnten nicht geladen werden.");
    } else {
      setRequests(data?.requests || []);
    }

    setLoading(false);
  }, [getAccessToken]);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      await loadRequests();
    }

    init();
  }, [loadRequests]);

  async function updateRequest(id, action) {
    setBusyId(id);
    setMessage("");

    const token = await getAccessToken();

    const res = await fetch("/api/admin/requests", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, action }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data?.error || "Aktion fehlgeschlagen.");
    } else {
      await loadRequests();
    }

    setBusyId("");
  }

  return (
    <main
      style={{
        maxWidth: 430,
        margin: "0 auto",
        minHeight: "100vh",
        padding: 20,
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#111",
        color: "white",
        borderRadius: 24,
      }}
    >
      <button
        onClick={() => {
          window.location.href = "/";
        }}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "10px",
          border: "none",
          backgroundColor: "#333",
          color: "white",
          fontWeight: "bold",
          marginBottom: 14,
        }}
      >
        Zurueck zur App
      </button>

      <h1 style={{ fontSize: 28, marginTop: 0 }}>Admin</h1>

      {user && (
        <p style={{ color: "#ccc", fontSize: 14 }}>
          Eingeloggt als: {user.email}
        </p>
      )}

      {loading && <p>Wird geladen...</p>}

      {message && (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: "#1b1b1b",
            border: "1px solid #333",
            marginBottom: 14,
          }}
        >
          <p style={{ marginTop: 0 }}>{message}</p>
          {message.includes("einloggen") && (
            <button
              onClick={() => {
                window.location.href = "/login";
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#1976d2",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Einloggen
            </button>
          )}
        </div>
      )}

      {!loading && requests.length === 0 && !message && (
        <p>Keine Login-Anfragen vorhanden.</p>
      )}

      {requests.map((request) => (
        <article
          key={request.id}
          style={{
            padding: 14,
            borderRadius: 12,
            backgroundColor: "#1b1b1b",
            border: "1px solid #333",
            marginBottom: 14,
          }}
        >
          <p style={{ margin: "0 0 6px", fontWeight: "bold" }}>
            {request.display_name || "Ohne Namen"}
          </p>
          <p style={{ margin: "0 0 6px", color: "#ccc" }}>{request.email}</p>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#aaa" }}>
            {new Date(request.requested_at).toLocaleString("de-DE")} |{" "}
            {request.status}
          </p>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => updateRequest(request.id, "approve")}
              disabled={busyId === request.id || request.status === "approved"}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                backgroundColor:
                  request.status === "approved" ? "#355c38" : "#43a047",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Freigeben
            </button>
            <button
              onClick={() => updateRequest(request.id, "reject")}
              disabled={busyId === request.id || request.status === "rejected"}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                backgroundColor:
                  request.status === "rejected" ? "#5c3535" : "#e53935",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Ablehnen
            </button>
          </div>
        </article>
      ))}
    </main>
  );
}
