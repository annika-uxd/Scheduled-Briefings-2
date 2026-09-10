/**
 * Deterministic text transforms behind the inline selection popover.
 *
 * These are rule-based rewrites, not a language model. They are written to be
 * legible and predictable: the same selection plus the same instruction always
 * produces the same result, which is what makes the prototype demoable.
 */

export interface InlineEditIntent {
  id: string;
  /** Chip label shown in the popover. */
  label: string;
  /** Words that route a typed instruction to this intent. */
  keywords: string[];
  /** Past-tense description of the change, shown in Herald's reply. */
  describe: string;
  apply: (text: string) => string;
}

/* -------------------------------------------------------------------------- */
/* Sentence helpers                                                            */
/* -------------------------------------------------------------------------- */

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function join(parts: string[]): string {
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** Replaces whole words using a lookup, preserving leading-capital casing. */
function replaceWords(text: string, map: Record<string, string>): string {
  let out = text;
  for (const [from, to] of Object.entries(map)) {
    const re = new RegExp(`\\b${from}\\b`, "gi");
    out = out.replace(re, (match) =>
      match[0] === match[0].toUpperCase()
        ? to.charAt(0).toUpperCase() + to.slice(1)
        : to,
    );
  }
  return out;
}

/** Strips hedges and filler that add length without adding information. */
const FILLER = [
  "in order to",
  "it should be noted that",
  "it is worth noting that",
  "it is important to note that",
  "at this point in time",
  "on balance",
  "broadly speaking",
  "generally speaking",
  "for the most part",
  "in terms of",
  "as a matter of fact",
  "the fact that",
];

function stripFiller(text: string): string {
  let out = text;
  for (const phrase of FILLER) {
    out = out.replace(new RegExp(`\\b${phrase}\\b,?\\s*`, "gi"), "");
  }
  return out.replace(/\s+,/g, ",").replace(/\s+/g, " ").trim();
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ensureTerminator(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/**
 * A selection is a fragment when it is not a whole sentence — a phrase pulled
 * from the middle of a paragraph, say. Fragments must come back as fragments,
 * or splicing the result back in produces a stray capital or full stop.
 */
function isFragment(text: string): boolean {
  const t = text.trim();
  return !/[.!?]["'”’)]?$/.test(t) || t.split(/\s+/).length < 5;
}

/**
 * Re-imposes the original selection's casing and terminal punctuation on a
 * rewrite, so an in-place edit never changes the shape of the surrounding
 * sentence.
 */
function preserveShape(original: string, next: string): string {
  const from = original.trim();
  const startedUpper = /^[A-Z]/.test(from);
  const endedTerminated = /[.!?]["'”’)]?$/.test(from);

  let out = next.trim();
  if (!startedUpper && /^[A-Z]/.test(out)) {
    // Don't lowercase a proper noun that happens to lead the rewrite.
    const firstWord = out.split(/\s+/)[0].replace(/[^\w]/g, "");
    if (!PROPER_NOUNS.has(firstWord)) out = out.charAt(0).toLowerCase() + out.slice(1);
  }
  if (!endedTerminated) out = out.replace(/[.]+$/, "");
  return out;
}

const PROPER_NOUNS = new Set([
  "Pfizer",
  "Reuters",
  "Bloomberg",
  "Politico",
  "Senate",
  "Medicare",
  "EU",
  "US",
  "Herald",
  "Handraise",
  "Phase",
  "Tier",
  "Competitor",
]);

/* -------------------------------------------------------------------------- */
/* Intents                                                                     */
/* -------------------------------------------------------------------------- */

export const INLINE_INTENTS: InlineEditIntent[] = [
  {
    id: "shorten",
    label: "Shorten",
    keywords: [
      "shorten",
      "shorter",
      "concise",
      "brief",
      "briefer",
      "tighten",
      "trim",
      "cut",
      "condense",
      "too long",
      "less detail",
      "unnecessary detail",
      "remove detail",
    ],
    describe: "tightened the passage and cut the qualifying detail",
    apply(text) {
      const stripped = stripFiller(text);

      if (isFragment(text)) {
        // A phrase: drop asides rather than dropping sentences.
        const tightened = stripped
          .replace(/\s*\([^)]*\)/g, "")
          .replace(/,\s*(?:which|with|including)\s+[^,.]+/gi, "")
          .replace(/\b(?:very|quite|rather|somewhat|fairly|really)\s+/gi, "");
        return preserveShape(text, tightened);
      }

      const parts = sentences(stripped);
      const trimmed = join(selectLoadBearing(parts))
        // Drop parenthetical and appositive detail.
        .replace(/\s*\([^)]*\)/g, "")
        .replace(/,\s*(?:which|with)\s+[^,.]+(?=[,.])/gi, "");
      return preserveShape(text, ensureTerminator(capitalise(trimmed)));
    },
  },
  {
    id: "executive",
    label: "Executive tone",
    keywords: [
      "executive",
      "exec",
      "ceo",
      "board",
      "leadership",
      "senior",
      "c-suite",
    ],
    describe: "rewrote it for an executive reader and led with the implication",
    apply(text) {
      const parts = sentences(stripFiller(text));
      const lead = parts[0] ?? text;
      const rest = parts.slice(1);
      const plainWords = {
        utilise: "use",
        leverage: "use",
        "going forward": "next",
        approximately: "about",
        subsequently: "then",
        additionally: "also",
        however: "but",
        demonstrates: "shows",
        indicates: "shows",
        "is likely to": "will likely",
      };
      const plain = replaceWords(join([lead, ...rest]), plainWords);

      // A fragment can't carry a leadership framing sentence — plain wording
      // is the whole of the change there.
      if (isFragment(text)) return preserveShape(text, plain);

      return ensureTerminator(
        capitalise(`The read for leadership: ${lowerFirst(plain)}`),
      );
    },
  },
  {
    id: "neutral",
    label: "More neutral",
    keywords: [
      "neutral",
      "less negative",
      "softer",
      "tone down",
      "balanced",
      "less alarming",
      "measured",
      "less charged",
    ],
    describe: "removed the charged language and made the tone measured",
    apply(text) {
      return preserveShape(
        text,
        replaceWords(text, {
          crisis: "situation",
          damaging: "unfavourable",
          slammed: "criticised",
          attacked: "questioned",
          plunged: "declined",
          soared: "rose",
          collapsed: "fell",
          disastrous: "difficult",
          alarming: "notable",
          severe: "significant",
          threat: "pressure",
          "forced to": "set to",
          fails: "does not",
          worst: "weakest",
          scrutiny: "review",
          backlash: "reaction",
        }),
      );
    },
  },
  {
    id: "business-impact",
    label: "Business impact",
    keywords: [
      "business impact",
      "commercial",
      "revenue",
      "financial",
      "emphasise the business",
      "emphasize the business",
      "bottom line",
      "material",
    ],
    describe: "led with the commercial consequence",
    apply(text) {
      const core = stripFiller(text);
      if (isFragment(text)) {
        return preserveShape(text, `${core} — and the commercial consequence that follows`);
      }
      return ensureTerminator(
        `Commercially, this is the line that matters: ${lowerFirst(core)}`,
      );
    },
  },
  {
    id: "risk",
    label: "Reputation risk",
    keywords: [
      "risk",
      "reputation",
      "reputational",
      "exposure",
      "downside",
      "vulnerability",
    ],
    describe: "reframed the passage around reputational exposure",
    apply(text) {
      const core = stripFiller(text);
      if (isFragment(text)) {
        return preserveShape(text, `${core}, which is where the reputational exposure sits`);
      }
      return ensureTerminator(
        `The reputational exposure sits here: ${lowerFirst(core)} Treat this as the item most likely to be raised externally.`,
      );
    },
  },
  {
    id: "plainer",
    label: "Plainer language",
    keywords: [
      "plain",
      "plainer",
      "simpler",
      "simplify",
      "jargon",
      "clearer",
      "clarity",
      "easier",
    ],
    describe: "replaced the jargon with plain language",
    apply(text) {
      return preserveShape(
        text,
        replaceWords(stripFiller(text), {
          utilise: "use",
          utilize: "use",
          leverage: "use",
          "in the event that": "if",
          commence: "start",
          terminate: "end",
          endeavour: "try",
          facilitate: "help",
          "with regard to": "about",
          "prior to": "before",
          "subsequent to": "after",
          consensus: "analyst expectations",
          "year over year": "vs. last year",
          "period over period": "vs. last period",
          "share of voice": "share of coverage",
          "Tier 1": "major national",
          endpoint: "trial goal",
          immunogenicity: "immune response",
          cardiometabolic: "heart and metabolic",
        }),
      );
    },
  },
  {
    id: "context",
    label: "Add context",
    keywords: [
      "context",
      "background",
      "expand",
      "more detail",
      "elaborate",
      "why",
      "explain",
    ],
    describe: "added the context a reader outside the team would need",
    apply(text) {
      if (isFragment(text)) {
        return preserveShape(
          text,
          `${text.trim()} (against an 18% rise in coverage volume and 31% Tier 1 share)`,
        );
      }
      return `${ensureTerminator(text)} For context, this sits against a lookback window in which coverage volume rose 18% and Tier 1 share reached 31% — the strongest week recorded this year.`;
    },
  },
];

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** Sentences that carry an action, a consequence or a deadline. */
const ACTION = /\b(expect|should|recommend|risk|watch|confirm|need|must|before|deadline|by \w+day)\b/i;

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

/**
 * Chooses which sentences survive a shorten pass.
 *
 * Keeping only the first sentence is wrong when that sentence is a short
 * lead-in ("Two live deadlines this week.") — the substance sits in what
 * follows. So: always keep the opener, keep the next sentence when the opener
 * is too short to stand alone, and keep anything carrying an action or a
 * deadline until roughly 60% of the original length is reached.
 */
function selectLoadBearing(parts: string[]): string[] {
  if (parts.length <= 1) return parts;

  const total = parts.reduce((n, p) => n + wordCount(p), 0);
  const target = Math.max(12, Math.round(total * 0.6));

  const keep = new Set<number>([0]);
  let kept = wordCount(parts[0]);

  // A short opener is a lead-in, not the point.
  if (kept < 10 && parts[1]) {
    keep.add(1);
    kept += wordCount(parts[1]);
  }

  for (let i = 1; i < parts.length && kept < target; i++) {
    if (keep.has(i) || !ACTION.test(parts[i])) continue;
    keep.add(i);
    kept += wordCount(parts[i]);
  }

  return parts.filter((_, i) => keep.has(i));
}

/* -------------------------------------------------------------------------- */
/* Routing                                                                     */
/* -------------------------------------------------------------------------- */

/** The chips offered in the popover, in order. */
export const QUICK_INTENT_IDS = [
  "shorten",
  "neutral",
  "context",
  "plainer",
] as const;

export function findIntent(id: string): InlineEditIntent | undefined {
  return INLINE_INTENTS.find((i) => i.id === id);
}

/**
 * Routes a free-text instruction to an intent by keyword match, scoring longer
 * keyword matches higher so "make this less negative" beats a bare "less".
 */
export function routeInstruction(
  instruction: string,
): InlineEditIntent | undefined {
  const q = instruction.toLowerCase();
  let best: { intent: InlineEditIntent; score: number } | undefined;

  for (const intent of INLINE_INTENTS) {
    for (const kw of intent.keywords) {
      if (q.includes(kw)) {
        const score = kw.length;
        if (!best || score > best.score) best = { intent, score };
      }
    }
  }
  return best?.intent;
}

export interface InlineEditResult {
  text: string;
  description: string;
}

/**
 * Applies a free-text instruction to selected text. Falls back to a general
 * tightening pass when nothing matches, so the interaction never dead-ends.
 */
export function applyInstruction(
  selection: string,
  instruction: string,
): InlineEditResult {
  const intent = routeInstruction(instruction);
  if (intent) {
    return { text: intent.apply(selection), description: intent.describe };
  }
  const shorten = findIntent("shorten")!;
  return {
    text: shorten.apply(selection),
    description:
      "applied your instruction as an editing pass — tightened the passage and kept the load-bearing detail",
  };
}
