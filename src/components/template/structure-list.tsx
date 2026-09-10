import {
  ChartBarIcon,
  ChartLineIcon,
  ChartPieSliceIcon,
  ChatCenteredTextIcon,
  ImageIcon,
  LinkSimpleIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  LockSimpleIcon,
  MinusIcon,
  NewspaperIcon,
  NoteIcon,
  QuotesIcon,
  TableIcon,
  TextAaIcon,
  TextHOneIcon,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

import { cx } from "@/lib/format";
import type { BlockKind, TemplateBlock, TemplateSection } from "@/lib/types";

const BLOCK_ICON: Record<BlockKind, ComponentType<{ size?: number }>> = {
  banner: ImageIcon,
  header: TextHOneIcon,
  contents: ListNumbersIcon,
  sectionTitle: TextHOneIcon,
  summary: TextAaIcon,
  metrics: ChartBarIcon,
  stories: NewspaperIcon,
  table: TableIcon,
  barChart: ChartBarIcon,
  lineChart: ChartLineIcon,
  pieChart: ChartPieSliceIcon,
  callout: NoteIcon,
  quote: QuotesIcon,
  image: ImageIcon,
  links: LinkSimpleIcon,
  divider: MinusIcon,
  footer: ChatCenteredTextIcon,
};

/**
 * The structural overview on template detail. Read-only by design — customers
 * see exactly what a template contains but cannot rearrange it, which is what
 * keeps every edition of a briefing consistent.
 */
export function StructureList({
  blocks,
  sections,
  compact,
}: {
  blocks: TemplateBlock[];
  sections: TemplateSection[];
  compact?: boolean;
}) {
  const sectionTitle = (id?: string) =>
    sections.find((s) => s.id === id)?.title;

  return (
    <ol className="overflow-hidden rounded-lg border border-grey-200 bg-white">
      {blocks.map((block, i) => {
        const Icon = BLOCK_ICON[block.kind] ?? ListBulletsIcon;
        const owner = sectionTitle(block.sectionId);
        const label =
          block.kind === "sectionTitle" && owner ? owner : block.label;

        return (
          <li
            key={block.id}
            className={cx(
              "flex items-center gap-3 border-b border-grey-200 last:border-0",
              compact ? "px-3 py-2" : "px-3.5 py-2.5",
            )}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-grey-100 text-grey-600">
              <Icon size={14} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[13px] leading-[18px] font-medium text-grey-900">
                <span className="truncate">{label}</span>
                <LockSimpleIcon size={10} className="shrink-0 text-grey-400" />
              </p>
              <p className="truncate text-[12px] leading-[17px] text-grey-600">
                {block.description}
                {owner && block.kind !== "sectionTitle" ? ` · ${owner}` : ""}
              </p>
            </div>

            <span className="shrink-0 text-[12px] text-grey-400 tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
