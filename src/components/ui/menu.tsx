"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cx } from "@/lib/format";

/**
 * A small contextual menu anchored to a trigger. Closes on outside click,
 * Escape and scroll, and returns focus to the trigger — enough behaviour for a
 * prototype without pulling in a popover library.
 */

export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  tone?: "default" | "danger";
  /** Renders a hairline above this item. */
  separated?: boolean;
}

export function Menu({
  items,
  trigger,
  align = "end",
  label,
}: {
  items: MenuItem[];
  trigger: (props: {
    open: boolean;
    toggle: () => void;
    ref: React.Ref<HTMLButtonElement>;
    "aria-haspopup": "menu";
    "aria-expanded": boolean;
    "aria-controls": string;
  }) => ReactNode;
  align?: "start" | "end";
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const close = useCallback(
    (restoreFocus = false) => {
      setOpen(false);
      if (restoreFocus) triggerRef.current?.focus();
    },
    [],
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close(true);
      }
    };
    // Any scroll detaches the menu from its anchor, so dismiss it.
    const onScroll = () => close();

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, close]);

  return (
    <div ref={wrapRef} className="relative">
      {trigger({
        open,
        toggle: () => setOpen((v) => !v),
        ref: triggerRef,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": menuId,
      })}

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className={cx(
            "animate-rise absolute z-50 mt-1 min-w-[208px] rounded-lg border border-grey-200",
            "bg-white py-1 shadow-popover",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => (
            <div key={item.id}>
              {item.separated ? (
                <div className="my-1 h-px bg-grey-200" role="separator" />
              ) : null}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  item.onSelect();
                }}
                className={cx(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px]",
                  "transition-colors duration-75",
                  item.tone === "danger"
                    ? "text-danger-fg hover:bg-danger-surface"
                    : "text-grey-900 hover:bg-grey-50",
                )}
              >
                <span
                  className={cx(
                    "flex size-4 shrink-0 items-center justify-center",
                    item.tone === "danger" ? "text-danger-fg" : "text-grey-500",
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
