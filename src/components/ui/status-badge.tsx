import { cx } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/format";
import type { BriefingStatus } from "@/lib/types";

/** Colour ramps lifted from the Figma status badge instances. */
const TONE: Record<BriefingStatus, { wrap: string; dot: string }> = {
  "needs-review": {
    wrap: "bg-warning-surface text-warning-fg",
    dot: "bg-warning-fg",
  },
  active: { wrap: "bg-success-surface text-success-fg", dot: "bg-success-fg" },
  scheduled: { wrap: "bg-grey-50 text-grey-600", dot: "bg-grey-400" },
  paused: { wrap: "bg-grey-100 text-grey-600", dot: "bg-grey-400" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: BriefingStatus;
  className?: string;
}) {
  const tone = TONE[status];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-1",
        "text-[12px] leading-4 font-semibold tracking-[0.01em] whitespace-nowrap",
        tone.wrap,
        className,
      )}
    >
      <span className={cx("size-1.5 shrink-0 rounded-full", tone.dot)} />
      {STATUS_LABEL[status]}
    </span>
  );
}
