import type { ReactNode } from "react";

import { cx } from "@/lib/format";

/**
 * The white band at the top of each module tab: title, one-line context,
 * search and the primary CTA.
 */
export function PageHeader({
  title,
  description,
  search,
  action,
}: {
  title: string;
  description: string;
  search?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border-b border-grey-200 bg-white px-6 py-5 lg:px-9">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[20px] leading-6 font-medium text-grey-900">{title}</h1>
          <p className="mt-2.5 max-w-[600px] text-[14px] leading-5 text-grey-700">
            {description}
          </p>
        </div>

        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end lg:min-w-[400px] lg:flex-col lg:items-end">
          {action ? <div className="flex justify-end">{action}</div> : null}
          {search ? <div className="flex justify-end">{search}</div> : null}
        </div>
      </div>
    </div>
  );
}

/** The thin metadata strip between the header and the content grid. */
export function ContentBar({
  left,
  right,
  className,
}: {
  left: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "mx-auto flex max-w-[1240px] items-center justify-between gap-4",
        "border-b border-grey-200 pb-2.5 text-[13px] text-grey-600",
        className,
      )}
    >
      <div className="min-w-0">{left}</div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
