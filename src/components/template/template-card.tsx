"use client";

import {
  CaretRightIcon,
  CheckIcon,
  CopySimpleIcon,
  DotsThreeIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react";

import { TemplateThumbnail } from "@/components/template/template-thumbnail";
import { Menu } from "@/components/ui/menu";
import { cx } from "@/lib/format";
import type { Template } from "@/lib/types";

/**
 * Template card. Used in both Templates Home and the Choose Template step —
 * `selected` and the overflow menu are what differ between them.
 */
export function TemplateCard({
  template,
  briefingCount,
  onOpen,
  onDuplicate,
  onViewDetails,
  selected,
}: {
  template: Template;
  /** Live count of briefings running on this template. */
  briefingCount: number;
  onOpen: () => void;
  onDuplicate?: () => void;
  onViewDetails?: () => void;
  selected?: boolean;
}) {
  const hasMenu = !!onDuplicate || !!onViewDetails;

  return (
    <div
      className={cx(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-white text-left",
        "transition-[border-color,box-shadow] duration-150",
        selected
          ? "border-violet-700 ring-1 ring-violet-700"
          : "border-grey-200 hover:border-grey-300 hover:shadow-xs",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        // Only a selectable card is a toggle; on Templates Home it navigates.
        aria-pressed={selected === undefined ? undefined : selected}
        data-template-card={template.id}
        className="flex flex-1 cursor-pointer flex-col text-left"
      >
        <TemplateThumbnail template={template} className="h-[188px]" />

        <div className="flex flex-1 flex-col px-4 pt-4 pb-3">
          <div className="flex items-start gap-2">
            <h3 className="flex-1 text-[14px] leading-[20px] font-medium text-grey-900">
              {template.name}
            </h3>
            {selected ? (
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-violet-700 text-white">
                <CheckIcon size={10} weight="bold" />
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-[19px] text-grey-600">
            {template.description}
          </p>

          <div className="mt-3.5 flex items-center gap-2 border-t border-grey-200 pt-2.5 text-[12px] text-grey-500">
            <span className="whitespace-nowrap">
              {template.sections.length} sections
            </span>
            <span aria-hidden className="size-1 rounded-full bg-grey-300" />
            <span className="whitespace-nowrap">
              {briefingCount} briefing{briefingCount === 1 ? "" : "s"}
            </span>
            <span className="ml-auto flex items-center gap-1 truncate">
              <span className="truncate">Updated {template.updatedAt}</span>
              <CaretRightIcon
                size={11}
                className="shrink-0 text-grey-400 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </div>
      </button>

      {hasMenu ? (
        <div className="absolute top-2.5 right-2.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Menu
            label={`Actions for ${template.name}`}
            items={[
              ...(onDuplicate
                ? [
                    {
                      id: "duplicate",
                      label: "Duplicate template",
                      icon: <CopySimpleIcon size={14} />,
                      onSelect: onDuplicate,
                    },
                  ]
                : []),
              ...(onViewDetails
                ? [
                    {
                      id: "details",
                      label: "View template details",
                      icon: <ArrowSquareOutIcon size={14} />,
                      onSelect: onViewDetails,
                    },
                  ]
                : []),
            ]}
            trigger={({ toggle, ref, open, ...aria }) => (
              <button
                ref={ref}
                type="button"
                onClick={toggle}
                aria-label={`Actions for ${template.name}`}
                {...aria}
                className={cx(
                  "flex size-7 items-center justify-center rounded-md border border-grey-200",
                  "bg-white text-grey-600 shadow-xs transition-colors",
                  "hover:bg-grey-50 hover:text-grey-900",
                  open && "bg-grey-50 text-grey-900",
                )}
              >
                <DotsThreeIcon size={16} weight="bold" />
              </button>
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
