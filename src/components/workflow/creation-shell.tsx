"use client";

import { CheckIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { cx } from "@/lib/format";

/**
 * The full-screen creation surface. Entering one should feel like stepping into
 * a dedicated workflow rather than navigating to another page, so it replaces
 * the application chrome entirely and offers exactly one way out.
 */

export interface WorkflowStep {
  id: string;
  label: string;
  state: "done" | "current" | "upcoming";
}

export function CreationShell({
  title,
  steps,
  onClose,
  actions,
  children,
}: {
  title: ReactNode;
  steps?: WorkflowStep[];
  onClose: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-grey-50">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-grey-200 bg-white px-3 sm:px-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close and discard"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-grey-600 transition-colors hover:bg-grey-100 hover:text-grey-900"
        >
          <XIcon size={16} />
        </button>

        <span aria-hidden className="h-6 w-px shrink-0 bg-grey-200" />

        <h1 className="min-w-0 flex-1 truncate text-[14px] font-medium text-grey-900">
          {title}
        </h1>

        {steps?.length ? <StepIndicator steps={steps} /> : null}

        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function StepIndicator({ steps }: { steps: WorkflowStep[] }) {
  return (
    <ol className="hidden shrink-0 items-center gap-1.5 md:flex" aria-label="Progress">
      {steps.map((step, i) => (
        <li key={step.id} className="flex items-center gap-1.5">
          {i > 0 ? (
            <CaretRightIcon size={12} className="text-grey-400" aria-hidden />
          ) : null}
          <span
            aria-current={step.state === "current" ? "step" : undefined}
            className={cx(
              "flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1",
              step.state === "current" && "bg-violet-50",
            )}
          >
            <span
              className={cx(
                "flex size-4 items-center justify-center rounded-full text-[10px] font-semibold",
                step.state === "done" && "bg-violet-700 text-white",
                step.state === "current" && "bg-violet-200 text-violet-800",
                step.state === "upcoming" && "bg-grey-200 text-grey-600",
              )}
            >
              {step.state === "done" ? (
                <CheckIcon size={9} weight="bold" />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={cx(
                "text-[13px]",
                step.state === "current"
                  ? "font-medium text-violet-800"
                  : "text-grey-600",
              )}
            >
              {step.label}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Section grouping inside a configuration column, divided by hairlines. */
export function ConfigSection({
  label,
  hint,
  children,
  action,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="border-b border-grey-200 px-5 py-5 last:border-0 sm:px-6">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="label-caps">{label}</h2>
        {action}
      </div>
      {hint ? (
        <p className="mb-3 -mt-1 text-[12px] leading-[18px] text-grey-600">{hint}</p>
      ) : null}
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
