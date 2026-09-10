"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cx } from "@/lib/format";
import type { Article } from "@/lib/types";

/**
 * Picks an article from the coverage Herald read but did not select. Framed as
 * "what Herald left out" rather than a generic article browser, because that is
 * what it actually is.
 */
export function AddArticleDialog({
  open,
  candidates,
  sectionTitle,
  onClose,
  onAdd,
}: {
  open: boolean;
  candidates: Article[];
  sectionTitle: string;
  onClose: () => void;
  onAdd: (article: Article) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedId(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((a) =>
      [a.headline, a.publication, a.topic, a.summary]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [candidates, query]);

  if (!open) return null;

  const selected = candidates.find((a) => a.id === selectedId);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grey-900/20" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-article-title"
        className="animate-rise relative flex max-h-[min(640px,calc(100dvh-32px))] w-full max-w-[640px] flex-col overflow-hidden rounded-lg border border-grey-200 bg-white shadow-overlay"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-grey-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id="add-article-title" className="text-[15px] font-medium text-grey-900">
              Add an article to {sectionTitle}
            </h2>
            <p className="mt-1 text-[13px] text-grey-600">
              Coverage Herald read in this lookback window but did not select.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-m-1 shrink-0 rounded p-1 text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
          >
            <XIcon size={14} />
          </button>
        </header>

        <div className="shrink-0 border-b border-grey-200 px-5 py-3">
          <div className="relative">
            <MagnifyingGlassIcon
              size={14}
              className="absolute top-1/2 left-2.5 -translate-y-1/2 text-grey-500"
            />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by headline, outlet or topic…"
              aria-label="Filter available articles"
              className="h-8 w-full rounded-md border border-grey-200 bg-white pr-2.5 pl-8 text-[13px] text-grey-900 shadow-xs outline-none placeholder:text-grey-500 focus:border-violet-700 focus:ring-2 focus:ring-violet-700/15"
            />
          </div>
        </div>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-grey-500">
              {candidates.length === 0
                ? "Every article from this window is already in the edition."
                : `Nothing matches “${query}”.`}
            </p>
          ) : (
            <ul>
              {visible.map((article) => {
                const isSelected = article.id === selectedId;
                return (
                  <li key={article.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(article.id)}
                      onDoubleClick={() => onAdd(article)}
                      aria-pressed={isSelected}
                      className={cx(
                        "block w-full border-b border-grey-200 px-5 py-3 text-left transition-colors",
                        isSelected ? "bg-violet-50" : "hover:bg-grey-50",
                      )}
                    >
                      <p className="text-[13px] leading-[19px] font-medium text-grey-900">
                        {article.headline}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-grey-500">
                        <span className="rounded-[3px] bg-slate-surface px-1.5 py-0.5 font-medium tracking-[0.04em] text-grey-700 uppercase">
                          {article.publication}
                        </span>
                        <span>{article.date}</span>
                        <span aria-hidden className="size-1 rounded-full bg-grey-300" />
                        <span>{article.reach} reach</span>
                        <span aria-hidden className="size-1 rounded-full bg-grey-300" />
                        <span>{article.topic}</span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[19px] text-grey-600">
                        {article.summary}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-grey-200 px-5 py-3">
          <p className="min-w-0 truncate text-[12px] text-grey-500">
            {selected ? `Selected: ${selected.publication}` : "Select an article to add"}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!selected}
              onClick={() => selected && onAdd(selected)}
            >
              Add article
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
