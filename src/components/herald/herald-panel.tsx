"use client";

import {
  ArrowUpIcon,
  CheckIcon,
  MicrophoneIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cx } from "@/lib/format";
import type { HeraldMessage } from "@/lib/types";

/**
 * Herald's conversation surface. Used in briefing review and template creation
 * so the interaction model is identical in both places: Herald states what it
 * has in context, offers openings, and records what it changed.
 */

export function HeraldPanel({
  status,
  intro,
  suggestionsLabel,
  suggestions,
  messages,
  thinking,
  onSend,
  placeholder = "Describe what you want…",
  footer,
  disabled,
}: {
  status: string;
  /** Standing context line shown above the transcript. */
  intro: ReactNode;
  suggestionsLabel: string;
  suggestions: string[];
  messages: HeraldMessage[];
  thinking: string | null;
  onSend: (text: string) => void;
  placeholder?: string;
  footer?: ReactNode;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Follow the conversation as it grows — but not on mount, or the standing
  // context line and the opening prompts scroll out of view before they're read.
  useEffect(() => {
    if (!messages.length && !thinking) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  const send = () => {
    const text = draft.trim();
    if (!text || disabled) return;
    setDraft("");
    onSend(text);
  };

  const showSuggestions = messages.length === 0 && suggestions.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-grey-200 px-4 py-3.5">
        <span className="flex items-center gap-2">
          <span className="font-serif text-[15px] leading-none font-semibold text-violet-700">
            H
          </span>
          <span className="text-[13px] font-semibold text-grey-900">Herald</span>
        </span>
        <span className="flex items-center gap-1.5 text-[12px] text-grey-600">
          <span
            className={cx(
              "size-1.5 rounded-full",
              thinking ? "animate-thinking bg-violet-700" : "bg-violet-700",
            )}
          />
          {thinking ? "Working" : status}
        </span>
      </header>

      <div
        ref={scrollRef}
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        <div className="text-[13px] leading-[21px] text-grey-600">{intro}</div>

        {showSuggestions ? (
          <div className="mt-5">
            <p className="label-caps">{suggestionsLabel}</p>
            <div className="mt-2 flex flex-col gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSend(s)}
                  disabled={disabled}
                  className={cx(
                    "rounded-lg bg-grey-100 px-3 py-2.5 text-left text-[13px] leading-[19px]",
                    "text-grey-800 transition-colors hover:bg-grey-200/70",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.length ? (
          <div className="mt-5 flex flex-col gap-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
        ) : null}

        {thinking ? (
          <div className="mt-4 flex items-center gap-2 text-[13px] text-grey-600">
            <span className="flex gap-1">
              <span className="animate-thinking size-1 rounded-full bg-violet-700" />
              <span
                className="animate-thinking size-1 rounded-full bg-violet-700"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="animate-thinking size-1 rounded-full bg-violet-700"
                style={{ animationDelay: "0.3s" }}
              />
            </span>
            {thinking}
          </div>
        ) : null}

        <div ref={endRef} />
      </div>

      {footer ? (
        <div className="shrink-0 border-t border-grey-200 px-4 py-3">{footer}</div>
      ) : null}

      <div className="shrink-0 p-3">
        <div
          className={cx(
            "rounded-lg border border-grey-200 bg-white transition-colors",
            "focus-within:border-violet-700 focus-within:ring-2 focus-within:ring-violet-700/12",
          )}
        >
          <textarea
            rows={2}
            value={draft}
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={placeholder}
            aria-label="Message Herald"
            className="block w-full resize-none rounded-t-lg px-3 pt-2.5 text-[13px] leading-[20px] text-grey-900 outline-none placeholder:text-grey-500 disabled:opacity-60"
          />
          <div className="flex items-center justify-between px-2.5 pt-1 pb-2">
            <span className="flex size-6 items-center justify-center text-grey-400">
              <PlusIcon size={14} />
            </span>
            <span className="flex items-center gap-1">
              <span className="flex size-6 items-center justify-center text-grey-400">
                <MicrophoneIcon size={14} />
              </span>
              <button
                type="button"
                onClick={send}
                disabled={!draft.trim() || disabled}
                aria-label="Send message to Herald"
                className={cx(
                  "flex size-6 items-center justify-center rounded-md transition-colors",
                  draft.trim() && !disabled
                    ? "bg-violet-700 text-white hover:bg-violet-800"
                    : "bg-grey-100 text-grey-400",
                )}
              >
                <ArrowUpIcon size={12} weight="bold" />
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: HeraldMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-lg rounded-br-sm bg-grey-100 px-3 py-2 text-[13px] leading-[20px] text-grey-900">
          {message.text}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <p className="text-[13px] leading-[21px] text-grey-800">{message.text}</p>

      {message.changes?.length ? (
        <ul className="mt-2.5 flex flex-col gap-1.5">
          {message.changes.map((change, i) => (
            <li
              key={i}
              className="flex gap-2 text-[12px] leading-[18px] text-grey-600"
            >
              <CheckIcon
                size={12}
                weight="bold"
                className="mt-1 shrink-0 text-violet-700"
              />
              <span>{change}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {message.steps?.length ? (
        <ol className="mt-2.5 flex flex-col gap-1.5">
          {message.steps.map((step, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-[12px] text-grey-600"
            >
              <CheckIcon size={12} weight="bold" className="shrink-0 text-violet-700" />
              {step}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
