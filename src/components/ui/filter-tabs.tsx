"use client";

import { cx } from "@/lib/format";

export interface FilterTab {
  id: string;
  label: string;
  count: number;
}

/** Segmented status filter above the briefings table. */
export function FilterTabs({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: FilterTab[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx(
        "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-md",
        "border border-grey-200 bg-white p-0.5",
        // Hide the scrollbar: the row is short and a visible bar reads as chrome.
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cx(
              "flex shrink-0 items-center gap-1.5 rounded-[5px] px-2.5 py-1",
              "text-[13px] whitespace-nowrap transition-colors",
              active
                ? "bg-grey-100 font-medium text-grey-900"
                : "text-grey-600 hover:text-grey-900",
            )}
          >
            {tab.label}
            <span
              className={cx(
                "text-[12px] tabular-nums",
                active ? "text-grey-600" : "text-grey-500",
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
