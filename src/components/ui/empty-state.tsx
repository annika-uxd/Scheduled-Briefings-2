import type { ReactNode } from "react";

/** Centred empty state used by both module tabs, per Figma. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-24 text-center">
      <p className="text-[15px] font-medium text-grey-900">{title}</p>
      <p className="mt-1 max-w-[420px] text-[13px] leading-[20px] text-grey-600">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
