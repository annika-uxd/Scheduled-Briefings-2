import { cx } from "@/lib/format";
import type { Recipient } from "@/lib/types";

/**
 * Overlapping recipient monograms with a "+N" overflow count, per the
 * briefings table in Figma.
 */
export function AvatarStack({
  recipients,
  max = 3,
  className,
}: {
  recipients: Recipient[];
  max?: number;
  className?: string;
}) {
  const shown = recipients.slice(0, max);
  const overflow = recipients.length - shown.length;

  return (
    <div className={cx("flex items-center gap-2", className)}>
      <div className="flex items-center">
        {shown.map((r, i) => (
          <span
            key={r.id}
            title={r.email}
            className={cx(
              "flex size-6 items-center justify-center rounded-full",
              "border border-white bg-grey-100 text-[10px] font-medium tracking-[0.02em]",
              "text-grey-600 uppercase",
              i > 0 && "-ml-1.5",
            )}
          >
            {r.initials}
          </span>
        ))}
      </div>
      {overflow > 0 ? (
        <span className="text-[13px] text-grey-600 tabular-nums">+{overflow}</span>
      ) : null}
    </div>
  );
}
