"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { BriefingsTable } from "@/components/briefing/briefings-table";
import { AppShell } from "@/components/shell/app-shell";
import { ContentBar, PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/field";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { useStore } from "@/lib/store";
import type { Briefing, BriefingStatus } from "@/lib/types";

/** B1 — Briefings Home. The module's landing page. */
export default function BriefingsPage() {
  const router = useRouter();
  const { briefings, templates, deleteBriefing, pushToast } = useStore();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<BriefingStatus | "all">("all");
  const [pendingDelete, setPendingDelete] = useState<Briefing | null>(null);

  const templateName = (id: string) =>
    templates.find((t) => t.id === id)?.name ?? "";

  /** Text-only search across the fields visible in the table. */
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return briefings;
    return briefings.filter((b) =>
      [
        b.name,
        b.owner,
        templateName(b.templateId),
        b.schedule.day,
        b.schedule.frequency,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefings, query, templates]);

  const visible = useMemo(
    () => (filter === "all" ? searched : searched.filter((b) => b.status === filter)),
    [searched, filter],
  );

  const count = (status: BriefingStatus) =>
    searched.filter((b) => b.status === status).length;

  const tabs = [
    { id: "all", label: "All", count: searched.length },
    { id: "needs-review", label: "Needs review", count: count("needs-review") },
    { id: "active", label: "Active", count: count("active") },
    { id: "scheduled", label: "Scheduled", count: count("scheduled") },
    { id: "paused", label: "Paused", count: count("paused") },
  ];

  const hasTemplates = templates.length > 0;
  const totalOwners = new Set(briefings.map((b) => b.owner)).size;
  const usedTemplates = new Set(briefings.map((b) => b.templateId)).size;

  const description = briefings.length
    ? `${briefings.length} briefing${briefings.length === 1 ? "" : "s"} across ${usedTemplates} template${usedTemplates === 1 ? "" : "s"}, owned by ${totalOwners} ${totalOwners === 1 ? "person" : "people"}.`
    : hasTemplates
      ? "No briefings yet. Start from a template — the structure is fixed, you configure what it says."
      : "No briefings yet. A template has to exist before a briefing can be built on it.";

  const newBriefing = (
    <Button
      variant="primary"
      icon={<PlusIcon size={13} weight="bold" />}
      onClick={() => router.push("/briefings/new")}
    >
      New briefing
    </Button>
  );

  return (
    <AppShell>
      <div className="scrollbar-thin h-full overflow-y-auto">
        <PageHeader
          title="Briefings"
          description={description}
          action={hasTemplates ? newBriefing : undefined}
          search={
            briefings.length ? (
              <SearchField
                label="Search briefings"
                value={query}
                onChange={setQuery}
              />
            ) : undefined
          }
        />

        <div className="px-6 py-5 lg:px-9">
          <div className="mx-auto max-w-[1240px]">
            {briefings.length ? (
              <div className="mb-5">
                <FilterTabs
                  label="Filter briefings by status"
                  tabs={tabs}
                  value={filter}
                  onChange={(id) => setFilter(id as BriefingStatus | "all")}
                />
              </div>
            ) : null}

            {briefings.length === 0 ? (
              <div className="rounded-rounded border border-grey-200 bg-white">
                <EmptyState
                  title={
                    hasTemplates ? "No briefings to show" : "No briefings yet"
                  }
                  description={
                    hasTemplates
                      ? "Briefings will appear here once they've been created."
                      : "Templates are built by the Handraise editorial team. Once one exists, you can configure a briefing on top of it."
                  }
                  action={hasTemplates ? newBriefing : undefined}
                />
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-rounded border border-grey-200 bg-white">
                <EmptyState
                  title="No briefings match"
                  description={
                    query
                      ? `Nothing matches “${query}”${filter !== "all" ? " in this status" : ""}. Try a different search.`
                      : "No briefings currently have this status."
                  }
                  action={
                    <Button
                      onClick={() => {
                        setQuery("");
                        setFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <BriefingsTable
                  briefings={visible}
                  templates={templates}
                  onDelete={setPendingDelete}
                />
                <ContentBar
                  className="mt-4 border-t border-b-0 pt-2.5 pb-0"
                  left={
                    <span>
                      Showing {visible.length} of {briefings.length} briefing
                      {briefings.length === 1 ? "" : "s"}
                    </span>
                  }
                />
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this briefing?"
        description={
          <>
            <strong className="font-medium text-grey-900">
              {pendingDelete?.name}
            </strong>{" "}
            and its generated editions will be removed. The template it was built
            on is not affected.
          </>
        }
        confirmLabel="Delete briefing"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteBriefing(pendingDelete.id);
          pushToast({
            tone: "success",
            title: "Briefing deleted",
            description: `“${pendingDelete.name}” has been removed.`,
          });
          setPendingDelete(null);
        }}
      />
    </AppShell>
  );
}
