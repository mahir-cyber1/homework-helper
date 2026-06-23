"use client";

import { useEffect, useMemo, useState } from "react";

function formatRemaining(totalSeconds) {
  const seconds = Math.max(0, totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const restSeconds = seconds % 60;
  const values =
    hours > 0 ? [hours, minutes, restSeconds] : [minutes, restSeconds];

  return values
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatHour(isoDate) {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

export default function PowerEventBanner() {
  const [eventState, setEventState] = useState(null);
  const [localNow, setLocalNow] = useState(0);

  useEffect(() => {
    let mounted = true;
    let boundaryTimer;

    async function loadEvent() {
      try {
        const receivedAt = Date.now();
        const res = await fetch("/api/power-event", { cache: "no-store" });
        const data = await res.json();

        if (mounted && res.ok) {
          setEventState({ ...data, receivedAt });
          setLocalNow(receivedAt);

          const target = new Date(
            data.active ? data.endsAt : data.nextStartsAt
          ).getTime();
          const delay = Math.max(
            250,
            target - new Date(data.serverNow).getTime() + 250
          );
          window.clearTimeout(boundaryTimer);
          boundaryTimer = window.setTimeout(loadEvent, delay);
        }
      } catch {
        // The rest of the app works even when the event status is unavailable.
      }
    }

    loadEvent();
    const clock = window.setInterval(() => setLocalNow(Date.now()), 1000);
    const refresh = window.setInterval(loadEvent, 30000);

    return () => {
      mounted = false;
      window.clearTimeout(boundaryTimer);
      window.clearInterval(clock);
      window.clearInterval(refresh);
    };
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!eventState) return 0;

    const serverOffset =
      new Date(eventState.serverNow).getTime() - eventState.receivedAt;
    const serverNow = localNow + serverOffset;
    const target = new Date(
      eventState.active ? eventState.endsAt : eventState.nextStartsAt
    ).getTime();

    return Math.max(0, Math.ceil((target - serverNow) / 1000));
  }, [eventState, localNow]);

  if (!eventState) return null;

  return (
    <section
      className={`power-event no-print${eventState.active ? " is-active" : ""}`}
      aria-live="polite"
    >
      <span className="power-event__icon" aria-hidden="true">
        {eventState.active ? "×2" : "⏱"}
      </span>
      <span className="power-event__content">
        <strong>
          {eventState.active
            ? "Doppelte Punkte sind aktiv"
            : `Nächstes 2×-Event um ${formatHour(eventState.nextStartsAt)} Uhr`}
        </strong>
        <span>
          {eventState.active ? "Noch " : "Start in "}
          {formatRemaining(remainingSeconds)}
        </span>
      </span>
    </section>
  );
}
