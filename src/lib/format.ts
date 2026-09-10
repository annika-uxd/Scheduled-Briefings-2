import type { Briefing, BriefingStatus, Schedule } from "@/lib/types";

export const STATUS_LABEL: Record<BriefingStatus, string> = {
  "needs-review": "Needs review",
  active: "Active",
  scheduled: "Scheduled",
  paused: "Paused",
};

/** Table cell: "Thursdays · 4:00 PM CT". */
export function scheduleParts(schedule: Schedule) {
  return {
    day: schedule.day,
    time: `${schedule.time} ${schedule.timezoneShort}`,
  };
}

/** Metadata line: "Weekly · Thursdays at 4:00 PM CT". */
export function scheduleSummary(schedule: Schedule) {
  return `${schedule.day} · ${schedule.time} ${schedule.timezoneShort}`;
}

export function recipientSummary(briefing: Briefing) {
  const n = briefing.recipients.length;
  return `${n} recipient${n === 1 ? "" : "s"}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function isValidEmail(value: string) {
  return EMAIL_RE.test(value.trim());
}

/** "Sep 10, 7:00 AM CT" for a freshly created briefing's next run. */
export function formatNextRun(schedule: Schedule) {
  const now = new Date();
  const month = now.toLocaleDateString("en-US", { month: "short" });
  return `${month} ${now.getDate()}, ${schedule.time} ${schedule.timezoneShort}`;
}

export function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Stable pseudo-random 0–1 from a string, for deterministic mock visuals. */
export function seededUnit(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}
