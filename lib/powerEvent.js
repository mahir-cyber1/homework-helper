const TIME_ZONE = "Europe/Berlin";
const EVENT_HOURS = [13, 16, 18, 20];
const EVENT_DURATION_MINUTES = 10;

function getBerlinParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );
}

function getTimeZoneOffsetMs(date) {
  const parts = getBerlinParts(date);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return representedAsUtc - date.getTime();
}

function berlinTimeToDate({ year, month, day, hour, minute = 0 }) {
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let result = new Date(targetAsUtc);

  for (let index = 0; index < 2; index += 1) {
    result = new Date(targetAsUtc - getTimeZoneOffsetMs(result));
  }

  return result;
}

function getNextCalendarDay({ year, month, day }) {
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));

  return {
    year: nextDate.getUTCFullYear(),
    month: nextDate.getUTCMonth() + 1,
    day: nextDate.getUTCDate(),
  };
}

export function getPowerEventState(now = new Date()) {
  const parts = getBerlinParts(now);
  const secondsOfDay =
    parts.hour * 3600 + parts.minute * 60 + parts.second;
  const activeHour = EVENT_HOURS.find(
    (hour) =>
      parts.hour === hour && parts.minute < EVENT_DURATION_MINUTES
  );

  if (activeHour !== undefined) {
    const startsAt = berlinTimeToDate({
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: activeHour,
    });
    const endsAt = new Date(
      startsAt.getTime() + EVENT_DURATION_MINUTES * 60 * 1000
    );

    return {
      active: true,
      multiplier: 2,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      nextStartsAt: null,
      serverNow: now.toISOString(),
      scheduleHours: EVENT_HOURS,
      durationMinutes: EVENT_DURATION_MINUTES,
    };
  }

  const nextHourToday = EVENT_HOURS.find(
    (hour) => hour * 3600 > secondsOfDay
  );
  const nextDay =
    nextHourToday === undefined
      ? getNextCalendarDay(parts)
      : { year: parts.year, month: parts.month, day: parts.day };
  const nextStartsAt = berlinTimeToDate({
    ...nextDay,
    hour: nextHourToday ?? EVENT_HOURS[0],
  });

  return {
    active: false,
    multiplier: 1,
    startsAt: null,
    endsAt: null,
    nextStartsAt: nextStartsAt.toISOString(),
    serverNow: now.toISOString(),
    scheduleHours: EVENT_HOURS,
    durationMinutes: EVENT_DURATION_MINUTES,
  };
}
