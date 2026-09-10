"use client";

import { CheckCircleIcon, InfoIcon, XIcon } from "@phosphor-icons/react";

import { useStore } from "@/lib/store";

/** Toast stack, anchored top-right as in the Figma success state. */
export function ToastViewport() {
  const { toasts, dismissToast } = useStore();

  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed top-3 right-3 z-100 flex w-[min(320px,calc(100vw-24px))] flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="animate-toast pointer-events-auto flex items-start gap-2.5 rounded-lg border border-grey-200 bg-white p-3 shadow-popover"
        >
          <span className="mt-px shrink-0">
            {toast.tone === "success" ? (
              <CheckCircleIcon size={16} weight="fill" className="text-success-fg" />
            ) : (
              <InfoIcon size={16} weight="fill" className="text-violet-700" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-grey-900">{toast.title}</p>
            {toast.description ? (
              <p className="mt-0.5 text-[12px] leading-[18px] text-grey-600">
                {toast.description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="-m-1 shrink-0 rounded p-1 text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
          >
            <XIcon size={12} weight="bold" />
          </button>
        </div>
      ))}
    </div>
  );
}
