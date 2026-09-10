import { buildEdition } from "@/lib/data/editions";
import { getTemplate } from "@/lib/data/templates";
import type { Briefing, BriefingStatus, Recipient, Schedule } from "@/lib/types";

/** Mock recipients. Handraise-domain addresses only — no real inboxes. */
function recipients(...emails: string[]): Recipient[] {
  return emails.map((email, i) => ({
    id: `rcp-${i}-${email}`,
    email,
    initials: initialsFromEmail(email),
  }));
}

export function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

const schedule = (
  frequency: Schedule["frequency"],
  day: string,
  time: string,
): Schedule => ({
  frequency,
  day,
  time,
  timezone: "America/Chicago (GMT -05:00)",
  timezoneShort: "CT",
});

interface Seed {
  id: string;
  name: string;
  templateId: string;
  status: BriefingStatus;
  overallPrompt: string;
  lookback: Briefing["lookback"];
  sectionPrompts?: Record<string, string>;
  schedule: Schedule;
  recipients: Recipient[];
  owner: string;
  lastGenerated: string | null;
  /** Date header on the generated edition. */
  editionDate?: string;
  editionWindow?: string;
}

const SEEDS: Seed[] = [
  {
    id: "brf-morning-us",
    name: "Morning Brief — US Comms",
    templateId: "tpl-morning-brief",
    status: "needs-review",
    overallPrompt:
      "Summarise the last 24 hours in three sentences for a senior comms audience. Lead with the most consequential story and name the risk it creates.",
    lookback: "Last 24 hours",
    schedule: schedule("Daily", "Weekdays", "7:00 AM"),
    recipients: recipients(
      "nathan@handraise.com",
      "rebecca@handraise.com",
      "scott@handraise.com",
      "priya@handraise.com",
      "dana@handraise.com",
    ),
    owner: "Elena F",
    lastGenerated: "Sep 10, 7:00 AM CT",
    editionDate: "Thursday, September 10, 2026",
    editionWindow: "Sep 9, 7:00 AM – Sep 10, 7:00 AM CT",
  },
  {
    id: "brf-exec-weekly",
    name: "Executive Weekly — Leadership",
    templateId: "tpl-exec-summary",
    status: "needs-review",
    overallPrompt:
      "Write for a CEO who has ninety seconds. Lead with the decision, not the coverage. Avoid jargon and never bury a risk below a positive.",
    lookback: "Last 7 days",
    schedule: schedule("Weekly", "Mondays", "9:00 AM"),
    recipients: recipients(
      "leadership@handraise.com",
      "rebecca@handraise.com",
      "marcus@handraise.com",
    ),
    owner: "Elena F",
    lastGenerated: "Sep 8, 9:00 AM CT",
    editionDate: "Monday, September 8, 2026",
    editionWindow: "Sep 1 – Sep 8, 9:00 AM CT",
  },
  {
    id: "brf-competitive-emea",
    name: "Competitive Intel Weekly — EMEA",
    templateId: "tpl-competitive",
    status: "active",
    overallPrompt:
      "Focus on the European category picture. Where a competitor move creates a comparison question for us, say so explicitly and recommend engage or monitor.",
    lookback: "Last 7 days",
    schedule: schedule("Weekly", "Tuesdays", "9:00 AM"),
    recipients: recipients(
      "emea-comms@handraise.com",
      "lucas@handraise.com",
      "renata@handraise.com",
      "ines@handraise.com",
    ),
    owner: "Lucas M",
    lastGenerated: "Sep 8, 9:00 AM CT",
    editionDate: "Tuesday, September 8, 2026",
    editionWindow: "Sep 1 – Sep 8, 9:00 AM CT",
  },
  {
    id: "brf-coverage-monthly",
    name: "Monthly Coverage Report — Corporate",
    templateId: "tpl-coverage-report",
    status: "active",
    overallPrompt:
      "Measurement first. Every claim about the narrative should be supported by a number from the period, and every number should carry its change against the prior period.",
    lookback: "Last 30 days",
    schedule: schedule("Monthly", "1st of month", "8:00 AM"),
    recipients: recipients(
      "reporting@handraise.com",
      "scott@handraise.com",
      "dana@handraise.com",
    ),
    owner: "Elena F",
    lastGenerated: "Sep 1, 8:00 AM CT",
    editionDate: "Tuesday, September 1, 2026",
    editionWindow: "Aug 1 – Sep 1, 8:00 AM CT",
  },
  {
    id: "brf-morning-emea",
    name: "Morning Brief — EMEA Comms",
    templateId: "tpl-morning-brief",
    status: "active",
    overallPrompt:
      "Prioritise European outlets and European policy movement. Treat US-only stories as context unless they carry a direct EMEA implication.",
    lookback: "Last 24 hours",
    schedule: schedule("Daily", "Weekdays", "7:00 AM"),
    recipients: recipients(
      "emea-comms@handraise.com",
      "renata@handraise.com",
      "lucas@handraise.com",
    ),
    owner: "Lucas M",
    lastGenerated: "Sep 10, 7:00 AM CT",
    editionDate: "Thursday, September 10, 2026",
    editionWindow: "Sep 9, 7:00 AM – Sep 10, 7:00 AM CT",
  },
  {
    id: "brf-pipeline-watch",
    name: "Pipeline & R&D Watch",
    templateId: "tpl-exec-summary",
    status: "scheduled",
    overallPrompt:
      "Cover clinical, regulatory and scientific coverage only. Skip financial and pricing stories unless they turn on a pipeline outcome.",
    lookback: "Last 7 days",
    schedule: schedule("Weekly", "Wednesdays", "8:00 AM"),
    recipients: recipients("rnd-comms@handraise.com", "priya@handraise.com"),
    owner: "Priya N",
    lastGenerated: null,
  },
  {
    id: "brf-policy-daily",
    name: "Policy Tracker — Government Affairs",
    templateId: "tpl-morning-brief",
    status: "scheduled",
    overallPrompt:
      "Legislative and regulatory movement only. Every item should carry a date: a hearing, a filing deadline or a comment window.",
    lookback: "Last 36 hours",
    schedule: schedule("Daily", "Weekdays", "6:30 AM"),
    recipients: recipients(
      "govt-affairs@handraise.com",
      "marcus@handraise.com",
      "dana@handraise.com",
    ),
    owner: "Marcus T",
    lastGenerated: null,
  },
  {
    id: "brf-crisis-standby",
    name: "Issue Watch — Access & Affordability",
    templateId: "tpl-crisis-watch",
    status: "paused",
    overallPrompt:
      "Track the affordability narrative continuously. Escalate the moment the story crosses from trade coverage into national outlets.",
    lookback: "Last 24 hours",
    schedule: schedule("Daily", "Daily", "5:00 PM"),
    recipients: recipients("issues@handraise.com", "rebecca@handraise.com"),
    owner: "Rebecca S",
    lastGenerated: "Aug 29, 5:00 PM CT",
    editionDate: "Friday, August 29, 2026",
    editionWindow: "Aug 28, 5:00 PM – Aug 29, 5:00 PM CT",
  },
];

function hydrate(seed: Seed): Briefing {
  const template = getTemplate(seed.templateId);
  const sectionPrompts: Record<string, string> = {};
  for (const s of template?.sections ?? []) {
    sectionPrompts[s.id] = seed.sectionPrompts?.[s.id] ?? s.defaultPrompt;
  }

  return {
    id: seed.id,
    name: seed.name,
    templateId: seed.templateId,
    status: seed.status,
    overallPrompt: seed.overallPrompt,
    lookback: seed.lookback,
    sectionPrompts,
    schedule: seed.schedule,
    recipients: seed.recipients,
    owner: seed.owner,
    lastGenerated: seed.lastGenerated,
    edition: seed.lastGenerated
      ? buildEdition(seed.id, seed.templateId, {
          dateLabel: seed.editionDate ?? "Thursday, September 10, 2026",
          windowLabel: seed.editionWindow ?? "Last 24 hours",
        })
      : null,
  };
}

export const BRIEFINGS: Briefing[] = SEEDS.map(hydrate);

export function getBriefing(id: string): Briefing | undefined {
  return BRIEFINGS.find((b) => b.id === id);
}
