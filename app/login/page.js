"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { text, useAppLanguage } from "../../lib/i18n";

const LOGIN_TEXT = {
  de: {
    intro: "Gib deine E-Mail-Adresse und dein Passwort ein. Den Namen brauchst du nur bei der ersten Login-Anfrage.",
    name: "Name oder Nickname", email: "E-Mail-Adresse", password: "Passwort",
    wait: "Bitte warten...", login: "Einloggen", forgot: "Passwort vergessen?",
    resetInfo: "Gib deine E-Mail-Adresse oder deinen Namen ein. Du bekommst einen Link, um ein neues Passwort zu erstellen.",
    emailOrName: "E-Mail oder Name", sendReset: "Reset-Link senden",
    unknown: "Unbekannt", processed: "Anfrage wurde verarbeitet.", resetSent: "Reset-Link wurde gesendet.",
    rateLimit: "Zu viele E-Mails in kurzer Zeit. Bitte warte ein paar Minuten und versuche es dann erneut.",
    supabase: "Supabase ist noch nicht konfiguriert.",
  },
  en: {
    intro: "Enter your email address and password. Your name is only needed for the first login request.",
    name: "Name or nickname", email: "Email address", password: "Password",
    wait: "Please wait...", login: "Log in", forgot: "Forgot password?",
    resetInfo: "Enter your email address or name. You will receive a link to create a new password.",
    emailOrName: "Email or name", sendReset: "Send reset link",
    unknown: "Unknown", processed: "Request processed.", resetSent: "Reset link sent.",
    rateLimit: "Too many emails in a short time. Please wait a few minutes and try again.",
    supabase: "Supabase is not configured yet.",
  },
  tr: {
    intro: "E-posta adresini ve şifreni gir. İsim yalnızca ilk giriş isteğinde gereklidir.",
    name: "İsim veya kullanıcı adı", email: "E-posta adresi", password: "Şifre",
    wait: "Lütfen bekle...", login: "Giriş yap", forgot: "Şifreni mi unuttun?",
    resetInfo: "E-posta adresini veya ismini gir. Yeni şifre oluşturmak için bir bağlantı alacaksın.",
    emailOrName: "E-posta veya isim", sendReset: "Sıfırlama bağlantısı gönder",
    unknown: "Bilinmiyor", processed: "İstek işlendi.", resetSent: "Sıfırlama bağlantısı gönderildi.",
    rateLimit: "Kısa sürede çok fazla e-posta gönderildi. Birkaç dakika bekleyip tekrar dene.",
    supabase: "Supabase henüz yapılandırılmadı.",
  },
};

export default function LoginPage() {
  const { language } = useAppLanguage();
  const tx = text(LOGIN_TEXT, language);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [resetLoginId, setResetLoginId] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    try {
      if (!supabase) {
        setMessage(`Fehler: ${tx.supabase}`);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          displayName,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage("Fehler: " + (data?.error || tx.unknown));
      } else if (data?.session) {
        const { error } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (error) {
          setMessage("Fehler: " + error.message);
        } else {
          window.location.href = "/";
        }
      } else {
        setMessage(data?.message || tx.processed);
      }
    } catch (error) {
      setMessage("Fehler: " + (error?.message || tx.unknown));
    }

    setLoading(false);
  }

  async function handlePasswordReset() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId: resetLoginId || email || displayName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data?.error || tx.unknown;
        setMessage(
          "Fehler: " +
            (errorMessage.toLowerCase().includes("rate limit")
              ? tx.rateLimit
              : errorMessage)
        );
      } else {
        setMessage(data?.message || tx.resetSent);
      }
    } catch (error) {
      setMessage("Fehler: " + (error?.message || tx.unknown));
    }

    setLoading(false);
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
      }}
    >
      <h1>Login</h1>

      <p>{tx.intro}</p>

      <input
        type="text"
        placeholder={tx.name}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 18,
          borderRadius: 12,
          border: "1px solid #444",
          marginBottom: 12,
          boxSizing: "border-box",
        }}
      />

      <input
        type="email"
        placeholder={tx.email}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 18,
          borderRadius: 12,
          border: "1px solid #444",
          marginBottom: 12,
          boxSizing: "border-box",
        }}
      />

      <input
        type="password"
        placeholder={tx.password}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 18,
          borderRadius: 12,
          border: "1px solid #444",
          marginBottom: 12,
          boxSizing: "border-box",
        }}
      />

      <button
        onClick={handleLogin}
        disabled={loading || !email || password.length < 6}
        style={{
          width: "100%",
          padding: 16,
          fontSize: 18,
          fontWeight: "bold",
          borderRadius: 14,
          border: "none",
          backgroundColor: "#1976d2",
          color: "white",
        }}
      >
        {loading ? tx.wait : tx.login}
      </button>

      <button
        onClick={() => {
          setShowReset(!showReset);
          setMessage("");
        }}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          fontWeight: "bold",
          borderRadius: 12,
          border: "1px solid #444",
          backgroundColor: "#222",
          color: "white",
          marginTop: 12,
        }}
      >
        {tx.forgot}
      </button>

      {showReset && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: "#1b1b1b",
            border: "1px solid #333",
          }}
        >
          <p style={{ marginTop: 0 }}>{tx.resetInfo}</p>
          <input
            type="text"
            placeholder={tx.emailOrName}
            value={resetLoginId}
            onChange={(e) => setResetLoginId(e.target.value)}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 18,
              borderRadius: 12,
              border: "1px solid #444",
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handlePasswordReset}
            disabled={loading || !(resetLoginId || email || displayName)}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 16,
              fontWeight: "bold",
              borderRadius: 12,
              border: "none",
              backgroundColor: "#43a047",
              color: "white",
            }}
          >
            {tx.sendReset}
          </button>
        </div>
      )}

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </main>
  );
}
