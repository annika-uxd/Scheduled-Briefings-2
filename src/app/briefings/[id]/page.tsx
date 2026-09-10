"use client";

import {
  ArrowLeftIcon,
  ClockIcon,
  FileTextIcon,
  LockSimpleIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useCallback, useMemo, useRef, useState } from "react";

import { AddArticleDialog } from "@/components/briefing/add-article-dialog";
import type { ArticleEditingState } from "@/components/briefing/article-card";
import {
  BriefingDocument,
  type DocumentHandlers,
} from "@/components/briefing/briefing-document";
import type { TextTarget } from "@/components/briefing/editable-text";
import {
  InlineEditPopover,
  type InlineEditOutcome,
} from "@/components/briefing/inline-edit-popover";
import { HeraldPanel } from "@/components/herald/herald-panel";
import { AppShell } from "@/components/shell/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { cx, scheduleSummary } from "@/lib/format";
import {
  candidateArticles,
  editionArticles,
  findStoriesBlockFor,
  pickCandidate,
  removeArticle,
  replaceArticle,
  respond,
  respondPreRun,
  suggestedPrompts,
  updateText,
  addArticle as addArticleToEdition,
} from "@/lib/herald/briefing-herald";
import { useStore } from "@/lib/store";
import type { Article, Edition, HeraldMessage } from "@/lib/types";

let messageSeq = 0;
const msgId = () => `msg-${(messageSeq += 1)}`;

/** B4 — Briefing Detail / Review. The hero experience of the module. */
export default function BriefingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getBriefing, getTemplate, updateEdition, pushToast } = useStore();

  const briefing = getBriefing(id);
  if (!briefing) notFound();

  const template = getTemplate(briefing.templateId);
  const edition = briefing.edition;

  /* --- Herald conversation ------------------------------------------------ */
  const [messages, setMessages] = useState<HeraldMessage[]>([]);
  const [thinking, setThinking] = useState<string | null>(null);

  /* --- Editing state ------------------------------------------------------ */
  const [selection, setSelection] = useState<TextTarget | null>(null);
  const [editing, setEditing] = useState<ArticleEditingState | null>(null);
  const [flash, setFlash] = useState<DocumentHandlers["flash"]>(null);
  const [flashBlockId, setFlashBlockId] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const flashTimer = useRef<number | null>(null);

  const clearFlashSoon = useCallback(() => {
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => {
      setFlash(null);
      setFlashBlockId(null);
    }, 1600);
  }, []);

  const commitEdition = useCallback(
    (next: Edition) => updateEdition(briefing.id, next),
    [briefing.id, updateEdition],
  );

  const say = useCallback((message: Omit<HeraldMessage, "id">) => {
    setMessages((prev) => [...prev, { ...message, id: msgId() }]);
  }, []);

  /* --- Handlers ----------------------------------------------------------- */

  const handleCommitText = useCallback(
    (
      blockId: string,
      field: TextTarget["field"],
      value: string,
      articleId?: string,
    ) => {
      if (!edition) return;
      commitEdition(updateText(edition, blockId, field, value, articleId));
      setEditing(null);
      setFlash({ blockId, articleId, field });
      clearFlashSoon();
    },
    [edition, commitEdition, clearFlashSoon],
  );

  const handleInlineApply = useCallback(
    (outcome: InlineEditOutcome) => {
      if (!edition || !selection) return;
      commitEdition(
        updateText(
          edition,
          selection.blockId,
          selection.field,
          outcome.nextValue,
          selection.articleId,
        ),
      );
      setFlash({
        blockId: selection.blockId,
        articleId: selection.articleId,
        field: selection.field,
      });
      clearFlashSoon();
      window.getSelection()?.removeAllRanges();
      setSelection(null);

      say({ role: "user", text: outcome.instruction });
      say({
        role: "herald",
        text: `Done — I ${outcome.description}.`,
        changes: [`Updated the selected passage in the preview`],
      });
    },
    [edition, selection, commitEdition, clearFlashSoon, say],
  );

  const handleRemoveArticle = useCallback(
    (articleId: string) => {
      if (!edition) return;
      const article = editionArticles(edition).find((a) => a.id === articleId);
      commitEdition(removeArticle(edition, articleId));
      if (article) {
        pushToast({
          tone: "success",
          title: "Article removed",
          description: `“${article.headline}” is no longer in this edition.`,
        });
      }
    },
    [edition, commitEdition, pushToast],
  );

  const handleReplaceArticle = useCallback(
    (articleId: string) => {
      if (!edition) return;
      const current = editionArticles(edition).find((a) => a.id === articleId);
      if (!current) return;

      const next = pickCandidate(edition, `${current.topic} ${current.headline}`);
      if (!next) {
        say({
          role: "herald",
          text: "There is nothing left in this lookback window that would be a better fit for that slot. Widen the lookback period and I will look again.",
        });
        return;
      }

      const block = findStoriesBlockFor(edition, articleId);
      commitEdition(replaceArticle(edition, articleId, next));
      setFlashBlockId(block?.id ?? null);
      clearFlashSoon();

      say({ role: "user", text: `Replace “${current.headline}”.` });
      say({
        role: "herald",
        text: `Swapped it for “${next.headline}” (${next.publication}). ${next.whyItMatters}`,
        changes: [
          `Removed “${current.headline}” (${current.publication})`,
          `Added “${next.headline}” — ${next.reach} reach`,
        ],
      });
    },
    [edition, commitEdition, clearFlashSoon, say],
  );

  const handleAddArticle = useCallback(
    (article: Article) => {
      if (!edition || !addingTo) return;
      commitEdition(addArticleToEdition(edition, addingTo, article));
      setFlashBlockId(addingTo);
      clearFlashSoon();
      setAddingTo(null);
      pushToast({
        tone: "success",
        title: "Article added",
        description: `“${article.headline}” added to this edition.`,
      });
    },
    [edition, addingTo, commitEdition, clearFlashSoon, pushToast],
  );

  const handleSend = useCallback(
    (text: string) => {
      say({ role: "user", text });

      // Before the first run there is no edition to reason over, so Herald
      // answers about the configuration instead of going silent.
      if (!edition) {
        setThinking("Checking this briefing…");
        window.setTimeout(() => {
          setThinking(null);
          say({ role: "herald", text: respondPreRun(text, briefing) });
        }, 480);
        return;
      }

      setThinking("Reading this edition…");

      window.setTimeout(() => {
        const action = respond(text, { briefing, edition });
        if (action.mutate) {
          commitEdition(action.mutate(edition));
          if (action.focusBlockId) {
            setFlashBlockId(action.focusBlockId);
            document
              .getElementById(`block-${action.focusBlockId}`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
            clearFlashSoon();
          }
        }
        setThinking(null);
        say({ role: "herald", text: action.reply, changes: action.changes });
      }, 520);
    },
    [briefing, edition, commitEdition, clearFlashSoon, say],
  );

  /* --- Derived ------------------------------------------------------------ */

  const documentHandlers: DocumentHandlers = useMemo(
    () => ({
      onSelectText: setSelection,
      onCommitText: handleCommitText,
      editing,
      onEditingChange: setEditing,
      onRemoveArticle: handleRemoveArticle,
      onReplaceArticle: handleReplaceArticle,
      onAddArticle: setAddingTo,
      flash,
      flashBlockId,
    }),
    [
      handleCommitText,
      editing,
      handleRemoveArticle,
      handleReplaceArticle,
      flash,
      flashBlockId,
    ],
  );

  const addTargetTitle = useMemo(() => {
    if (!edition || !addingTo) return "";
    const block = edition.blocks.find((b) => b.id === addingTo);
    if (block?.kind !== "stories") return "this section";
    const title = edition.blocks.find(
      (b) => b.kind === "sectionTitle" && b.sectionId === block.sectionId,
    );
    return title?.kind === "sectionTitle" ? title.title : "this section";
  }, [edition, addingTo]);

  const articleCount = edition ? editionArticles(edition).length : 0;
  const sectionCount = edition
    ? edition.blocks.filter((b) => b.kind === "sectionTitle").length
    : 0;

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        {/* Herald */}
        <aside
          className={cx(
            "flex min-h-0 shrink-0 flex-col border-grey-200",
            "h-[45dvh] border-b lg:h-auto lg:w-[min(34%,380px)] lg:border-r lg:border-b-0",
          )}
        >
          <HeraldPanel
            status="Ready"
            thinking={thinking}
            onSend={handleSend}
            suggestionsLabel="Ask Herald"
            suggestions={suggestedPrompts(edition)}
            messages={messages}
            placeholder="Describe what you want…"
            intro={
              edition ? (
                <>
                  I have this edition of{" "}
                  <span className="font-medium text-grey-900">
                    “{briefing.name}”
                  </span>{" "}
                  in context — {sectionCount} sections, {articleCount} articles,
                  and the instructions this briefing was configured with. Select
                  any text in the preview to edit it, or ask me here.
                </>
              ) : (
                <>
                  This briefing hasn&rsquo;t run yet. Once the first edition
                  generates I&rsquo;ll have it in context and can rewrite
                  passages, swap articles or explain what I left out.
                </>
              )
            }
          />
        </aside>

        {/* Briefing */}
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          <header className="border-b border-grey-200 bg-white px-5 py-5 sm:px-8">
            <Link
              href="/briefings"
              className="inline-flex items-center gap-1.5 text-[13px] text-grey-600 transition-colors hover:text-violet-700"
            >
              <ArrowLeftIcon size={13} />
              All briefings
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-[20px] leading-6 font-medium text-grey-900">
                {briefing.name}
              </h1>
              <StatusBadge status={briefing.status} />
            </div>

            <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-grey-600">
              <MetaItem icon={<ClockIcon size={14} />} label="Schedule">
                {scheduleSummary(briefing.schedule)}
              </MetaItem>
              <MetaItem icon={<UsersIcon size={14} />} label="Recipients">
                <span title={briefing.recipients.map((r) => r.email).join(", ")}>
                  {briefing.recipients.length} recipient
                  {briefing.recipients.length === 1 ? "" : "s"}
                </span>
              </MetaItem>
              <MetaItem icon={<LockSimpleIcon size={14} />} label="Template">
                {template ? (
                  <Link
                    href={`/templates/${template.id}`}
                    className="transition-colors hover:text-violet-700"
                  >
                    {template.name}
                  </Link>
                ) : (
                  "Unknown"
                )}
              </MetaItem>
              <MetaItem icon={<FileTextIcon size={14} />} label="Lookback">
                {briefing.lookback}
              </MetaItem>
              {briefing.lastGenerated ? (
                <MetaItem label="Last generated">{briefing.lastGenerated}</MetaItem>
              ) : null}
            </dl>
          </header>

          <div className="mx-auto max-w-[840px] px-5 py-6 sm:px-8 sm:py-8">
            {edition ? (
              <BriefingDocument
                edition={edition}
                title={briefing.name}
                interactive
                handlers={documentHandlers}
              />
            ) : (
              <div className="rounded-lg border border-grey-200 bg-white px-6 py-16 text-center">
                <p className="text-[15px] font-medium text-grey-900">
                  No edition generated yet
                </p>
                <p className="mx-auto mt-1.5 max-w-[420px] text-[13px] leading-[20px] text-grey-600">
                  This briefing is scheduled to run {briefing.schedule.day.toLowerCase()}{" "}
                  at {briefing.schedule.time} {briefing.schedule.timezoneShort}. The
                  first edition will appear here for review once it does.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selection ? (
        <InlineEditPopover
          target={selection}
          onClose={() => {
            window.getSelection()?.removeAllRanges();
            setSelection(null);
          }}
          onApply={handleInlineApply}
          onEditDirectly={() => {
            setEditing({
              blockId: selection.blockId,
              articleId: selection.articleId,
              field: selection.field,
            });
            window.getSelection()?.removeAllRanges();
            setSelection(null);
          }}
        />
      ) : null}

      <AddArticleDialog
        open={!!addingTo}
        sectionTitle={addTargetTitle}
        candidates={edition ? candidateArticles(edition) : []}
        onClose={() => setAddingTo(null)}
        onAdd={handleAddArticle}
      />
    </AppShell>
  );
}

function MetaItem({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon ? <span className="text-grey-500">{icon}</span> : null}
      <dt className="sr-only">{label}</dt>
      <dd className="whitespace-nowrap">{children}</dd>
    </div>
  );
}
