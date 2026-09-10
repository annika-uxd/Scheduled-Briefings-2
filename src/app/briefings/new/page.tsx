"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { TemplateCard } from "@/components/template/template-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/field";
import { CreationShell } from "@/components/workflow/creation-shell";
import { useStore } from "@/lib/store";

/** B2 — Choose Template. Step one of the briefing creation workflow. */
export default function ChooseTemplatePage() {
  const router = useRouter();
  const { templates, briefingCountFor } = useStore();

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) =>
      [t.name, t.description, t.category].join(" ").toLowerCase().includes(q),
    );
  }, [templates, query]);

  const proceed = (templateId: string) =>
    router.push(`/briefings/new/${templateId}`);

  return (
    <CreationShell
      title="Choose template"
      onClose={() => router.push("/briefings")}
      steps={[
        { id: "choose", label: "Choose template", state: "current" },
        { id: "configure", label: "Configure", state: "upcoming" },
      ]}
      actions={
        <Button
          variant="primary"
          disabled={!selectedId}
          onClick={() => selectedId && proceed(selectedId)}
        >
          Continue
        </Button>
      }
    >
      <div className="scrollbar-thin h-full overflow-y-auto">
        <div className="border-b border-grey-200 bg-white px-6 py-6 lg:px-9">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-[20px] leading-6 font-medium text-grey-900">
                Choose template
              </h2>
              <p className="mt-2.5 max-w-[520px] text-[14px] leading-5 text-grey-700">
                Start from a template. The layout is fixed — you&rsquo;ll configure
                what each section says, who receives it and when.
              </p>
            </div>
            <SearchField
              label="Search templates"
              value={query}
              onChange={setQuery}
              className="lg:mt-1"
            />
          </div>
        </div>

        <div className="px-6 py-5 lg:px-9">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex items-center justify-between border-b border-grey-200 pb-2.5 text-[13px] text-grey-600">
              <span>
                {visible.length} template{visible.length === 1 ? "" : "s"}
              </span>
              {selectedId ? (
                <span className="text-violet-700">
                  {templates.find((t) => t.id === selectedId)?.name} selected
                </span>
              ) : null}
            </div>

            {visible.length === 0 ? (
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
                    selected={selectedId === template.id}
                    onOpen={() => {
                      // A second click on the selected card commits the choice,
                      // so the flow works with either one or two clicks.
                      if (selectedId === template.id) proceed(template.id);
                      else setSelectedId(template.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CreationShell>
  );
}
