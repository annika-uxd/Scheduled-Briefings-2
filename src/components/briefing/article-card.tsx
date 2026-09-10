"use client";

import {
  ArrowsClockwiseIcon,
  DotsThreeIcon,
  TrashIcon,
} from "@phosphor-icons/react";

import { EditableText, type TextTarget } from "@/components/briefing/editable-text";
import { Menu } from "@/components/ui/menu";
import { cx } from "@/lib/format";
import type { Article } from "@/lib/types";

const SENTIMENT: Record<Article["sentiment"], { label: string; className: string }> = {
  positive: { label: "Positive", className: "text-success-fg" },
  neutral: { label: "Neutral", className: "text-grey-500" },
  negative: { label: "Negative", className: "text-warning-fg" },
};

export interface ArticleEditingState {
  blockId: string;
  articleId?: string;
  field: TextTarget["field"];
}

export function ArticleCard({
  article,
  blockId,
  interactive,
  onSelectText,
  onCommitText,
  editing,
  onEditingChange,
  onRemove,
  onReplace,
  flashField,
}: {
  article: Article;
  blockId: string;
  /** Read-only in previews (template detail, briefing configuration). */
  interactive: boolean;
  onSelectText?: (target: TextTarget) => void;
  onCommitText?: (field: TextTarget["field"], value: string) => void;
  editing?: ArticleEditingState | null;
  onEditingChange?: (state: ArticleEditingState | null) => void;
  onRemove?: () => void;
  onReplace?: () => void;
  flashField?: TextTarget["field"] | null;
}) {
  const sentiment = SENTIMENT[article.sentiment];

  const isEditing = (field: TextTarget["field"]) =>
    !!editing && editing.blockId === blockId && editing.articleId === article.id &&
    editing.field === field;

  const noop = () => {};

  return (
    <article
      className={cx(
        "group/article relative",
        interactive && "-mx-3 rounded-md px-3 py-2 transition-colors hover:bg-grey-50/70",
      )}
    >
      {interactive && (onRemove || onReplace) ? (
        <div className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover/article:opacity-100 focus-within:opacity-100">
          <Menu
            label={`Actions for ${article.headline}`}
            items={[
              ...(onReplace
                ? [
                    {
                      id: "replace",
                      label: "Replace with a better fit",
                      icon: <ArrowsClockwiseIcon size={14} />,
                      onSelect: onReplace,
                    },
                  ]
                : []),
              ...(onRemove
                ? [
                    {
                      id: "remove",
                      label: "Remove article",
                      icon: <TrashIcon size={14} />,
                      onSelect: onRemove,
                      tone: "danger" as const,
                      separated: !!onReplace,
                    },
                  ]
                : []),
            ]}
            trigger={({ toggle, ref, open, ...aria }) => (
              <button
                ref={ref}
                type="button"
                onClick={toggle}
                aria-label={`Actions for ${article.headline}`}
                {...aria}
                className={cx(
                  "flex size-6 items-center justify-center rounded-md border border-grey-200 bg-white",
                  "text-grey-600 shadow-xs transition-colors hover:bg-grey-50 hover:text-grey-900",
                  open && "bg-grey-50 text-grey-900",
                )}
              >
                <DotsThreeIcon size={14} weight="bold" />
              </button>
            )}
          />
        </div>
      ) : null}

      <EditableText
        as="h3"
        value={article.headline}
        blockId={blockId}
        articleId={article.id}
        field="headline"
        editing={isEditing("headline")}
        onEditingChange={(v) =>
          onEditingChange?.(
            v ? { blockId, articleId: article.id, field: "headline" } : null,
          )
        }
        onSelect={interactive && onSelectText ? onSelectText : noop}
        onCommit={(v) => onCommitText?.("headline", v)}
        flash={flashField === "headline"}
        className="pr-8 text-[13.5px] leading-[20px] font-semibold text-grey-900"
      />

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="rounded-[3px] bg-slate-surface px-1.5 py-0.5 text-[10px] font-medium tracking-[0.04em] text-grey-700 uppercase">
          {article.publication}
        </span>
        <span className="text-[11px] text-grey-500">{article.date}</span>
        <span aria-hidden className="size-1 rounded-full bg-grey-300" />
        <span className="text-[11px] text-grey-500">{article.reach} reach</span>
        <span aria-hidden className="size-1 rounded-full bg-grey-300" />
        <span className={cx("text-[11px] font-medium", sentiment.className)}>
          {sentiment.label}
        </span>
      </div>

      <EditableText
        value={article.summary}
        blockId={blockId}
        articleId={article.id}
        field="summary"
        editing={isEditing("summary")}
        onEditingChange={(v) =>
          onEditingChange?.(
            v ? { blockId, articleId: article.id, field: "summary" } : null,
          )
        }
        onSelect={interactive && onSelectText ? onSelectText : noop}
        onCommit={(v) => onCommitText?.("summary", v)}
        flash={flashField === "summary"}
        className="mt-2 text-[13px] leading-[21px] text-grey-700"
      />

      <div className="mt-2 flex gap-2">
        <span className="mt-[7px] h-px w-3 shrink-0 bg-violet-700" />
        <EditableText
          value={article.whyItMatters}
          blockId={blockId}
          articleId={article.id}
          field="whyItMatters"
          editing={isEditing("whyItMatters")}
          onEditingChange={(v) =>
            onEditingChange?.(
              v ? { blockId, articleId: article.id, field: "whyItMatters" } : null,
            )
          }
          onSelect={interactive && onSelectText ? onSelectText : noop}
          onCommit={(v) => onCommitText?.("whyItMatters", v)}
          flash={flashField === "whyItMatters"}
          className="flex-1 text-[12.5px] leading-[20px] text-grey-600"
        />
      </div>
    </article>
  );
}
