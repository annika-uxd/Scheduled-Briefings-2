"use client";

import { useMemo } from "react";

import { BriefingDocument } from "@/components/briefing/briefing-document";
import { buildEdition } from "@/lib/data/editions";
import type { Template } from "@/lib/types";

/**
 * Renders a template as the document it will produce, using sample data.
 *
 * Herald's template creation preview shows real output rather than wireframe
 * boxes — the point of describing a report in words is seeing the report.
 */
export function TemplatePreview({
  template,
  className,
}: {
  template: Template;
  className?: string;
}) {
  // Re-derived whenever the structure changes, so refinements land immediately.
  const structureKey = useMemo(
    () => template.blocks.map((b) => `${b.kind}:${b.sectionId ?? ""}`).join("|"),
    [template.blocks],
  );

  const edition = useMemo(
    () =>
      buildEdition(`preview-${template.id}`, template.id, {
        dateLabel: "Sample edition",
        windowLabel: "Sample data — live editions use each briefing's instructions",
        template,
      }),
    // structureKey re-derives the preview whenever Herald changes the layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [structureKey, template.id, template.name],
  );

  return (
    <BriefingDocument
      edition={edition}
      title={template.name}
      className={className}
    />
  );
}
