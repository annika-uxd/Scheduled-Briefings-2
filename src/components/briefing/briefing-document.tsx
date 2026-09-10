"use client";

import { PlusIcon } from "@phosphor-icons/react";


import { ArticleCard, type ArticleEditingState } from "@/components/briefing/article-card";
import {
  BannerBlock,
  BarChartBlock,
  CalloutBlock,
  ContentsBlock,
  FooterBlock,
  LineChartBlock,
  MetricsBlock,
  PieChartBlock,
  QuoteBlock,
  SectionTitleBlock,
  TableBlock,
} from "@/components/briefing/blocks";
import { EditableText, type TextTarget } from "@/components/briefing/editable-text";
import { cx } from "@/lib/format";
import type { Edition, EditionBlock } from "@/lib/types";

/**
 * Renders a generated edition as a document.
 *
 * The same component serves the read-only previews (template detail, briefing
 * configuration) and the fully interactive review surface — `interactive`
 * decides whether text can be selected and articles acted on.
 */

export interface DocumentHandlers {
  onSelectText: (target: TextTarget) => void;
  onCommitText: (
    blockId: string,
    field: TextTarget["field"],
    value: string,
    articleId?: string,
  ) => void;
  editing: ArticleEditingState | null;
  onEditingChange: (state: ArticleEditingState | null) => void;
  onRemoveArticle: (articleId: string) => void;
  onReplaceArticle: (articleId: string) => void;
  onAddArticle: (blockId: string) => void;
  /** Block id to highlight after a Herald change. */
  flashBlockId?: string | null;
  flash?: { blockId: string; articleId?: string; field: TextTarget["field"] } | null;
}

export function BriefingDocument({
  edition,
  title,
  interactive = false,
  handlers,
  className,
}: {
  edition: Edition;
  title: string;
  interactive?: boolean;
  handlers?: DocumentHandlers;
  className?: string;
}) {
  let sectionIndex = 0;

  const jumpTo = (sectionId: string) => {
    document
      .getElementById(`section-${sectionId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const banner = edition.blocks.find((b) => b.kind === "banner");
  const body = edition.blocks.filter((b) => b.kind !== "banner");

  return (
    <article
      className={cx(
        "overflow-hidden rounded-lg border border-grey-200 bg-white shadow-xs",
        className,
      )}
    >
      {banner?.kind === "banner" ? (
        <BannerBlock title={banner.title} subtitle={banner.subtitle} />
      ) : null}

      <div className="px-6 py-8 sm:px-10 sm:py-10">
        <header className="mb-8">
          <h1 className="font-serif text-[27px] leading-[1.2] tracking-[-0.01em] text-grey-900">
            {title}
          </h1>
          <p className="mt-2 text-[13px] text-grey-500">{edition.dateLabel}</p>
          <p className="mt-1 text-[12px] text-grey-500">
            {edition.windowLabel} · {edition.articlesScanned.toLocaleString()} articles
            reviewed
          </p>
        </header>

        <div className="flex flex-col gap-8">
          {body.map((block) => {
            if (block.kind === "sectionTitle") sectionIndex += 1;
            return (
              <div key={block.id} id={`block-${block.id}`} className="scroll-mt-6">
                <BlockRenderer
                  block={block}
                  sectionIndex={sectionIndex}
                  interactive={interactive}
                  handlers={handlers}
                  onJump={jumpTo}
                />
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function BlockRenderer({
  block,
  sectionIndex,
  interactive,
  handlers,
  onJump,
}: {
  block: EditionBlock;
  sectionIndex: number;
  interactive: boolean;
  handlers?: DocumentHandlers;
  onJump: (sectionId: string) => void;
}) {
  const noop = () => {};
  const flash = handlers?.flash;
  const flashesHere = (field: TextTarget["field"], articleId?: string) =>
    !!flash &&
    flash.blockId === block.id &&
    flash.field === field &&
    flash.articleId === articleId;

  switch (block.kind) {
    case "contents":
      return (
        <ContentsBlock
          entries={block.entries}
          onJump={interactive ? onJump : undefined}
        />
      );

    case "sectionTitle":
      return (
        <div id={`section-${block.sectionId}`} className="scroll-mt-6 pt-2">
          <SectionTitleBlock title={block.title} index={sectionIndex} />
        </div>
      );

    case "summary":
      return (
        <EditableText
          value={block.text}
          blockId={block.id}
          field="text"
          editing={
            !!handlers?.editing &&
            handlers.editing.blockId === block.id &&
            handlers.editing.field === "text" &&
            !handlers.editing.articleId
          }
          onEditingChange={(v) =>
            handlers?.onEditingChange(v ? { blockId: block.id, field: "text" } : null)
          }
          onSelect={interactive && handlers ? handlers.onSelectText : noop}
          onCommit={(v) => handlers?.onCommitText(block.id, "text", v)}
          flash={flashesHere("text")}
          className="text-[14px] leading-[23px] text-grey-800"
        />
      );

    case "metrics":
      return <MetricsBlock metrics={block.metrics} />;

    case "barChart":
      return <BarChartBlock title={block.title} points={block.points} />;

    case "lineChart":
      return <LineChartBlock title={block.title} points={block.points} />;

    case "pieChart":
      return <PieChartBlock title={block.title} points={block.points} />;

    case "table":
      return <TableBlock columns={block.columns} rows={block.rows} />;

    case "callout":
      return (
        <CalloutBlock tone={block.tone} title={block.title}>
          <EditableText
            value={block.text}
            blockId={block.id}
            field="calloutText"
            editing={
              !!handlers?.editing &&
              handlers.editing.blockId === block.id &&
              handlers.editing.field === "calloutText"
            }
            onEditingChange={(v) =>
              handlers?.onEditingChange(
                v ? { blockId: block.id, field: "calloutText" } : null,
              )
            }
            onSelect={interactive && handlers ? handlers.onSelectText : noop}
            onCommit={(v) => handlers?.onCommitText(block.id, "calloutText", v)}
            flash={flashesHere("calloutText")}
          />
        </CalloutBlock>
      );

    case "quote":
      return (
        <QuoteBlock attribution={block.attribution}>
          <EditableText
            value={block.text}
            blockId={block.id}
            field="text"
            editing={
              !!handlers?.editing &&
              handlers.editing.blockId === block.id &&
              handlers.editing.field === "text"
            }
            onEditingChange={(v) =>
              handlers?.onEditingChange(v ? { blockId: block.id, field: "text" } : null)
            }
            onSelect={interactive && handlers ? handlers.onSelectText : noop}
            onCommit={(v) => handlers?.onCommitText(block.id, "text", v)}
            flash={flashesHere("text")}
          />
        </QuoteBlock>
      );

    case "stories":
      return (
        <div
          className={cx(
            "flex flex-col gap-5",
            handlers?.flashBlockId === block.id && "herald-flash rounded-md",
          )}
        >
          {block.articles.length === 0 ? (
            <p className="rounded-md border border-dashed border-grey-200 px-4 py-5 text-center text-[12px] text-grey-500">
              No articles in this section. Ask Herald to find one, or add a story
              below.
            </p>
          ) : (
            block.articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                blockId={block.id}
                interactive={interactive}
                onSelectText={handlers?.onSelectText}
                onCommitText={(field, value) =>
                  handlers?.onCommitText(block.id, field, value, article.id)
                }
                editing={handlers?.editing ?? null}
                onEditingChange={handlers?.onEditingChange}
                onRemove={
                  handlers ? () => handlers.onRemoveArticle(article.id) : undefined
                }
                onReplace={
                  handlers ? () => handlers.onReplaceArticle(article.id) : undefined
                }
                flashField={
                  flash && flash.blockId === block.id && flash.articleId === article.id
                    ? flash.field
                    : null
                }
              />
            ))
          )}

          {interactive && handlers ? (
            <button
              type="button"
              onClick={() => handlers.onAddArticle(block.id)}
              className={cx(
                "flex items-center gap-1.5 self-start rounded-md px-2 py-1 text-[12px]",
                "text-grey-500 transition-colors hover:bg-violet-50 hover:text-violet-700",
              )}
            >
              <PlusIcon size={12} weight="bold" />
              Add article
            </button>
          ) : null}
        </div>
      );

    case "divider":
      return <hr className="border-grey-200" />;

    case "footer":
      return <FooterBlock>{block.text}</FooterBlock>;

    default:
      return null;
  }
}
