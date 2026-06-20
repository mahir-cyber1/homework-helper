"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [users, setUsers] = useState([]);
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
      setPendingRequests(data?.pendingRequests || []);
      setUsers(data?.users || []);
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

  async function updateRequest(id, action, email = "") {
    setBusyId(id || email);
    setMessage("");

    const token = await getAccessToken();

    const res = await fetch("/api/admin/requests", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, action, email }),
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

      {!loading && !message && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: "#1b1b1b",
              border: "1px solid #333",
            }}
          >
            <p style={{ margin: "0 0 4px", color: "#aaa", fontSize: 13 }}>
              Benutzer
            </p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>
              {users.length}
            </p>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: "#1b1b1b",
              border: "1px solid #333",
            }}
          >
            <p style={{ margin: "0 0 4px", color: "#aaa", fontSize: 13 }}>
              Warten
            </p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>
              {pendingRequests.length}
            </p>
          </div>
        </div>
      )}

      {!loading && !message && (
        <h2 style={{ fontSize: 22, marginTop: 0 }}>Warten auf Freigabe</h2>
      )}

      {!loading && pendingRequests.length === 0 && !message && (
        <p style={{ color: "#ccc" }}>Keine offenen Login-Anfragen.</p>
      )}

      {pendingRequests.map((request) => (
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
              disabled={busyId === request.id}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#43a047",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Freigeben
            </button>
            <button
              onClick={() => updateRequest(request.id, "reject")}
              disabled={busyId === request.id}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#e53935",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Ablehnen
            </button>
          </div>
        </article>
      ))}

      {!loading && !message && (
        <h2 style={{ fontSize: 22, marginTop: 22 }}>Benutzer</h2>
      )}

      {!loading && users.length === 0 && !message && (
        <p style={{ color: "#ccc" }}>Noch keine freigegebenen Benutzer.</p>
      )}

      {users.map((approvedUser) => {
        const latestRequest = requests.find(
          (request) => request.email === approvedUser.email
        );

        return (
          <article
            key={approvedUser.email}
            style={{
              padding: 14,
              borderRadius: 12,
              backgroundColor: "#1b1b1b",
              border: "1px solid #333",
              marginBottom: 14,
            }}
          >
            <p style={{ margin: "0 0 6px", fontWeight: "bold" }}>
              {approvedUser.display_name || "Ohne Namen"}
            </p>
            <p style={{ margin: "0 0 6px", color: "#ccc" }}>
              {approvedUser.email}
            </p>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "#aaa" }}>
              Freigegeben:{" "}
              {new Date(approvedUser.created_at).toLocaleString("de-DE")}
            </p>
            <button
              onClick={() =>
                updateRequest(
                  latestRequest?.id || "",
                  "remove",
                  approvedUser.email
                )
              }
              disabled={busyId === (latestRequest?.id || approvedUser.email)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#e53935",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Freigabe entfernen
            </button>
          </article>
        );
      })}
    </main>
  );
}
