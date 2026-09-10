import { cx } from "@/lib/format";
import type { Template } from "@/lib/types";

/**
 * A miniature rendering of a template's structure, used as the card thumbnail.
 * It is drawn from the template's own block list rather than a screenshot, so a
 * template Herald generated this session gets a truthful thumbnail too.
 */
export function TemplateThumbnail({
  template,
  className,
}: {
  template: Template;
  className?: string;
}) {
  const hasBanner = template.blocks.some((b) => b.kind === "banner");
  const hasContents = template.blocks.some((b) => b.kind === "contents");

  return (
    <div
      aria-hidden
      className={cx(
        "flex justify-center overflow-hidden bg-grey-50 px-6 pt-6",
        className,
      )}
    >
      <div className="w-full max-w-[248px] rounded-t-[3px] border border-b-0 border-grey-200 bg-white shadow-xs">
        {hasBanner ? (
          <div className="h-[26px] bg-linear-100 from-[#2c3f8f] via-[#1462b8] to-[#00a3e0]" />
        ) : null}

        <div className="flex flex-col gap-[7px] px-3 py-3">
          {hasContents ? (
            <div className="mb-0.5">
              <p className="text-[4.5px] font-medium tracking-[0.1em] text-grey-500 uppercase">
                Contents
              </p>
              <div className="mt-1 flex flex-col gap-[3px]">
                {template.sections.slice(0, 3).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-1">
                    <span className="text-[4.5px] text-grey-400 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="max-w-[76px] truncate text-[5px] text-grey-800">
                      {s.title}
                    </span>
                    <span className="h-px flex-1 bg-grey-100" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {template.blocks
            .filter((b) => !["banner", "contents", "footer"].includes(b.kind))
            .slice(0, 9)
            .map((b) => (
              <MiniBlock key={b.id} kind={b.kind} label={b.label} />
            ))}
        </div>
      </div>
    </div>
  );
}

function MiniBlock({ kind, label }: { kind: string; label: string }) {
  switch (kind) {
    case "sectionTitle":
      return (
        <div className="flex items-center gap-1 border-b border-grey-200 pb-[3px]">
          <span className="max-w-[90px] truncate text-[5px] font-semibold text-grey-900">
            {label === "Section title" ? "Section" : label}
          </span>
        </div>
      );

    case "summary":
      return (
        <div className="flex flex-col gap-[2px]">
          <span className="h-[2.5px] w-full rounded-full bg-grey-100" />
          <span className="h-[2.5px] w-[82%] rounded-full bg-grey-100" />
        </div>
      );

    case "metrics":
      return (
        <div className="grid grid-cols-4 gap-[3px]">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-[2px]">
              <span className="h-[2px] w-[70%] rounded-full bg-grey-100" />
              <span className="h-[4px] w-full rounded-[1px] bg-grey-200" />
            </div>
          ))}
        </div>
      );

    case "barChart":
      return (
        <div className="flex h-[18px] items-end gap-[2px]">
          {[9, 13, 7, 16, 11, 18, 8].map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-[1px] bg-violet-200"
              style={{ height: h }}
            />
          ))}
        </div>
      );

    case "lineChart":
      return (
        <svg viewBox="0 0 100 20" className="h-[18px] w-full">
          <polyline
            points="0,15 16,11 33,13 50,6 66,8 83,3 100,5"
            fill="none"
            className="stroke-violet-700"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      );

    case "pieChart":
      return (
        <div className="flex items-center gap-2">
          <span className="size-[16px] shrink-0 rounded-full border-[3px] border-violet-200 border-t-violet-700 border-r-violet-700" />
          <span className="flex flex-1 flex-col gap-[2px]">
            <span className="h-[2px] w-[60%] rounded-full bg-grey-100" />
            <span className="h-[2px] w-[45%] rounded-full bg-grey-100" />
          </span>
        </div>
      );

    case "table":
      return (
        <div className="flex flex-col gap-[2px]">
          <span className="h-[2.5px] w-full rounded-full bg-grey-200" />
          <span className="h-[2px] w-full rounded-full bg-grey-100" />
          <span className="h-[2px] w-full rounded-full bg-grey-100" />
        </div>
      );

    case "stories":
      return (
        <div className="flex flex-col gap-[4px]">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-[2px]">
              <span className="h-[3px] w-[88%] rounded-full bg-grey-300" />
              <span className="h-[2px] w-full rounded-full bg-grey-100" />
              <span className="h-[2px] w-[70%] rounded-full bg-grey-100" />
            </div>
          ))}
        </div>
      );

    case "callout":
      return (
        <div className="flex flex-col gap-[2px] rounded-[2px] bg-warning-surface px-[3px] py-[3px]">
          <span className="h-[2px] w-[55%] rounded-full bg-warning-fg/25" />
          <span className="h-[2px] w-[80%] rounded-full bg-warning-fg/15" />
        </div>
      );

    case "quote":
      return (
        <div className="flex gap-[3px] border-l border-violet-700 pl-[4px]">
          <span className="flex flex-1 flex-col gap-[2px]">
            <span className="h-[2.5px] w-full rounded-full bg-grey-200" />
            <span className="h-[2.5px] w-[65%] rounded-full bg-grey-200" />
          </span>
        </div>
      );

    default:
      return <span className="h-[2.5px] w-full rounded-full bg-grey-100" />;
  }
}
