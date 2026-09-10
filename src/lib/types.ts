/**
 * Domain model for Scheduled Briefings.
 *
 * The product model, in one place:
 *   Template  — a fixed structure (which blocks exist, in what order).
 *   Briefing  — a configured instance of a template (prompts, schedule, recipients).
 *   Edition   — the generated intelligence product for one run of a briefing.
 *   Herald    — the intelligence layer that creates, explains and refines all three.
 */

/* -------------------------------------------------------------------------- */
/* Templates                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The block vocabulary Herald composes templates from. These are structural
 * primitives, not a user-facing component library — customers never place them
 * by hand.
 */
export type BlockKind =
  | "banner"
  | "header"
  | "contents"
  | "sectionTitle"
  | "summary"
  | "metrics"
  | "stories"
  | "table"
  | "barChart"
  | "lineChart"
  | "pieChart"
  | "callout"
  | "quote"
  | "image"
  | "links"
  | "divider"
  | "footer";

export interface TemplateBlock {
  id: string;
  kind: BlockKind;
  /** Display name in the structure list, e.g. "Coverage over time". */
  label: string;
  /** One-line explanation of what the block renders. */
  description: string;
  /** Section this block belongs to, if any. Structural blocks have none. */
  sectionId?: string;
}

/** A named section of a template. Briefings write a prompt per section. */
export interface TemplateSection {
  id: string;
  title: string;
  /** What this section is for — shown as helper text when configuring. */
  intent: string;
  /** Placeholder prompt shown in the briefing configuration form. */
  promptPlaceholder: string;
  /** Prompt used when a briefing is created without overriding it. */
  defaultPrompt: string;
}

export type TemplateCategory =
  | "Daily briefing"
  | "Weekly report"
  | "Executive summary"
  | "Competitive intelligence"
  | "Crisis monitoring"
  | "Campaign report";

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  updatedAt: string;
  createdBy: string;
  sections: TemplateSection[];
  blocks: TemplateBlock[];
}

/* -------------------------------------------------------------------------- */
/* Briefings                                                                   */
/* -------------------------------------------------------------------------- */

export type BriefingStatus = "needs-review" | "active" | "scheduled" | "paused";

export type Frequency = "Daily" | "Weekly" | "Monthly" | "Quarterly";

export type Lookback =
  | "Last 24 hours"
  | "Last 36 hours"
  | "Last 3 days"
  | "Last 7 days"
  | "Last 14 days"
  | "Last 30 days";

export interface Schedule {
  frequency: Frequency;
  /** Day label rendered in the table, e.g. "Thursdays" or "1st of month". */
  day: string;
  /** Send time, e.g. "4:00 PM". */
  time: string;
  timezone: string;
  /** Short timezone label used in dense table cells, e.g. "CT". */
  timezoneShort: string;
}

export interface Recipient {
  id: string;
  email: string;
  /** Two-letter monogram for the avatar stack. */
  initials: string;
}

export interface Briefing {
  id: string;
  name: string;
  templateId: string;
  status: BriefingStatus;
  /** The briefing-wide instruction that frames every section. */
  overallPrompt: string;
  lookback: Lookback;
  /** Section id -> prompt for that section on this briefing. */
  sectionPrompts: Record<string, string>;
  schedule: Schedule;
  recipients: Recipient[];
  owner: string;
  /** Formatted timestamp of the most recent generated edition. */
  lastGenerated: string | null;
  /** The generated edition attached to this briefing, if one has run. */
  edition: Edition | null;
}

/* -------------------------------------------------------------------------- */
/* Generated editions                                                          */
/* -------------------------------------------------------------------------- */

export type Sentiment = "positive" | "neutral" | "negative";

export interface Article {
  id: string;
  headline: string;
  publication: string;
  date: string;
  /** Article body summary — editable, and the target of inline editing. */
  summary: string;
  /** Herald's analysis of why the story matters to this audience. */
  whyItMatters: string;
  sentiment: Sentiment;
  /** Reach figure shown in the article meta row, e.g. "2.4M". */
  reach: string;
  topic: string;
}

export interface Metric {
  id: string;
  label: string;
  value: string;
  /** Signed change vs. the previous period, e.g. "+18%". */
  delta: string;
  direction: "up" | "down" | "flat";
  /** Whether an increase is good news for comms. Drives the delta colour. */
  positiveIsGood: boolean;
}

export interface ChartPoint {
  label: string;
  value: number;
  /** Optional split used by the stacked coverage chart. */
  negative?: number;
}

export interface TableRow {
  cells: string[];
}

/**
 * A rendered block inside a generated edition. The `kind` mirrors the
 * template block it came from; the payload is whatever that block renders.
 */
export type EditionBlock =
  | { id: string; kind: "banner"; title: string; subtitle: string }
  | { id: string; kind: "contents"; entries: { id: string; title: string }[] }
  | { id: string; kind: "sectionTitle"; title: string; sectionId: string }
  | { id: string; kind: "summary"; text: string; sectionId?: string }
  | { id: string; kind: "metrics"; metrics: Metric[]; sectionId?: string }
  | { id: string; kind: "stories"; articles: Article[]; sectionId: string }
  | {
      id: string;
      kind: "table";
      columns: string[];
      rows: TableRow[];
      sectionId?: string;
    }
  | {
      id: string;
      kind: "barChart" | "lineChart";
      title: string;
      points: ChartPoint[];
      sectionId?: string;
    }
  | {
      id: string;
      kind: "pieChart";
      title: string;
      points: ChartPoint[];
      sectionId?: string;
    }
  | {
      id: string;
      kind: "callout";
      tone: "risk" | "opportunity" | "note";
      title: string;
      text: string;
      sectionId?: string;
    }
  | {
      id: string;
      kind: "quote";
      text: string;
      attribution: string;
      sectionId?: string;
    }
  | { id: string; kind: "divider" }
  | { id: string; kind: "footer"; text: string };

export interface Edition {
  id: string;
  briefingId: string;
  /** Human date shown under the edition title, e.g. "Thursday, September 10, 2026". */
  dateLabel: string;
  /** Window the intelligence was drawn from, e.g. "Sep 9, 4:00 PM – Sep 10, 4:00 PM CT". */
  windowLabel: string;
  /** Total articles Herald read before selecting the ones below. */
  articlesScanned: number;
  blocks: EditionBlock[];
}

/* -------------------------------------------------------------------------- */
/* Herald                                                                      */
/* -------------------------------------------------------------------------- */

export type HeraldRole = "herald" | "user";

export interface HeraldMessage {
  id: string;
  role: HeraldRole;
  text: string;
  /** Rendered under the message as a record of what Herald changed. */
  changes?: string[];
  /** Progress states shown while Herald "works" (template creation). */
  steps?: string[];
}
