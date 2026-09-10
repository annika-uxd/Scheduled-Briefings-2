"use client";

import { LockSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { ContentBar, PageHeader } from "@/components/shell/page-header";
import { TemplateCard } from "@/components/template/template-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/field";
import { useStore } from "@/lib/store";

/** T1 — Templates Home. */
export default function TemplatesPage() {
  const router = useRouter();
  const { templates, duplicateTemplate, briefingCountFor, pushToast } = useStore();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) =>
      [t.name, t.description, t.category, ...t.sections.map((s) => s.title)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [templates, query]);

  const newTemplate = (
    <Button
      variant="primary"
      icon={<PlusIcon size={13} weight="bold" />}
      onClick={() => router.push("/templates/new")}
    >
      New template
    </Button>
  );

  return (
    <AppShell>
      <div className="scrollbar-thin h-full overflow-y-auto">
        <PageHeader
          title="Templates"
          description="Layouts built and maintained by the Handraise editorial team. Configure a briefing on top of one — the structure stays fixed, so every edition looks the same."
          action={newTemplate}
          search={
            templates.length ? (
              <SearchField
                label="Search templates"
                value={query}
                onChange={setQuery}
              />
            ) : undefined
          }
        />

        <div className="px-6 py-5 lg:px-9">
          <div className="mx-auto max-w-[1240px]">
            <ContentBar
              left={
                <span>
                  {visible.length} template{visible.length === 1 ? "" : "s"}
                  {query && visible.length !== templates.length
                    ? ` of ${templates.length}`
                    : ""}
                </span>
              }
              right={
                <span className="flex items-center gap-1.5">
                  <LockSimpleIcon size={12} />
                  Structure is admin-managed
                </span>
              }
            />

            {templates.length === 0 ? (
              <EmptyState
                title="No templates yet"
                description="Templates will appear here once they've been created."
                action={newTemplate}
              />
            ) : visible.length === 0 ? (
              <EmptyState
                title="No templates match"
                description={`Nothing matches “${query}”. Try a different search.`}
                action={<Button onClick={() => setQuery("")}>Clear search</Button>}
              />
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    briefingCount={briefingCountFor(template.id)}
                    onOpen={() => router.push(`/templates/${template.id}`)}
                    onViewDetails={() => router.push(`/templates/${template.id}`)}
                    onDuplicate={() => {
                      const copy = duplicateTemplate(template.id);
                      if (copy) {
                        pushToast({
                          tone: "success",
                          title: "Template duplicated",
                          description: `“${copy.name}” is ready to configure.`,
                        });
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
