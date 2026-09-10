import type {
  BlockKind,
  Template,
  TemplateBlock,
  TemplateCategory,
  TemplateSection,
} from "@/lib/types";

/**
 * Herald's behaviour in template creation.
 *
 * The user describes the intelligence product they want; Herald derives a
 * structure from that description. Parsing is deterministic keyword analysis —
 * enough to make the interaction feel responsive to what was actually typed.
 */

export const GENERATION_STEPS = [
  "Understanding the request",
  "Generating structure",
  "Adding components",
  "Preview ready",
] as const;

export const REFINEMENT_STEPS = [
  "Reading your change",
  "Refining template",
  "Preview updated",
] as const;

export interface TemplateDraft {
  name: string;
  description: string;
  category: TemplateCategory;
  sections: TemplateSection[];
  blocks: TemplateBlock[];
}

let blockSeq = 0;
function nextId(prefix: string) {
  blockSeq += 1;
  return `${prefix}-${blockSeq}`;
}

const block = (
  kind: BlockKind,
  label: string,
  description: string,
  sectionId?: string,
): TemplateBlock => ({
  id: nextId("blk"),
  kind,
  label,
  description,
  sectionId,
});

/* -------------------------------------------------------------------------- */
/* Request parsing                                                             */
/* -------------------------------------------------------------------------- */

interface ParsedRequest {
  wantsMetrics: boolean;
  metricCount: number;
  wantsLineChart: boolean;
  wantsBarChart: boolean;
  wantsPieChart: boolean;
  wantsTable: boolean;
  wantsStories: boolean;
  wantsSummary: boolean;
  wantsCallout: boolean;
  wantsQuote: boolean;
  wantsBanner: boolean;
  wantsContents: boolean;
  wantsFooter: boolean;
  sectionTitles: string[];
  category: TemplateCategory;
  name: string;
}

const SECTION_LIBRARY: Record<string, { title: string; intent: string }> = {
  "top stories": {
    title: "Top Stories",
    intent: "The stories that change what the team does today.",
  },
  "coverage performance": {
    title: "Coverage Performance",
    intent: "The measurement layer: how much, what tone, where.",
  },
  "at a glance": {
    title: "Coverage Performance",
    intent: "The measurement layer: how much, what tone, where.",
  },
  policy: {
    title: "Policy & Access",
    intent: "Regulatory, pricing and reimbursement movement.",
  },
  competitive: {
    title: "Competitive Watch",
    intent: "Competitor moves that change our positioning.",
  },
  competitor: {
    title: "Competitive Watch",
    intent: "Competitor moves that change our positioning.",
  },
  narrative: {
    title: "Narrative Themes",
    intent: "The themes coverage clustered around, ranked by weight.",
  },
  executive: {
    title: "Executive Summary",
    intent: "One paragraph a leader can read and act on.",
  },
  summary: {
    title: "Executive Summary",
    intent: "One paragraph a leader can read and act on.",
  },
  sentiment: {
    title: "Sentiment & Tone",
    intent: "How the coverage is landing, not just how much there is.",
  },
  social: {
    title: "Social & Amplification",
    intent: "Where the story travelled beyond earned media.",
  },
  risk: {
    title: "Risk Watch",
    intent: "Items likely to require a decision this week.",
  },
  pipeline: {
    title: "Pipeline & R&D",
    intent: "Clinical, regulatory and scientific developments.",
  },
  crisis: {
    title: "Situation Status",
    intent: "Where the issue stands right now, in plain language.",
  },
  amplification: {
    title: "Amplification",
    intent: "Who is carrying the story and how far it has travelled.",
  },
  response: {
    title: "Response Tracking",
    intent: "How our position is landing where it has been quoted.",
  },
  "top articles": {
    title: "Top Coverage",
    intent: "The individual placements worth reading in full.",
  },
  "top coverage": {
    title: "Top Coverage",
    intent: "The individual placements worth reading in full.",
  },
};

/** Sections that carry the measurement layer of a report. */
const MEASUREMENT_SECTIONS = new Set([
  "Coverage Performance",
  "Share of Voice",
  "Sentiment & Tone",
  "Amplification",
]);

/** Sections that carry individual placements. */
const CONTENT_SECTIONS = new Set([
  "Top Stories",
  "Top Coverage",
  "Competitive Watch",
  "Policy & Access",
  "Pipeline & R&D",
  "Social & Amplification",
]);

/**
 * Pulls section titles out of an explicit "1. X 2. Y 3. Z" list. Splitting on
 * the markers is more reliable than matching each title, because titles vary in
 * length and can contain ampersands and spaces.
 */
function parseEnumerated(request: string): string[] {
  return request
    .split(/(?:^|\s)\d+\.\s*/)
    .slice(1)
    // A title runs until the sentence ends; anything after that is instruction.
    .map((part) => part.split(/\.(?:\s|$)/)[0].replace(/[,;:]\s*$/, "").trim())
    .filter((t) => t.length >= 3 && t.length <= 40 && /^[A-Za-z]/.test(t));
}

/** Position of the earliest of several needles, or -1. */
function firstIndexOf(haystack: string, needles: string[]): number {
  let best = -1;
  for (const n of needles) {
    const at = haystack.indexOf(n);
    if (at >= 0 && (best === -1 || at < best)) best = at;
  }
  return best;
}

function parse(request: string): ParsedRequest {
  const q = request.toLowerCase();

  const metricMatch = q.match(/(\d+)\s*(kpis?|kpi's|metrics?|numbers?)/);
  const wantsMetrics =
    !!metricMatch || /\bkpi|metric|at a glance|scorecard|numbers\b/.test(q);
  const metricCount = metricMatch ? clamp(parseInt(metricMatch[1], 10), 2, 4) : 4;

  const wantsLineChart =
    /line chart|trend|over.time|coverage-over-time|time series|trajectory/.test(q);
  const wantsPieChart =
    /pie chart|share of voice|donut|split by|breakdown by/.test(q);
  // An unqualified "chart" becomes a bar chart, the most general of the three.
  const wantsBarChart =
    /bar chart|by day|volume chart|column chart/.test(q) ||
    (/\bchart\b/.test(q) && !wantsLineChart && !wantsPieChart);
  const wantsTable = /table|list of|ranked|breakdown|log\b/.test(q);
  const wantsStories =
    /article|story|stories|coverage|placement|clips|headlines/.test(q) ||
    (!wantsTable && !wantsMetrics);
  const wantsSummary = !/no summary|without.*summary/.test(q);
  const wantsCallout = /callout|highlight|flag|watch item|risk/.test(q);
  const wantsQuote = /quote|pull quote|soundbite/.test(q);

  // Explicit "1. X 2. Y 3. Z" enumerations win over keyword detection.
  let sectionTitles = parseEnumerated(request);

  if (!sectionTitles.length) {
    // Track where each trigger appeared so sections come back in the order the
    // user described them, rather than in dictionary order.
    const found: { title: string; at: number }[] = [];
    const add = (title: string, at: number) => {
      if (at >= 0 && !found.some((f) => f.title === title)) found.push({ title, at });
    };

    for (const [key, val] of Object.entries(SECTION_LIBRARY)) {
      add(val.title, q.indexOf(key));
    }

    // A report that measures *and* lists coverage needs a section for each.
    // Without this, "4 KPIs, a chart and a top articles table" collapses into a
    // single section and the articles have nowhere sensible to sit.
    const measureAt = firstIndexOf(q, [
      "kpi",
      "metric",
      "scorecard",
      "chart",
      "trend",
      "share of voice",
      "volume",
    ]);
    const listAt = firstIndexOf(q, [
      "top article",
      "top coverage",
      "article",
      "story",
      "stories",
      "placement",
      "headline",
      "clips",
      "table",
    ]);

    if (measureAt >= 0 && !found.some((f) => MEASUREMENT_SECTIONS.has(f.title))) {
      add("Coverage Performance", measureAt);
    }
    if (listAt >= 0 && !found.some((f) => CONTENT_SECTIONS.has(f.title))) {
      add(
        /top articles|top coverage|top placements/.test(q)
          ? "Top Coverage"
          : "Top Stories",
        listAt,
      );
    }

    // A lone analysis section has nothing to evidence itself with; pair it
    // with the stories that support the read.
    if (found.length === 1 && !CONTENT_SECTIONS.has(found[0].title)) {
      found.push({ title: "Top Stories", at: Number.MAX_SAFE_INTEGER });
    }

    found.sort((a, b) => a.at - b.at);
    sectionTitles = found.map((f) => f.title);
  }

  if (!sectionTitles.length) {
    sectionTitles = ["Top Stories", "Analysis"];
  }
  sectionTitles = sectionTitles.slice(0, 5);

  return {
    wantsMetrics,
    metricCount,
    wantsLineChart,
    wantsBarChart,
    wantsPieChart,
    wantsTable,
    wantsStories,
    wantsSummary,
    wantsCallout,
    wantsQuote,
    sectionTitles,
    wantsBanner: !/no banner|without.*banner/.test(q),
    wantsContents: !/no (table of contents|contents)|without.*contents/.test(q),
    wantsFooter: true,
    category: deriveCategory(q),
    name: deriveName(q),
  };
}

function deriveCategory(q: string): TemplateCategory {
  if (/daily|morning|every day|each morning/.test(q)) return "Daily briefing";
  if (/executive|ceo|leadership|board/.test(q)) return "Executive summary";
  if (/competitive|competitor|share of voice/.test(q))
    return "Competitive intelligence";
  if (/crisis|issue|escalat/.test(q)) return "Crisis monitoring";
  if (/campaign|launch|announcement recap/.test(q)) return "Campaign report";
  return "Weekly report";
}

function deriveName(q: string): string {
  if (/morning/.test(q)) return "Morning Briefing";
  if (/executive/.test(q)) return "Executive Summary Report";
  if (/competitive|competitor/.test(q)) return "Competitive Intelligence Report";
  if (/crisis|issue/.test(q)) return "Issue Monitoring Report";
  if (/campaign/.test(q)) return "Campaign Performance Report";
  if (/coverage report|media coverage/.test(q)) return "Media Coverage Report";
  return "Custom Intelligence Report";
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/* -------------------------------------------------------------------------- */
/* Structure generation                                                        */
/* -------------------------------------------------------------------------- */

export function generateDraft(request: string): TemplateDraft {
  const p = parse(request);

  const sections: TemplateSection[] = p.sectionTitles.map((title, i) => {
    const known = Object.values(SECTION_LIBRARY).find((s) => s.title === title);
    const id = `sec-gen-${slug(title)}-${i}`;
    return {
      id,
      title,
      intent: known?.intent ?? `Content for ${title.toLowerCase()}.`,
      promptPlaceholder: `e.g. what ${title.toLowerCase()} should cover…`,
      defaultPrompt: `Cover ${title.toLowerCase()} for the lookback window, ordered by likely impact on the audience for this briefing.`,
    };
  });

  const blocks: TemplateBlock[] = [];

  if (p.wantsBanner) {
    blocks.push(block("banner", "Banner", "Client logo lockup and brand banner"));
  }
  if (p.wantsContents) {
    blocks.push(block("contents", "Contents", "Auto-generated from sections"));
  }

  sections.forEach((section, index) => {
    blocks.push(
      block("sectionTitle", "Section title", "Title of section", section.id),
    );

    if (p.wantsSummary) {
      blocks.push(
        block("summary", "Summary", "Summary of section content", section.id),
      );
    }

    // Measurement components go in the first section, where the numbers belong.
    if (index === 0) {
      if (p.wantsMetrics) {
        blocks.push(
          block(
            "metrics",
            "Metrics",
            `${p.metricCount} KPIs with period-over-period change`,
            section.id,
          ),
        );
      }
      if (p.wantsLineChart) {
        blocks.push(
          block(
            "lineChart",
            "Coverage over time",
            "Volume trend across the period",
            section.id,
          ),
        );
      }
      if (p.wantsBarChart) {
        blocks.push(
          block(
            "barChart",
            "Coverage by day",
            "Volume by day across the period",
            section.id,
          ),
        );
      }
      if (p.wantsPieChart) {
        blocks.push(
          block("pieChart", "Share of voice", "Category split", section.id),
        );
      }
      if (p.wantsCallout) {
        blocks.push(
          block("callout", "Callout", "Highlighted risk or opportunity", section.id),
        );
      }
    }

    if (p.wantsTable && index === Math.min(1, sections.length - 1)) {
      blocks.push(block("table", "Table", "Ranked breakdown", section.id));
    }
    if (p.wantsQuote && index === sections.length - 1) {
      blocks.push(block("quote", "Quote", "Pull quote from coverage", section.id));
    }
    if (p.wantsStories) {
      blocks.push(
        block("stories", "Stories", "Articles matching prompt criteria", section.id),
      );
    }
  });

  if (p.wantsFooter) {
    blocks.push(block("footer", "Footer", "Attribution, metadata"));
  }

  return {
    name: p.name,
    description: summariseStructure(p, sections),
    category: p.category,
    sections,
    blocks,
  };
}

function summariseStructure(p: ParsedRequest, sections: TemplateSection[]): string {
  const parts: string[] = [];
  if (p.wantsMetrics) parts.push(`${p.metricCount} KPIs`);
  if (p.wantsLineChart) parts.push("a coverage-over-time chart");
  if (p.wantsBarChart) parts.push("a volume chart");
  if (p.wantsPieChart) parts.push("a share-of-voice chart");
  if (p.wantsTable) parts.push("a ranked table");
  if (p.wantsStories) parts.push("article lists");

  const componentPhrase = parts.length ? ` with ${formatList(parts)}` : "";
  return `${sections.length} section${sections.length === 1 ? "" : "s"}${componentPhrase} — ${formatList(sections.map((s) => s.title))}.`;
}

/* -------------------------------------------------------------------------- */
/* Refinement                                                                  */
/* -------------------------------------------------------------------------- */

export interface RefinementResult {
  draft: TemplateDraft;
  reply: string;
  changes: string[];
}

/**
 * Applies a follow-up instruction to an existing draft. Handles the refinements
 * that matter for the demo: adding and removing components and sections.
 */
export function refineDraft(
  draft: TemplateDraft,
  instruction: string,
): RefinementResult {
  const q = instruction.toLowerCase();
  const changes: string[] = [];
  let blocks = [...draft.blocks];
  let sections = [...draft.sections];

  const firstSectionId = sections[0]?.id;
  const lastSectionId = sections[sections.length - 1]?.id;

  const removing = /\b(remove|drop|delete|take out|get rid of|without)\b/.test(q);

  const addBefore = (b: TemplateBlock, sectionId?: string) => {
    // Insert after the section's summary if it has one, else after its title.
    const anchor = blocks.findIndex(
      (x) =>
        x.sectionId === sectionId && (x.kind === "summary" || x.kind === "sectionTitle"),
    );
    const lastAnchor = blocks.reduce(
      (acc, x, i) =>
        x.sectionId === sectionId && (x.kind === "summary" || x.kind === "sectionTitle")
          ? i
          : acc,
      anchor,
    );
    if (lastAnchor >= 0) blocks.splice(lastAnchor + 1, 0, b);
    else blocks.push(b);
  };

  const dropKind = (kind: BlockKind, label: string) => {
    const before = blocks.length;
    blocks = blocks.filter((b) => b.kind !== kind);
    if (blocks.length !== before) changes.push(`Removed ${label}`);
  };

  const hasKind = (kind: BlockKind) => blocks.some((b) => b.kind === kind);

  /* Charts ---------------------------------------------------------------- */
  if (/line chart|trend|over.time|time series/.test(q)) {
    if (removing) dropKind("lineChart", "the coverage-over-time chart");
    else if (!hasKind("lineChart")) {
      addBefore(
        block("lineChart", "Coverage over time", "Volume trend across the period", firstSectionId),
        firstSectionId,
      );
      changes.push("Added a coverage-over-time chart");
    }
  }
  if (/bar chart|by day|column chart|volume chart/.test(q)) {
    if (removing) dropKind("barChart", "the volume chart");
    else if (!hasKind("barChart")) {
      addBefore(
        block("barChart", "Coverage by day", "Volume by day across the period", firstSectionId),
        firstSectionId,
      );
      changes.push("Added a volume-by-day chart");
    }
  }
  if (/pie chart|share of voice|donut/.test(q)) {
    if (removing) dropKind("pieChart", "the share-of-voice chart");
    else if (!hasKind("pieChart")) {
      addBefore(
        block("pieChart", "Share of voice", "Category split", firstSectionId),
        firstSectionId,
      );
      changes.push("Added a share-of-voice chart");
    }
  }

  /* Metrics ---------------------------------------------------------------- */
  if (/\bkpi|metric|scorecard|at a glance\b/.test(q)) {
    if (removing) dropKind("metrics", "the KPI row");
    else {
      const countMatch = q.match(/(\d+)\s*(kpis?|kpi's|metrics?)/);
      const count = countMatch ? clamp(parseInt(countMatch[1], 10), 2, 4) : 4;
      const existing = blocks.find((b) => b.kind === "metrics");
      if (existing) {
        existing.description = `${count} KPIs with period-over-period change`;
        changes.push(`Set the KPI row to ${count} metrics`);
      } else {
        addBefore(
          block("metrics", "Metrics", `${count} KPIs with period-over-period change`, firstSectionId),
          firstSectionId,
        );
        changes.push(`Added a ${count}-KPI row`);
      }
    }
  }

  /* Table, quote, callout --------------------------------------------------- */
  if (/table/.test(q)) {
    if (removing) dropKind("table", "the table");
    else if (!hasKind("table")) {
      addBefore(block("table", "Table", "Ranked breakdown", lastSectionId), lastSectionId);
      changes.push("Added a ranked table");
    }
  }
  if (/quote/.test(q)) {
    if (removing) dropKind("quote", "the pull quote");
    else if (!hasKind("quote")) {
      addBefore(block("quote", "Quote", "Pull quote from coverage", lastSectionId), lastSectionId);
      changes.push("Added a pull quote");
    }
  }
  if (/callout|highlight|watch item/.test(q)) {
    if (removing) dropKind("callout", "the callout");
    else if (!hasKind("callout")) {
      addBefore(
        block("callout", "Callout", "Highlighted risk or opportunity", firstSectionId),
        firstSectionId,
      );
      changes.push("Added a callout");
    }
  }
  if (/banner/.test(q) && removing) dropKind("banner", "the banner");
  if (/contents|table of contents|toc/.test(q) && removing)
    dropKind("contents", "the contents block");
  if (/summary|summaries/.test(q) && removing)
    dropKind("summary", "the section summaries");

  /* Sections ---------------------------------------------------------------- */
  const sectionAdd = q.match(
    /add (?:an?|another)?\s*(?:section (?:called|named|for)?\s*)?["“']?([\w &'-]{3,40})["”']?\s*section/,
  );
  const namedSection = sectionAdd?.[1]?.trim();

  if (/\bsection\b/.test(q) && !removing) {
    const title =
      namedSection ??
      Object.entries(SECTION_LIBRARY).find(([k]) => q.includes(k))?.[1].title;
    if (title && !sections.some((s) => s.title.toLowerCase() === title.toLowerCase())) {
      const id = `sec-gen-${slug(title)}-${sections.length}`;
      sections = [
        ...sections,
        {
          id,
          title: titleCase(title),
          intent: `Content for ${title.toLowerCase()}.`,
          promptPlaceholder: `e.g. what ${title.toLowerCase()} should cover…`,
          defaultPrompt: `Cover ${title.toLowerCase()} for the lookback window, ordered by likely impact.`,
        },
      ];
      const footerIndex = blocks.findIndex((b) => b.kind === "footer");
      const newBlocks = [
        block("sectionTitle", "Section title", "Title of section", id),
        block("summary", "Summary", "Summary of section content", id),
        block("stories", "Stories", "Articles matching prompt criteria", id),
      ];
      if (footerIndex >= 0) blocks.splice(footerIndex, 0, ...newBlocks);
      else blocks.push(...newBlocks);
      changes.push(`Added a ${titleCase(title)} section`);
    }
  }

  if (/\bsection\b/.test(q) && removing) {
    const target = sections.find((s) =>
      s.title
        .toLowerCase()
        .split(/\W+/)
        .some((w) => w.length > 3 && q.includes(w)),
    );
    if (target) {
      sections = sections.filter((s) => s.id !== target.id);
      blocks = blocks.filter((b) => b.sectionId !== target.id);
      changes.push(`Removed the ${target.title} section`);
    }
  }

  /* Rename ------------------------------------------------------------------ */
  const renameMatch = instruction.match(
    /(?:call|name|rename) (?:it|the (?:template|report)) ["“']?([^"”']{3,60})["”']?/i,
  );
  const name = renameMatch ? titleCase(renameMatch[1].trim()) : draft.name;
  if (renameMatch) changes.push(`Renamed the template to “${name}”`);

  const next: TemplateDraft = {
    ...draft,
    name,
    sections,
    blocks,
    description: rebuildDescription(sections, blocks),
  };

  const reply = changes.length
    ? `Updated the structure. ${changes.length === 1 ? "One change" : `${changes.length} changes`} — the preview on the right reflects it now.`
    : "I did not find a structural change in that. Try naming a component — a KPI row, a chart, a table, a quote, a callout — or a section to add or remove.";

  return { draft: next, reply, changes };
}

function rebuildDescription(
  sections: TemplateSection[],
  blocks: TemplateBlock[],
): string {
  const parts: string[] = [];
  const metrics = blocks.find((b) => b.kind === "metrics");
  if (metrics) parts.push(metrics.description.replace(" with period-over-period change", ""));
  if (blocks.some((b) => b.kind === "lineChart")) parts.push("a coverage-over-time chart");
  if (blocks.some((b) => b.kind === "barChart")) parts.push("a volume chart");
  if (blocks.some((b) => b.kind === "pieChart")) parts.push("a share-of-voice chart");
  if (blocks.some((b) => b.kind === "table")) parts.push("a ranked table");
  if (blocks.some((b) => b.kind === "stories")) parts.push("article lists");

  const componentPhrase = parts.length ? ` with ${formatList(parts)}` : "";
  return `${sections.length} section${sections.length === 1 ? "" : "s"}${componentPhrase} — ${formatList(sections.map((s) => s.title))}.`;
}

/** Herald's opening reply once a structure has been generated. */
export function generationReply(draft: TemplateDraft): string {
  const componentCount = draft.blocks.length;
  return `Here is the structure. ${draft.sections.length} section${draft.sections.length === 1 ? "" : "s"} across ${componentCount} components: ${formatList(draft.sections.map((s) => s.title))}. The preview on the right shows sample data — live editions will use the section prompts set on each briefing. Tell me what to change, or create the template as it stands.`;
}

/** Converts a finished draft into a saved template. */
export function draftToTemplate(draft: TemplateDraft, id: string): Template {
  return {
    id,
    name: draft.name,
    description: draft.description,
    category: draft.category,
    updatedAt: formatToday(),
    createdBy: "Handraise editorial",
    sections: draft.sections,
    blocks: draft.blocks,
  };
}

/* -------------------------------------------------------------------------- */

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function titleCase(text: string) {
  return text
    .split(" ")
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function formatList(items: string[]): string {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const TEMPLATE_PROMPT_SUGGESTIONS = [
  "Give me a morning briefing on the narratives shaping coverage today.",
  "Media coverage report with 4 KPIs, a coverage-over-time chart, and a top articles table.",
  "Executive summary with key metrics and a trends line chart.",
];
