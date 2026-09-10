"use client";

import { ArrowUpIcon, PencilSimpleIcon, SparkleIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cx } from "@/lib/format";
import {
  QUICK_INTENT_IDS,
  applyInstruction,
  findIntent,
} from "@/lib/herald/inline-edit";
import type { TextTarget } from "@/components/briefing/editable-text";

const POPOVER_WIDTH = 404;
const GAP = 10;

export interface InlineEditOutcome {
  /** The rewritten full field value. */
  nextValue: string;
  /** Past-tense description for Herald's transcript. */
  description: string;
  /** What the user asked for, echoed into the transcript. */
  instruction: string;
}

/**
 * "Select → ask → modify → see result".
 *
 * The popover applies the change to the selected span only, splicing the
 * result back into the surrounding text so the rest of the passage is
 * untouched.
 */
export function InlineEditPopover({
  target,
  onClose,
  onApply,
  onEditDirectly,
}: {
  target: TextTarget;
  onClose: () => void;
  onApply: (outcome: InlineEditOutcome) => void;
  onEditDirectly: () => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [noChange, setNoChange] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Position against the selection, flipping above when there is no room below
  // and clamping to the viewport so the popover never hangs off-screen.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { height } = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = target.rect.bottom + GAP;
    if (top + height > vh - 12) {
      top = Math.max(12, target.rect.top - height - GAP);
    }

    let left = target.rect.left;
    if (left + POPOVER_WIDTH > vw - 12) left = vw - POPOVER_WIDTH - 12;
    left = Math.max(12, left);

    setPos({ top, left });
  }, [target]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    // Defer so the pointerup that created the selection doesn't close us.
    const t = window.setTimeout(
      () => document.addEventListener("pointerdown", onPointerDown, true),
      0,
    );
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [onClose]);

  /** Splices the rewritten selection back into the full field value. */
  function commit(nextSelection: string, description: string, asked: string) {
    // Some passes have nothing to act on — no jargon to swap, no filler to cut.
    // Say so rather than pretending an edit happened.
    if (nextSelection.trim() === target.selection.trim()) {
      setNoChange(
        "This passage already reads that way — there was nothing for me to change. Try a different instruction, or edit it directly.",
      );
      return;
    }

    const nextValue = target.full.includes(target.selection)
      ? target.full.replace(target.selection, nextSelection)
      : nextSelection;

    setNoChange(null);
    setBusy(true);
    // A brief delay so the change reads as Herald doing work, not a jump cut.
    window.setTimeout(() => {
      onApply({ nextValue, description, instruction: asked });
    }, 320);
  }

  function runIntent(intentId: string) {
    const intent = findIntent(intentId);
    if (!intent) return;
    commit(intent.apply(target.selection), intent.describe, intent.label);
  }

  function runInstruction() {
    const asked = instruction.trim();
    if (!asked) return;
    const result = applyInstruction(target.selection, asked);
    commit(result.text, result.description, asked);
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Edit selected text"
      style={{
        top: pos?.top ?? target.rect.bottom + GAP,
        left: pos?.left ?? target.rect.left,
        width: POPOVER_WIDTH,
        visibility: pos ? "visible" : "hidden",
      }}
      className="animate-rise fixed z-90 max-w-[calc(100vw-24px)] overflow-hidden rounded-lg border border-grey-200 bg-white shadow-overlay"
    >
      <div className="flex items-center gap-2 px-3.5 py-3">
        <SparkleIcon size={14} weight="fill" className="shrink-0 text-violet-700" />
        <p className="flex-1 text-[13px] font-medium text-grey-900">
          What would you like to change?
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-m-1 rounded p-1 text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
        >
          <XIcon size={12} weight="bold" />
        </button>
      </div>

      <p className="max-h-[64px] overflow-hidden border-y border-grey-200 bg-grey-50 px-3.5 py-2 text-[12px] leading-[18px] text-grey-600 italic">
        “{target.selection}”
      </p>

      <div className="p-3.5">
        <div
          className={cx(
            "relative rounded-md border border-grey-200 bg-white transition-colors",
            "focus-within:border-violet-700 focus-within:ring-2 focus-within:ring-violet-700/15",
          )}
        >
          <textarea
            ref={inputRef}
            rows={2}
            value={instruction}
            disabled={busy}
            onChange={(e) => {
              setInstruction(e.target.value);
              if (noChange) setNoChange(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                runInstruction();
              }
            }}
            placeholder="Tell Herald what to change…"
            className="block w-full resize-none rounded-md py-2 pr-10 pl-2.5 text-[13px] leading-[20px] text-grey-900 outline-none placeholder:text-grey-500 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={runInstruction}
            disabled={!instruction.trim() || busy}
            aria-label="Send instruction to Herald"
            className={cx(
              "absolute right-2 bottom-2 flex size-6 items-center justify-center rounded-md transition-colors",
              instruction.trim() && !busy
                ? "bg-violet-700 text-white hover:bg-violet-800"
                : "bg-grey-100 text-grey-400",
            )}
          >
            <ArrowUpIcon size={12} weight="bold" />
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {QUICK_INTENT_IDS.map((id) => {
            const intent = findIntent(id);
            if (!intent) return null;
            return (
              <button
                key={id}
                type="button"
                disabled={busy}
                onClick={() => runIntent(id)}
                className={cx(
                  "rounded-full border border-grey-200 px-2.5 py-1 text-[12px] text-grey-700",
                  "transition-colors hover:border-grey-300 hover:bg-grey-50",
                  "disabled:opacity-50",
                )}
              >
                {intent.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onEditDirectly}
          disabled={busy}
          className="mt-3 -mb-0.5 flex items-center gap-1.5 text-[12px] text-grey-600 transition-colors hover:text-violet-700 disabled:opacity-50"
        >
          <PencilSimpleIcon size={13} />
          Or edit directly
        </button>

        {busy ? (
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-violet-700">
            <SparkleIcon size={12} weight="fill" className="animate-thinking" />
            Herald is rewriting…
          </p>
        ) : noChange ? (
          <p
            role="status"
            className="mt-3 rounded-md bg-grey-50 px-2.5 py-2 text-[12px] leading-[18px] text-grey-600"
          >
            {noChange}
          </p>
        ) : null}
      </div>
    </div>
  );
}
