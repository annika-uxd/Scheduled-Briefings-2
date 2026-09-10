"use client";

import { XIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { initialsFromEmail } from "@/lib/data/briefings";
import { cx, isValidEmail } from "@/lib/format";
import type { Recipient } from "@/lib/types";

/**
 * Email chip entry. Commits on Enter, comma or blur; rejects anything that is
 * not shaped like an address and says so inline.
 */
export function RecipientInput({
  recipients,
  onChange,
}: {
  recipients: Recipient[];
  onChange: (next: Recipient[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function commit(raw: string) {
    const value = raw.trim().replace(/,$/, "");
    if (!value) return true;

    if (!isValidEmail(value)) {
      setError(`“${value}” isn’t a valid email address.`);
      return false;
    }
    if (recipients.some((r) => r.email.toLowerCase() === value.toLowerCase())) {
      setError(`${value} is already on the list.`);
      return false;
    }

    onChange([
      ...recipients,
      {
        id: `rcp-${value}-${recipients.length}`,
        email: value,
        initials: initialsFromEmail(value),
      },
    ]);
    setDraft("");
    setError(null);
    return true;
  }

  return (
    <div>
      <div
        className={cx(
          "min-h-[76px] w-full rounded-md border bg-white p-2 shadow-xs transition-colors",
          "focus-within:ring-2 focus-within:ring-violet-700/15",
          error
            ? "border-danger-strong focus-within:border-danger-strong"
            : "border-grey-200 focus-within:border-violet-700",
        )}
      >
        <div className="flex flex-wrap gap-1.5">
          {recipients.map((r) => (
            <span
              key={r.id}
              className="flex items-center gap-1 rounded-[4px] bg-violet-50 py-1 pr-1 pl-2 text-[12px] text-violet-800"
            >
              {r.email}
              <button
                type="button"
                onClick={() => onChange(recipients.filter((x) => x.id !== r.id))}
                aria-label={`Remove ${r.email}`}
                className="flex size-4 items-center justify-center rounded-[3px] text-violet-700 transition-colors hover:bg-violet-200"
              >
                <XIcon size={9} weight="bold" />
              </button>
            </span>
          ))}

          <input
            type="text"
            inputMode="email"
            value={draft}
            aria-label="Add recipient email"
            aria-invalid={!!error}
            placeholder={recipients.length ? "Add another…" : "Type email…"}
            onChange={(e) => {
              const v = e.target.value;
              if (v.endsWith(",")) commit(v);
              else {
                setDraft(v);
                if (error) setError(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit(draft);
              }
              if (e.key === "Backspace" && !draft && recipients.length) {
                onChange(recipients.slice(0, -1));
              }
            }}
            onBlur={() => commit(draft)}
            className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-[13px] text-grey-900 outline-none placeholder:text-grey-500"
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-1.5 text-[12px] text-danger-fg">
          {error}
        </p>
      ) : (
        <p className="mt-1.5 text-[12px] text-grey-500">
          Press Enter or comma to add. {recipients.length} recipient
          {recipients.length === 1 ? "" : "s"} so far.
        </p>
      )}
    </div>
  );
}
