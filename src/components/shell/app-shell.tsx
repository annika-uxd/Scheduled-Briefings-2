"use client";

import {
  BellIcon,
  CaretDownIcon,
  ChartBarIcon,
  ChatsCircleIcon,
  CompassIcon,
  GearIcon,
  MegaphoneIcon,
  ScrollIcon,
  SidebarSimpleIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cx } from "@/lib/format";

/**
 * The Handraise application chrome: a 56px icon rail, a 50px top bar carrying
 * the module name and its tabs, and the module surface beneath.
 *
 * Only Scheduled Briefings is implemented — the other rail destinations stand
 * in for the wider application and are inert by design.
 */

const RAIL_ITEMS = [
  { id: "conversations", label: "Conversations", Icon: ChatsCircleIcon },
  { id: "discover", label: "Discover", Icon: CompassIcon },
  { id: "analytics", label: "Analytics", Icon: ChartBarIcon },
  { id: "campaigns", label: "Campaigns", Icon: MegaphoneIcon },
  { id: "alerts", label: "Alerts", Icon: BellIcon },
] as const;

function LeftRail() {
  return (
    <nav
      aria-label="Handraise"
      className="hidden w-14 shrink-0 flex-col items-center border-r border-grey-200 bg-white py-4 sm:flex"
    >
      <span
        aria-label="Handraise"
        className="font-serif text-[19px] leading-none font-semibold text-grey-900"
      >
        H
      </span>

      <div className="mt-4 h-px w-9 bg-grey-200" />

      <div className="mt-5 flex flex-1 flex-col items-center gap-1.5">
        {RAIL_ITEMS.map(({ id, label, Icon }) => (
          <span
            key={id}
            title={`${label} — not part of this prototype`}
            aria-disabled="true"
            className="flex size-8 items-center justify-center rounded-md text-grey-500"
          >
            <Icon size={16} />
          </span>
        ))}

        {/* Scheduled Briefings — the active module. */}
        <span className="relative flex size-8 items-center justify-center rounded-md text-violet-700">
          <span className="absolute -left-3 h-6 w-0.5 rounded-r-full bg-violet-700" />
          <ScrollIcon size={16} weight="regular" />
        </span>
      </div>

      <div className="h-px w-9 bg-grey-200" />
      <span
        title="Settings — not part of this prototype"
        aria-disabled="true"
        className="mt-3 flex size-8 items-center justify-center text-grey-500"
      >
        <GearIcon size={16} />
      </span>
      <span
        title="Collapse — not part of this prototype"
        aria-disabled="true"
        className="mt-1 flex size-8 items-center justify-center text-grey-500"
      >
        <SidebarSimpleIcon size={16} />
      </span>
    </nav>
  );
}

const TABS = [
  { href: "/briefings", label: "Briefings" },
  { href: "/templates", label: "Templates" },
] as const;

function TopNav() {
  const pathname = usePathname();

  return (
    <header className="flex h-[50px] shrink-0 items-center gap-4 border-b border-grey-200 bg-white pr-3 pl-4 sm:pl-[18px]">
      <Link
        href="/briefings"
        className="shrink-0 text-[14px] font-medium text-violet-950 hover:text-violet-800"
      >
        Scheduled Briefs
      </Link>

      <span aria-hidden className="hidden h-[35px] w-px bg-grey-200 sm:block" />

      <nav aria-label="Scheduled Briefings sections" className="flex min-w-0 flex-1">
        <ul className="flex items-center gap-6 sm:ml-16 md:ml-24">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "relative flex h-[50px] items-center text-[13px] transition-colors",
                    active
                      ? "font-medium text-grey-900"
                      : "text-grey-700 hover:text-grey-900",
                  )}
                >
                  {tab.label}
                  {active ? (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-violet-700" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex shrink-0 items-center gap-1.5">
        <span className="flex size-5 items-center justify-center rounded-full bg-violet-700 text-[10px] font-semibold text-white">
          A
        </span>
        <span className="hidden text-[12px] text-grey-900 sm:inline">Pfizer</span>
        <CaretDownIcon size={12} className="text-grey-600" />
      </div>
    </header>
  );
}

/** Standard module layout: rail + top nav + scrollable module surface. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-grey-50">
      <LeftRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
