"use client";

import { LockSimpleIcon, SparkleIcon } from "@phosphor-icons/react";
import { notFound, useRouter } from "next/navigation";
import { use, useMemo, useState } from "react";

import { ConfigPreview } from "@/components/briefing/config-preview";
import { RecipientInput } from "@/components/briefing/recipient-input";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { ConfigSection, CreationShell } from "@/components/workflow/creation-shell";
import { initialsFromEmail } from "@/lib/data/briefings";
import { buildEdition } from "@/lib/data/editions";
import { cx, formatNextRun, todayLabel } from "@/lib/format";
import { uid, useStore } from "@/lib/store";
import type {
  Briefing,
  Frequency,
  Lookback,
  Recipient,
  Schedule,
} from "@/lib/types";

const LOOKBACKS: Lookback[] = [
  "Last 24 hours",
  "Last 36 hours",
  "Last 3 days",
  "Last 7 days",
  "Last 14 days",
  "Last 30 days",
];

const FREQUENCIES: Frequency[] = ["Daily", "Weekly", "Monthly", "Quarterly"];

const DAY_OPTIONS: Record<Frequency, string[]> = {
  Daily: ["Weekdays", "Every day"],
  Weekly: [
    "Mondays",
    "Tuesdays",
    "Wednesdays",
    "Thursdays",
    "Fridays",
  ],
  Monthly: ["1st of month", "15th of month", "Last day of month"],
  Quarterly: ["First Monday of quarter", "Last Friday of quarter"],
};

const TIMES = [
  "6:00 AM",
  "6:30 AM",
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "12:00 PM",
  "4:00 PM",
  "5:00 PM",
];

const TIMEZONES = [
  { value: "America/Chicago (GMT -05:00)", short: "CT" },
  { value: "America/New_York (GMT -04:00)", short: "ET" },
  { value: "America/Los_Angeles (GMT -07:00)", short: "PT" },
  { value: "Europe/London (GMT +01:00)", short: "BST" },
  { value: "Europe/Berlin (GMT +02:00)", short: "CEST" },
];

const DEFAULT_RECIPIENTS = ["nathan@handraise.com", "rebecca@handraise.com"];

/** B3 — New Briefing. Configure a template into a briefing. */
export default function NewBriefingPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = use(params);
  const router = useRouter();
  const { getTemplate, addBriefing, pushToast } = useStore();

  const template = getTemplate(templateId);
  if (!template) notFound();

  const [name, setName] = useState("");
  const [overallPrompt, setOverallPrompt] = useState("");
  const [lookback, setLookback] = useState<Lookback>("Last 24 hours");
  const [sectionPrompts, setSectionPrompts] = useState<Record<string, string>>(
    () => Object.fromEntries(template.sections.map((s) => [s.id, ""])),
  );
  const [frequency, setFrequency] = useState<Frequency>("Weekly");
  const [day, setDay] = useState("Mondays");
  const [time, setTime] = useState("9:00 AM");
  const [timezone, setTimezone] = useState(TIMEZONES[0].value);
  const [recipients, setRecipients] = useState<Recipient[]>(() =>
    DEFAULT_RECIPIENTS.map((email, i) => ({
      id: `rcp-seed-${i}`,
      email,
      initials: initialsFromEmail(email),
    })),
  );
  const [creating, setCreating] = useState(false);

  const trimmedName = name.trim();
  const canCreate = trimmedName.length > 0 && recipients.length > 0 && !creating;

  const schedule: Schedule = useMemo(
    () => ({
      frequency,
      day,
      time,
      timezone,
      timezoneShort:
        TIMEZONES.find((t) => t.value === timezone)?.short ?? "CT",
    }),
    [frequency, day, time, timezone],
  );

  function changeFrequency(next: Frequency) {
    setFrequency(next);
    // Keep the day option valid for the new cadence.
    if (!DAY_OPTIONS[next].includes(day)) setDay(DAY_OPTIONS[next][0]);
  }

  function create() {
    if (!canCreate || !template) return;
    setCreating(true);

    const id = uid("brf");
    const resolvedPrompts: Record<string, string> = {};
    for (const section of template.sections) {
      resolvedPrompts[section.id] =
        sectionPrompts[section.id]?.trim() || section.defaultPrompt;
    }

    const briefing: Briefing = {
      id,
      name: trimmedName,
      templateId: template.id,
      status: "scheduled",
      overallPrompt:
        overallPrompt.trim() ||
        "Summarise the window for a senior communications audience, leading with the most consequential story.",
      lookback,
      sectionPrompts: resolvedPrompts,
      schedule,
      recipients,
      owner: "Elena F",
      // Scheduled briefings have not run yet, but the prototype attaches a
      // first edition so the briefing is reviewable straight away.
      lastGenerated: formatNextRun(schedule),
      edition: buildEdition(id, template.id, {
        dateLabel: todayLabel(),
        windowLabel: lookback,
      }),
    };

    addBriefing(briefing);
    pushToast({
      tone: "success",
      title: "Briefing created",
      description: `“${briefing.name}” will run ${schedule.day.toLowerCase()} at ${schedule.time} ${schedule.timezoneShort}.`,
    });
    router.push("/briefings");
  }

  return (
    <CreationShell
      title={
        trimmedName ? (
          <>
            New briefing:{" "}
            <span className="text-grey-600">“{trimmedName}”</span>
          </>
        ) : (
          "New briefing"
        )
      }
      onClose={() => router.push("/briefings")}
      steps={[
        { id: "choose", label: "Choose template", state: "done" },
        { id: "configure", label: "Configure", state: "current" },
      ]}
      actions={
        <Button variant="primary" disabled={!canCreate} onClick={create}>
          {creating ? "Creating…" : "Create briefing"}
        </Button>
      }
    >
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        {/* Configuration */}
        <div
          className={cx(
            "scrollbar-thin flex min-h-0 shrink-0 flex-col overflow-y-auto bg-white",
            "border-b border-grey-200 lg:w-[min(46%,520px)] lg:border-r lg:border-b-0",
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-grey-200 px-5 py-3 sm:px-6">
            <p className="text-[13px] text-grey-600">
              Built on{" "}
              <span className="font-medium text-grey-900">{template.name}</span>
            </p>
            <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-grey-500">
              <LockSimpleIcon size={12} />
              Layout locked
            </span>
          </div>

          <ConfigSection label="Basics">
            <div>
              <Label htmlFor="briefing-name">Briefing name</Label>
              <Input
                id="briefing-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning Brief — US Comms"
              />
            </div>
            <div>
              <Label htmlFor="overall-prompt" hint="Optional">
                Overall prompt
              </Label>
              <Textarea
                id="overall-prompt"
                rows={3}
                value={overallPrompt}
                onChange={(e) => setOverallPrompt(e.target.value)}
                placeholder="How should Herald frame every section? e.g. Write for a senior comms audience and lead with the most consequential story."
              />
            </div>
          </ConfigSection>

          <ConfigSection
            label="Lookback"
            hint="How far back Herald reads when it generates each edition."
          >
            <Select
              aria-label="Lookback period"
              value={lookback}
              onChange={(e) => setLookback(e.target.value as Lookback)}
            >
              {LOOKBACKS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </ConfigSection>

          <ConfigSection
            label="Section prompts"
            hint="The template fixes which sections exist. You decide what each one looks for."
          >
            {template.sections.map((section) => (
              <div key={section.id}>
                <Label htmlFor={`prompt-${section.id}`}>{section.title}</Label>
                <Textarea
                  id={`prompt-${section.id}`}
                  rows={3}
                  value={sectionPrompts[section.id] ?? ""}
                  onChange={(e) =>
                    setSectionPrompts((prev) => ({
                      ...prev,
                      [section.id]: e.target.value,
                    }))
                  }
                  placeholder={section.promptPlaceholder}
                />
                <p className="mt-1.5 text-[12px] leading-[18px] text-grey-500">
                  {section.intent}
                </p>
              </div>
            ))}
          </ConfigSection>

          <ConfigSection label="Schedule">
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                id="frequency"
                value={frequency}
                onChange={(e) => changeFrequency(e.target.value as Frequency)}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="day">Runs on</Label>
                <Select
                  id="day"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                >
                  {DAY_OPTIONS[frequency].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="time">Send time</Label>
                <Select
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                >
                  {TIMES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {TIMEZONES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.value}
                  </option>
                ))}
              </Select>
            </div>
          </ConfigSection>

          <ConfigSection
            label="Recipients"
            hint="Each recipient receives the edition once it has been approved and sent."
          >
            <div>
              <Label>Recipient emails</Label>
              <RecipientInput recipients={recipients} onChange={setRecipients} />
            </div>
          </ConfigSection>

          <div className="border-t border-grey-200 bg-grey-50 px-5 py-4 sm:px-6">
            <p className="flex items-start gap-2 text-[12px] leading-[18px] text-grey-600">
              <SparkleIcon
                size={13}
                weight="fill"
                className="mt-0.5 shrink-0 text-violet-700"
              />
              <span>
                Herald takes over once this briefing runs. From the review screen
                you can rewrite any passage, swap articles and ask what was left
                out — without changing the template.
              </span>
            </p>
          </div>
        </div>

        {/* Live preview */}
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-grey-50">
          <div className="mx-auto max-w-[760px] px-5 py-6 sm:px-8 sm:py-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="label-caps">Preview</p>
              <p className="text-[12px] text-grey-500">
                Structure from the template · content generated on first run
              </p>
            </div>
            <ConfigPreview
              template={template}
              title={trimmedName}
              sectionPrompts={sectionPrompts}
              lookback={lookback}
            />
          </div>
        </div>
      </div>
    </CreationShell>
  );
}
