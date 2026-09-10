import { ALL_ARTICLES } from "@/lib/data/articles";
import type { Article, Briefing, Edition, EditionBlock } from "@/lib/types";
import { applyInstruction } from "@/lib/herald/inline-edit";

/**
 * Herald's behaviour inside Briefing Review.
 *
 * Herald reads the actual edition in front of the user — its sections, the
 * articles it selected, the instructions the briefing was configured with — and
 * answers from that. Responses are deterministic; the point is to demonstrate
 * the interaction model, not to run a model.
 */

export interface HeraldAction {
  /** What Herald says. */
  reply: string;
  /** Bullet record of what changed, rendered under the reply. */
  changes?: string[];
  /** A transform applied to the edition, if the request changed content. */
  mutate?: (edition: Edition) => Edition;
  /** Block to scroll into view and flash after the change lands. */
  focusBlockId?: string;
}

/* -------------------------------------------------------------------------- */
/* Reading the edition                                                         */
/* -------------------------------------------------------------------------- */

export function editionArticles(edition: Edition): Article[] {
  return edition.blocks.flatMap((b) =>
    b.kind === "stories" ? b.articles : [],
  );
}

function sectionTitles(edition: Edition): string[] {
  return edition.blocks
    .filter((b): b is Extract<EditionBlock, { kind: "sectionTitle" }> =>
      b.kind === "sectionTitle",
    )
    .map((b) => b.title);
}

function firstSummary(edition: Edition, match?: RegExp) {
  return edition.blocks.find(
    (b): b is Extract<EditionBlock, { kind: "summary" }> =>
      b.kind === "summary" &&
      (!match || matchesSection(edition, b.sectionId, match)),
  );
}

function matchesSection(edition: Edition, sectionId: string | undefined, re: RegExp) {
  if (!sectionId) return false;
  const title = edition.blocks.find(
    (b) => b.kind === "sectionTitle" && b.sectionId === sectionId,
  );
  return title?.kind === "sectionTitle" ? re.test(title.title) : false;
}

/** The story Herald considers most consequential: highest reach, negative first. */
function mostImportant(edition: Edition): Article | undefined {
  const articles = editionArticles(edition);
  const score = (a: Article) => {
    const reach = parseReach(a.reach);
    const weight =
      a.sentiment === "negative" ? 1.35 : a.sentiment === "positive" ? 1.1 : 1;
    return reach * weight;
  };
  return [...articles].sort((a, b) => score(b) - score(a))[0];
}

function parseReach(reach: string): number {
  const n = parseFloat(reach);
  if (reach.includes("M")) return n * 1_000_000;
  if (reach.includes("K")) return n * 1_000;
  return n;
}

/** Articles not already in the edition, for "find another article" requests. */
export function candidateArticles(edition: Edition): Article[] {
  const used = new Set(editionArticles(edition).map((a) => a.id));
  return ALL_ARTICLES.filter((a) => !used.has(a.id));
}

/**
 * Picks a replacement for `topic`, preferring an unused article whose topic or
 * headline matches the request.
 */
export function pickCandidate(
  edition: Edition,
  hint: string,
): Article | undefined {
  const pool = candidateArticles(edition);
  if (!pool.length) return undefined;
  const q = hint.toLowerCase();

  const scored = pool.map((a) => {
    let score = 0;
    if (q.includes(a.topic.toLowerCase())) score += 5;
    for (const word of q.split(/\W+/).filter((w) => w.length > 3)) {
      if (a.headline.toLowerCase().includes(word)) score += 3;
      if (a.summary.toLowerCase().includes(word)) score += 1;
      if (a.topic.toLowerCase().includes(word)) score += 2;
    }
    return { a, score };
  });

  scored.sort((x, y) => y.score - x.score || parseReach(y.a.reach) - parseReach(x.a.reach));
  return scored[0]?.a;
}

/* -------------------------------------------------------------------------- */
/* Edition transforms                                                          */
/* -------------------------------------------------------------------------- */

export function removeArticle(edition: Edition, articleId: string): Edition {
  return {
    ...edition,
    blocks: edition.blocks.map((b) =>
      b.kind === "stories"
        ? { ...b, articles: b.articles.filter((a) => a.id !== articleId) }
        : b,
    ),
  };
}

export function replaceArticle(
  edition: Edition,
  articleId: string,
  next: Article,
): Edition {
  return {
    ...edition,
    blocks: edition.blocks.map((b) =>
      b.kind === "stories"
        ? {
            ...b,
            articles: b.articles.map((a) => (a.id === articleId ? next : a)),
          }
        : b,
    ),
  };
}

export function addArticle(
  edition: Edition,
  blockId: string,
  article: Article,
): Edition {
  return {
    ...edition,
    blocks: edition.blocks.map((b) =>
      b.kind === "stories" && b.id === blockId
        ? { ...b, articles: [...b.articles, article] }
        : b,
    ),
  };
}

/** Updates one editable text field anywhere in the edition. */
export function updateText(
  edition: Edition,
  blockId: string,
  field: "summary" | "whyItMatters" | "headline" | "text" | "calloutText",
  value: string,
  articleId?: string,
): Edition {
  return {
    ...edition,
    blocks: edition.blocks.map((b) => {
      if (b.id !== blockId) return b;
      if (b.kind === "summary" && field === "text") return { ...b, text: value };
      if (b.kind === "callout" && field === "calloutText")
        return { ...b, text: value };
      if (b.kind === "quote" && field === "text") return { ...b, text: value };
      if (b.kind === "stories" && articleId) {
        return {
          ...b,
          articles: b.articles.map((a) =>
            a.id === articleId ? { ...a, [field]: value } : a,
          ),
        };
      }
      return b;
    }),
  };
}

/** Finds the block that owns a piece of editable text. */
export function findStoriesBlockFor(
  edition: Edition,
  articleId: string,
): Extract<EditionBlock, { kind: "stories" }> | undefined {
  return edition.blocks.find(
    (b): b is Extract<EditionBlock, { kind: "stories" }> =>
      b.kind === "stories" && b.articles.some((a) => a.id === articleId),
  );
}

/* -------------------------------------------------------------------------- */
/* Suggested prompts                                                           */
/* -------------------------------------------------------------------------- */

export function suggestedPrompts(edition: Edition | null): string[] {
  if (!edition) {
    return [
      "What will this briefing cover when it first runs?",
      "How should I word the overall prompt?",
      "Who should be on the recipient list?",
    ];
  }

  const titles = sectionTitles(edition);
  const prompts = ["What is the most important story in this briefing?"];

  if (titles.length) {
    prompts.push(`Make ${withArticle(titles[0])} summary more concise.`);
  }

  // Offer a swap against coverage this edition actually left on the table, so
  // the suggestion is answerable rather than decorative.
  const dropped = candidateArticles(edition)[0];
  if (dropped) {
    prompts.push(`Find another ${dropped.topic} story I should include.`);
  }

  prompts.push("What did you leave out of this edition and why?");
  return prompts;
}

/* -------------------------------------------------------------------------- */
/* Before the first run                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Herald's answers for a briefing that has not generated an edition yet. There
 * is no content to reason over, so it answers from the configuration.
 */
export function respondPreRun(message: string, briefing: Briefing): string {
  const q = message.toLowerCase();
  const sections = Object.keys(briefing.sectionPrompts).length;

  if (/cover|contain|include|what will|first run/.test(q)) {
    return `When it first runs, this briefing will read the ${briefing.lookback.toLowerCase()} window and fill ${sections} section${sections === 1 ? "" : "s"} using the instructions you set. The overall framing you gave me is: “${briefing.overallPrompt}” — I apply that to every section before the section-specific prompt narrows it further.`;
  }

  if (/prompt|word|phrase|instruction|write/.test(q)) {
    return `The prompts that work best name an audience and a decision. Yours currently reads: “${briefing.overallPrompt}” — that is the right shape. For each section, say what to prioritise and what to leave out; “the 3 highest-impact stories, Tier 1 outlets first” beats “relevant coverage” every time.`;
  }

  if (/recipient|who should|send to|distribut/.test(q)) {
    return `This briefing currently goes to ${briefing.recipients.length} recipient${briefing.recipients.length === 1 ? "" : "s"}: ${briefing.recipients.map((r) => r.email).join(", ")}. Keep the list to people who act on it — a briefing read by everyone and acted on by no one stops being read.`;
  }

  if (/when|schedule|run/.test(q)) {
    return `It runs ${briefing.schedule.day.toLowerCase()} at ${briefing.schedule.time} ${briefing.schedule.timezoneShort}, reading the ${briefing.lookback.toLowerCase()} window each time. The first edition will appear here for review as soon as it does.`;
  }

  return `This briefing hasn't generated an edition yet, so I have its configuration rather than its content in context: ${sections} section${sections === 1 ? "" : "s"}, a ${briefing.lookback.toLowerCase()} window, and ${briefing.recipients.length} recipient${briefing.recipients.length === 1 ? "" : "s"}. Ask me what it will cover, how to word a prompt, or who should receive it — and once it runs I can rewrite and reshape the edition itself.`;
}

/* -------------------------------------------------------------------------- */
/* The router                                                                  */
/* -------------------------------------------------------------------------- */

interface Ctx {
  briefing: Briefing;
  edition: Edition;
}

/**
 * Maps a user message to a Herald action. Rules are ordered most-specific
 * first; each one reads real state from the edition so answers reference the
 * content actually on screen.
 */
export function respond(message: string, ctx: Ctx): HeraldAction {
  const q = message.toLowerCase().trim();
  const { edition, briefing } = ctx;

  /* --- Questions about the briefing -------------------------------------- */

  if (/most important|biggest story|top story|matters most|lead with/.test(q)) {
    const top = mostImportant(edition);
    if (!top) {
      return {
        reply:
          "There are no articles left in this edition to rank. Add a story to a section and I can tell you which one leads.",
      };
    }
    return {
      reply: `“${top.headline}” (${top.publication}, ${top.date}). It has the widest reach in this edition at ${top.reach} and it is ${top.sentiment === "negative" ? "the one negative story with national distribution" : "the story carrying the most favourable framing"}. ${top.whyItMatters}`,
    };
  }

  if (/leave out|left out|exclude|didn't include|did not include|why not/.test(q)) {
    const left = candidateArticles(edition).slice(0, 3);
    return {
      reply: `I read ${edition.articlesScanned.toLocaleString()} articles in the ${briefing.lookback.toLowerCase()} window and kept ${editionArticles(edition).length}. The closest calls I dropped:`,
      changes: left.map(
        (a) =>
          `${a.headline} (${a.publication}) — ${a.sentiment === "neutral" ? "thematic rather than company-specific" : "lower reach than the stories I kept"}`,
      ),
    };
  }

  if (/subject line|email subject|send as|title for the send/.test(q)) {
    const top = mostImportant(edition);
    return {
      reply: `For this edition I would use: “${top ? shortenHeadline(top.headline) : briefing.name} — plus what it means for us”. It leads with the story your readers will already have seen and signals that the briefing adds interpretation rather than repeating the news.`,
    };
  }

  if (/how many|how much coverage|volume|scanned|read through/.test(q)) {
    return {
      reply: `I read ${edition.articlesScanned.toLocaleString()} articles across the ${briefing.lookback.toLowerCase()} window and selected ${editionArticles(edition).length} for this edition, spread across ${sectionTitles(edition).length} sections. Selection follows the section prompts set on this briefing.`,
    };
  }

  if (/what.*(sections|structure)|how is this (built|structured)|template/.test(q)) {
    return {
      reply: `This edition runs on the structure fixed by its template, so the layout is the same every time. The sections are ${formatList(sectionTitles(edition))}. You can change what each section says by editing it here or by updating the section prompts on the briefing — but the structure itself belongs to the template.`,
    };
  }

  /* --- Article manipulation ---------------------------------------------- */

  const wantsAnother =
    /find (me )?(another|a different|a more|one more)|add (an?|another) (article|story)|something more relevant|more relevant (article|story)/.test(
      q,
    );
  const wantsReplace = /replace|swap|substitute/.test(q);

  if (wantsReplace) {
    const target = matchArticle(edition, q) ?? mostImportant(edition);
    const next = pickCandidate(edition, q);
    if (!target || !next) {
      return {
        reply:
          "I could not find a stronger alternative in the lookback window for that slot. Tell me the angle you want and I will look again.",
      };
    }
    const block = findStoriesBlockFor(edition, target.id);
    return {
      reply: `Swapped it. “${next.headline}” (${next.publication}) is a closer fit — ${lowerFirst(next.whyItMatters)}`,
      changes: [
        `Removed “${target.headline}” (${target.publication})`,
        `Added “${next.headline}” (${next.publication}, ${next.reach} reach)`,
      ],
      mutate: (e) => replaceArticle(e, target.id, next),
      focusBlockId: block?.id,
    };
  }

  if (wantsAnother) {
    const next = pickCandidate(edition, q);
    const storiesBlocks = edition.blocks.filter(
      (b): b is Extract<EditionBlock, { kind: "stories" }> => b.kind === "stories",
    );
    const target = bestSectionFor(edition, q) ?? storiesBlocks[0];
    if (!next || !target) {
      return {
        reply:
          "Everything in the lookback window that matches that angle is already in the edition. Widen the lookback period and I will look again.",
      };
    }
    const sectionTitle =
      edition.blocks.find(
        (b) => b.kind === "sectionTitle" && b.sectionId === target.sectionId,
      );
    return {
      reply: `Added “${next.headline}” (${next.publication}, ${next.date}) to ${sectionTitle?.kind === "sectionTitle" ? sectionTitle.title : "the section"}. ${next.whyItMatters}`,
      changes: [`Added “${next.headline}” — ${next.reach} reach, ${next.topic}`],
      mutate: (e) => addArticle(e, target.id, next),
      focusBlockId: target.id,
    };
  }

  if (/remove|delete|drop|take out|cut the (article|story)/.test(q)) {
    const target = matchArticle(edition, q);
    if (!target) {
      return {
        reply:
          "Tell me which story to drop — name the outlet or part of the headline — or use the ⋯ menu on the article itself.",
      };
    }
    return {
      reply: `Removed “${target.headline}”. The section still holds together without it; the remaining stories cover the same ground.`,
      changes: [`Removed “${target.headline}” (${target.publication})`],
      mutate: (e) => removeArticle(e, target.id),
    };
  }

  /* --- Rewriting summaries ------------------------------------------------ */

  const rewriteMatch =
    /rewrite|rephrase|reword|make (this|the|it)|shorten|concise|briefer|tighten|less negative|more neutral|executive|plainer|simpler|emphasi[sz]e|expand/.test(
      q,
    );

  if (rewriteMatch) {
    const target = targetSummary(edition, q);
    if (!target) {
      return {
        reply:
          "I could not tell which passage you mean. Select the text in the preview and ask again, or name the section.",
      };
    }
    const result = applyInstruction(target.text, q);
    if (result.text.trim() === target.text.trim()) {
      return {
        reply:
          "That passage is already about as tight as it goes without losing something load-bearing. Tell me what to drop and I will cut it.",
      };
    }
    const sectionTitle = edition.blocks.find(
      (b) => b.kind === "sectionTitle" && b.sectionId === target.sectionId,
    );
    const where =
      sectionTitle?.kind === "sectionTitle"
        ? `${withArticle(sectionTitle.title)} summary`
        : "that passage";
    return {
      reply: `Done — I ${result.description} in ${where}.`,
      mutate: (e) => updateText(e, target.id, "text", result.text),
      focusBlockId: target.id,
    };
  }

  /* --- Fallback ----------------------------------------------------------- */

  return {
    reply: `I have this edition in context — ${sectionTitles(edition).length} sections, ${editionArticles(edition).length} articles, generated from the ${briefing.lookback.toLowerCase()} window. I can rewrite any passage, swap or remove an article, find something more relevant, or tell you what I left out. You can also select text directly in the preview to edit it in place.`,
  };
}

/* -------------------------------------------------------------------------- */
/* Matching helpers                                                            */
/* -------------------------------------------------------------------------- */

/** Finds the article a message refers to by outlet, topic or headline words. */
function matchArticle(edition: Edition, q: string): Article | undefined {
  const articles = editionArticles(edition);
  let best: { a: Article; score: number } | undefined;

  for (const a of articles) {
    let score = 0;
    if (q.includes(a.publication.toLowerCase())) score += 6;
    if (q.includes(a.topic.toLowerCase())) score += 3;
    for (const word of a.headline.toLowerCase().split(/\W+/)) {
      if (word.length > 4 && q.includes(word)) score += 2;
    }
    if (score && (!best || score > best.score)) best = { a, score };
  }
  return best?.a;
}

/** Picks the stories block whose section best matches the request. */
function bestSectionFor(edition: Edition, q: string) {
  const blocks = edition.blocks.filter(
    (b): b is Extract<EditionBlock, { kind: "stories" }> => b.kind === "stories",
  );
  for (const b of blocks) {
    const title = edition.blocks.find(
      (t) => t.kind === "sectionTitle" && t.sectionId === b.sectionId,
    );
    if (
      title?.kind === "sectionTitle" &&
      q.includes(title.title.toLowerCase().split(" ")[0])
    ) {
      return b;
    }
  }
  return blocks[0];
}

/** Picks the summary block a rewrite request refers to. */
function targetSummary(edition: Edition, q: string) {
  const summaries = edition.blocks.filter(
    (b): b is Extract<EditionBlock, { kind: "summary" }> => b.kind === "summary",
  );
  if (!summaries.length) return undefined;

  for (const s of summaries) {
    const title = edition.blocks.find(
      (t) => t.kind === "sectionTitle" && t.sectionId === s.sectionId,
    );
    if (title?.kind !== "sectionTitle") continue;
    const words = title.title.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    if (words.some((w) => q.includes(w))) return s;
  }

  if (/executive|summary|overview|headline/.test(q)) {
    return firstSummary(edition) ?? summaries[0];
  }
  return summaries[0];
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Prefixes "the" unless the title already carries its own article. */
function withArticle(title: string): string {
  return /^(the|a|an)\s/i.test(title) ? title : `the ${title}`;
}

function shortenHeadline(headline: string): string {
  const clause = headline.split(/[,–—]/)[0];
  return clause.length > 8 ? clause.trim() : headline;
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
