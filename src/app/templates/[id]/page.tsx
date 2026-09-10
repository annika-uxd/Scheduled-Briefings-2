"use client";

import { ArrowLeftIcon, LockSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { use, useMemo } from "react";

import { BriefingDocument } from "@/components/briefing/briefing-document";
import { AppShell } from "@/components/shell/app-shell";
import { StructureList } from "@/components/template/structure-list";
import { Button } from "@/components/ui/button";
import { buildEdition } from "@/lib/data/editions";
import { useStore } from "@/lib/store";

/** T2 — Template Detail. Structure and preview; no structural editing. */
export default function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { getTemplate, briefingCountFor } = useStore();

  const template = getTemplate(id);
  if (!template) notFound();

  // A sample edition so the preview shows the template's real output shape.
  const sample = useMemo(
    () =>
      buildEdition(`sample-${template.id}`, template.id, {
        dateLabel: "Sample edition",
        windowLabel: "Sample data — live editions use your briefing's instructions",
      }),
    [template.id],
  );

  const usedBy = briefingCountFor(template.id);

  return (
    <AppShell>
      <div className="scrollbar-thin h-full overflow-y-auto">
        <header className="border-b border-grey-200 bg-white px-6 py-5 lg:px-9">
          <div className="mx-auto max-w-[1240px]">
            <Link
              href="/templates"
              className="inline-flex items-center gap-1.5 text-[13px] text-grey-600 transition-colors hover:text-violet-700"
            >
              <ArrowLeftIcon size={13} />
              All templates
            </Link>

            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-[20px] leading-6 font-medium text-grey-900">
                    {template.name}
                  </h1>
                  <span className="rounded-full bg-grey-100 px-2 py-0.5 text-[12px] font-medium text-grey-600">
                    {template.category}
                  </span>
                </div>

                <p className="mt-2.5 max-w-[640px] text-[14px] leading-5 text-grey-700">
                  {template.description}
                </p>

                <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-grey-500">
                  <span>Created by {template.createdBy}</span>
                  <span aria-hidden className="size-1 rounded-full bg-grey-300" />
                  <span>Updated {template.updatedAt}</span>
                  <span aria-hidden className="size-1 rounded-full bg-grey-300" />
                  <span>
                    {template.sections.length} sections · {template.blocks.length}{" "}
                    components
                  </span>
                  <span aria-hidden className="size-1 rounded-full bg-grey-300" />
                  <span>
                    {usedBy} briefing{usedBy === 1 ? "" : "s"} in use
                  </span>
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-2.5 lg:items-end">
                <Button
                  variant="primary"
                  icon={<PlusIcon size={13} weight="bold" />}
                  onClick={() => router.push(`/briefings/new/${template.id}`)}
                >
                  Create briefing from this template
                </Button>
                <span className="flex items-center gap-1.5 text-[12px] text-grey-500">
                  <LockSimpleIcon size={12} />
                  Structure is admin-managed
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 lg:px-9">
          <div className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[minmax(300px,400px)_minmax(0,1fr)]">
            <section>
              <h2 className="label-caps">Structure</h2>
              <p className="mt-2 mb-3 text-[12px] leading-[18px] text-grey-600">
                The blocks this template renders, in order. Briefings configure what
                each section says — not which blocks exist or where they sit.
              </p>
              <StructureList
                blocks={template.blocks}
                sections={template.sections}
              />

              <h3 className="label-caps mt-7">Sections you&rsquo;ll configure</h3>
              <ul className="mt-2.5 flex flex-col gap-2.5">
                {template.sections.map((s, i) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-grey-200 bg-white px-3.5 py-3"
                  >
                    <p className="flex items-baseline gap-2 text-[13px] font-medium text-grey-900">
                      <span className="text-[12px] text-grey-400 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {s.title}
                    </p>
                    <p className="mt-1 text-[12px] leading-[18px] text-grey-600">
                      {s.intent}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="min-w-0">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="label-caps">Preview</h2>
                <p className="text-[12px] text-grey-500">
                  Sample data — live editions use your briefing&rsquo;s instructions
                </p>
              </div>
              <BriefingDocument
                edition={sample}
                title={template.name}
                className="max-w-[760px]"
              />
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
