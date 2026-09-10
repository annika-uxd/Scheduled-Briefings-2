"use client";

import {
  ArrowSquareOutIcon,
  DotsThreeIcon,
  EyeIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { AvatarStack } from "@/components/ui/avatar-stack";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { cx, scheduleParts } from "@/lib/format";
import type { Briefing, Template } from "@/lib/types";

/**
 * The briefings list.
 *
 * Rows carry a status-tinted left edge so a scan down the first column tells
 * you what needs attention before you read anything. Below `lg` the seven
 * columns stop fitting honestly, so the same data renders as stacked cards
 * rather than a table the user has to scroll sideways.
 */

const ACCENT: Record<Briefing["status"], string> = {
  "needs-review": "bg-warning-fg",
  active: "bg-success-fg",
  scheduled: "bg-grey-300",
  paused: "bg-grey-300",
};

const COLUMNS = [
  { id: "title", label: "Title", className: "w-[22%]" },
  { id: "schedule", label: "Schedule", className: "w-[16%]" },
  { id: "recipients", label: "Recipients", className: "w-[12%]" },
  { id: "status", label: "Status", className: "w-[13%]" },
  { id: "generated", label: "Last generated", className: "w-[15%]" },
  { id: "template", label: "Template", className: "w-[16%]" },
  { id: "owner", label: "Owner", className: "w-[9%]" },
];

export function BriefingsTable({
  briefings,
  templates,
  onDelete,
}: {
  briefings: Briefing[];
  templates: Template[];
  onDelete: (briefing: Briefing) => void;
}) {
  const router = useRouter();

  const templateName = (id: string) =>
    templates.find((t) => t.id === id)?.name ?? "Unknown template";

  const menuItems = (briefing: Briefing): MenuItem[] => [
    {
      id: "view",
      label: "View briefing",
      icon: <EyeIcon size={14} />,
      onSelect: () => router.push(`/briefings/${briefing.id}`),
    },
    {
      id: "template",
      label: "View template",
      icon: <ArrowSquareOutIcon size={14} />,
      onSelect: () => router.push(`/templates/${briefing.templateId}`),
    },
    {
      id: "delete",
      label: "Delete briefing",
      icon: <TrashIcon size={14} />,
      onSelect: () => onDelete(briefing),
      tone: "danger",
      separated: true,
    },
  ];

  return (
    <>
      {/* Table — lg and up */}
      <div className="hidden overflow-hidden rounded-rounded border border-grey-200 bg-white lg:block">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-grey-200">
              {COLUMNS.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={cx(
                    "px-4 py-2.5 text-[11px] font-medium tracking-[0.06em] text-grey-600 uppercase",
                    "first:pl-6",
                    col.className,
                  )}
                >
                  {col.label}
                </th>
              ))}
              <th scope="col" className="w-[52px] px-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {briefings.map((briefing) => {
              const { day, time } = scheduleParts(briefing.schedule);
              const open = () => router.push(`/briefings/${briefing.id}`);

              return (
                <tr
                  key={briefing.id}
                  onClick={open}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      open();
                    }
                  }}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open ${briefing.name}`}
                  className={cx(
                    "group cursor-pointer border-b border-grey-200 last:border-0",
                    "transition-colors hover:bg-grey-50 focus-visible:bg-grey-50",
                  )}
                >
                  <td className="relative py-3 pr-4 pl-6">
                    <span
                      aria-hidden
                      className={cx(
                        "absolute inset-y-0 left-0 w-[3px]",
                        ACCENT[briefing.status],
                      )}
                    />
                    <span className="block text-[13px] leading-[18px] font-medium text-balance text-grey-900">
                      {briefing.name}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 text-[13px] text-grey-900">
                      <span className="truncate">{day}</span>
                      <span aria-hidden className="size-1 shrink-0 rounded-full bg-grey-300" />
                      <span className="truncate">{time}</span>
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <AvatarStack recipients={briefing.recipients} />
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={briefing.status} />
                  </td>

                  <td className="px-4 py-3 text-[13px] text-grey-700">
                    {briefing.lastGenerated ?? (
                      <span className="text-grey-500">Not yet run</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className="block truncate text-[13px] text-grey-700">
                      {templateName(briefing.templateId)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-[13px] text-grey-700">
                    <span className="block truncate">{briefing.owner}</span>
                  </td>

                  <td
                    className="px-2 py-3"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <Menu
                        label={`Actions for ${briefing.name}`}
                        items={menuItems(briefing)}
                        trigger={(props) => <RowTrigger {...props} name={briefing.name} />}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards — below lg */}
      <ul className="flex flex-col gap-2.5 lg:hidden">
        {briefings.map((briefing) => {
          const { day, time } = scheduleParts(briefing.schedule);
          const open = () => router.push(`/briefings/${briefing.id}`);

          return (
            <li key={briefing.id} className="relative">
              <button
                type="button"
                onClick={open}
                className={cx(
                  "relative block w-full overflow-hidden rounded-lg border border-grey-200",
                  "bg-white py-3.5 pr-12 pl-5 text-left transition-colors hover:bg-grey-50",
                )}
              >
                <span
                  aria-hidden
                  className={cx(
                    "absolute inset-y-0 left-0 w-[3px]",
                    ACCENT[briefing.status],
                  )}
                />
                <span className="block text-[14px] leading-[20px] font-medium text-grey-900">
                  {briefing.name}
                </span>

                <span className="mt-2 flex items-center gap-2 text-[12.5px] text-grey-600">
                  <span>{day}</span>
                  <span aria-hidden className="size-1 shrink-0 rounded-full bg-grey-300" />
                  <span>{time}</span>
                </span>
                <span className="mt-1 block truncate text-[12.5px] text-grey-600">
                  {templateName(briefing.templateId)}
                </span>

                <span className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge status={briefing.status} />
                  <AvatarStack recipients={briefing.recipients} max={4} />
                </span>

                <span className="mt-2.5 block text-[12px] text-grey-500">
                  {briefing.lastGenerated
                    ? `Last generated ${briefing.lastGenerated}`
                    : "Not yet run"}{" "}
                  · {briefing.owner}
                </span>
              </button>

              <div className="absolute top-3 right-3">
                <Menu
                  label={`Actions for ${briefing.name}`}
                  items={menuItems(briefing)}
                  trigger={(props) => <RowTrigger {...props} name={briefing.name} />}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function RowTrigger({
  toggle,
  ref,
  open,
  name,
  ...aria
}: {
  toggle: () => void;
  ref: React.Ref<HTMLButtonElement>;
  open: boolean;
  name: string;
} & Record<string, unknown>) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      aria-label={`Actions for ${name}`}
      {...(aria as Record<string, string | boolean>)}
      className={cx(
        "flex size-7 items-center justify-center rounded-md text-grey-600",
        "transition-colors hover:bg-grey-200/60 hover:text-grey-900",
        open && "bg-grey-200/60 text-grey-900",
      )}
    >
      <DotsThreeIcon size={16} weight="bold" />
    </button>
  );
}

