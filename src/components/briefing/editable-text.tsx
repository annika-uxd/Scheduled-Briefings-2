"use client";

import { useEffect, useRef, useState } from "react";

import { cx } from "@/lib/format";

/**
 * A passage of generated text that can be selected for Herald editing or
 * edited directly in place.
 *
 * Selection is the primary interaction: highlighting any part of the text
 * raises the inline popover. Direct editing is a deliberate second step,
 * entered from the popover, so ordinary reading never turns into typing.
 */

export interface TextTarget {
  /** Block that owns the text. */
  blockId: string;
  /** Article that owns the text, when the block is a story list. */
  articleId?: string;
  /** Which field on that object. */
  field: "summary" | "whyItMatters" | "headline" | "text" | "calloutText";
  /** Full current value of the field. */
  full: string;
  /** The portion the user selected. */
  selection: string;
  /** Anchor rectangle for the popover, in viewport coordinates. */
  rect: { top: number; left: number; bottom: number; right: number };
}

export function EditableText({
  value,
  blockId,
  articleId,
  field,
  className,
  onSelect,
  onCommit,
  editing,
  onEditingChange,
  flash,
  as = "p",
}: {
  value: string;
  blockId: string;
  articleId?: string;
  field: TextTarget["field"];
  className?: string;
  onSelect: (target: TextTarget) => void;
  onCommit: (next: string) => void;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  flash?: boolean;
  as?: "p" | "h3" | "div";
}) {
  const ref = useRef<HTMLElement>(null);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      // Defer so the textarea exists before we size and focus it.
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      });
    }
  }, [editing, value]);

  /** Raises the popover when the user finishes a selection inside this text. */
  function handleMouseUp() {
    if (editing) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;

    const text = sel.toString().trim();
    if (text.length < 3) return;

    const range = sel.getRangeAt(0);
    if (!ref.current?.contains(range.commonAncestorContainer)) return;

    const rect = range.getBoundingClientRect();
    onSelect({
      blockId,
      articleId,
      field,
      full: value,
      selection: text,
      rect: {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
      },
    });
  }

  if (editing) {
    return (
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onEditingChange(false);
            }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onCommit(draft);
            }
          }}
          onBlur={() => onCommit(draft)}
          className={cx(
            "block w-full resize-none rounded-md border border-violet-700 bg-white",
            "px-2 py-1.5 shadow-[0_0_0_3px_rgba(124,59,237,0.12)] outline-none",
            className,
          )}
        />
        <p className="mt-1 text-[11px] text-grey-500">
          <kbd className="font-sans">⌘↵</kbd> to save · <kbd className="font-sans">Esc</kbd> to
          cancel
        </p>
      </div>
    );
  }

  const Tag = as;
  return (
    <Tag
      ref={ref as never}
      onMouseUp={handleMouseUp}
      className={cx(
        "cursor-text selection:bg-violet-100 selection:text-grey-900",
        flash && "herald-flash rounded-sm",
        className,
      )}
    >
      {value}
    </Tag>
  );
}
