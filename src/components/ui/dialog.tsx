"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

/**
 * Confirmation dialog. Deliberately minimal: one question, one destructive
 * action, one way out.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  tone = "danger",
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: "danger" | "primary";
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    // Prevent the page behind from scrolling while the dialog is up.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-grey-900/20"
        onClick={onCancel}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="animate-rise relative w-full max-w-[440px] rounded-lg border border-grey-200 bg-white p-5 shadow-overlay"
      >
        <h2 id="confirm-title" className="text-[15px] font-medium text-grey-900">
          {title}
        </h2>
        <div className="mt-1.5 text-[13px] leading-[20px] text-grey-600">
          {description}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            ref={confirmRef}
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
