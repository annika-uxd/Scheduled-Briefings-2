"use client";

import { BannerBlock, ContentsBlock, SectionTitleBlock } from "@/components/briefing/blocks";
import { cx } from "@/lib/format";
import type { Template } from "@/lib/types";

/**
 * The live preview beside the briefing configuration form.
 *
 * It deliberately shows structure rather than fabricated content: the sections
 * the template defines, the instruction the user has written for each, and
 * placeholder rows where generated content will land. Showing invented
 * articles here would imply the briefing had already run.
 */
export function ConfigPreview({
  template,
  title,
  sectionPrompts,
  lookback,
}: {
  template: Template;
  title: string;
  sectionPrompts: Record<string, string>;
  lookback: string;
}) {
  const hasBanner = template.blocks.some((b) => b.kind === "banner");

  return (
    <article className="overflow-hidden rounded-lg border border-grey-200 bg-white shadow-xs">
      {hasBanner ? (
        <BannerBlock title={template.name} subtitle="Global Communications" />
      ) : null}

      <div className="px-6 py-8 sm:px-10 sm:py-9">
        <header className="mb-8">
          <h1
            className={cx(
              "font-serif text-[26px] leading-[1.2] tracking-[-0.01em]",
              title ? "text-grey-900" : "text-grey-400",
            )}
          >
            {title || "Untitled briefing"}
          </h1>
          <p className="mt-2 text-[13px] text-grey-500">
            Sample edition · {lookback.toLowerCase()}
          </p>
        </header>

        <div className="flex flex-col gap-8">
          <ContentsBlock
            entries={template.sections.map((s) => ({ id: s.id, title: s.title }))}
          />

          {template.sections.map((section, i) => {
            const prompt = sectionPrompts[section.id]?.trim();
            const blocks = template.blocks.filter(
              (b) => b.sectionId === section.id && b.kind !== "sectionTitle",
            );

            return (
              <section key={section.id} className="flex flex-col gap-4">
                <SectionTitleBlock title={section.title} index={i + 1} />

                <p
                  className={cx(
                    "text-[12.5px] leading-[19px]",
                    prompt ? "text-grey-700" : "text-grey-500 italic",
                  )}
                >
                  {prompt
                    ? prompt
                    : "No instruction yet — this section will use the template default."}
                </p>

                <div className="flex flex-col gap-4">
                  {blocks.map((block) => (
                    <PlaceholderBlock key={block.id} kind={block.kind} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </article>
  );
}

const Bar = ({ w }: { w: string }) => (
  <span
    className="skeleton-shimmer block h-[9px] rounded-[3px] bg-grey-100"
    style={{ width: w }}
  />
);

function PlaceholderBlock({ kind }: { kind: string }) {
  switch (kind) {
    case "metrics":
      return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <Bar w="70%" />
              <span className="skeleton-shimmer block h-[22px] w-full rounded-[3px] bg-grey-100" />
            </div>
          ))}
        </div>
      );

    case "barChart":
      return (
        <div className="flex h-[100px] items-end gap-2">
          {[48, 66, 40, 82, 58, 92, 44].map((h, i) => (
            <span
              key={i}
              className="skeleton-shimmer flex-1 rounded-[3px] bg-grey-100"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      );

    case "lineChart":
      return (
        <span className="skeleton-shimmer block h-[100px] w-full rounded-[3px] bg-grey-100" />
      );

    case "pieChart":
      return (
        <div className="flex items-center gap-5">
          <span className="skeleton-shimmer block size-[88px] shrink-0 rounded-full bg-grey-100" />
          <span className="flex flex-1 flex-col gap-2">
            <Bar w="60%" />
            <Bar w="46%" />
            <Bar w="52%" />
          </span>
        </div>
      );

    case "table":
      return (
        <div className="flex flex-col gap-2">
          <span className="skeleton-shimmer block h-[9px] w-full rounded-[3px] bg-grey-200" />
          <Bar w="100%" />
          <Bar w="100%" />
          <Bar w="100%" />
        </div>
      );

    case "stories":
      return (
        <div className="flex flex-col gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <span className="skeleton-shimmer block h-[11px] w-[78%] rounded-[3px] bg-grey-200" />
              <Bar w="100%" />
              <Bar w="88%" />
            </div>
          ))}
        </div>
      );

    case "callout":
      return (
        <div className="flex flex-col gap-2 rounded-lg border border-grey-200 bg-grey-50 px-4 py-3">
          <Bar w="40%" />
          <Bar w="76%" />
        </div>
      );

    case "quote":
      return (
        <div className="flex flex-col gap-2 border-l-2 border-grey-200 pl-4">
          <Bar w="92%" />
          <Bar w="64%" />
        </div>
      );

    case "summary":
      return (
        <div className="flex flex-col gap-2">
          <Bar w="100%" />
          <Bar w="94%" />
          <Bar w="72%" />
        </div>
      );

    case "footer":
      return (
        <div className="border-t border-grey-200 pt-4">
          <Bar w="58%" />
        </div>
      );

    default:
      return <Bar w="100%" />;
  }
}
