"use client";

import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  MinusIcon,
  WarningCircleIcon,
  TrendUpIcon,
  NoteIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { cx } from "@/lib/format";
import type { ChartPoint, Metric, TableRow } from "@/lib/types";

/**
 * Presentational blocks that make up a generated briefing. These render the
 * intelligence product itself, so the typography is document typography — a
 * serif display face, generous measure, and a hierarchy that survives being
 * read at 7am on a phone.
 */

/* -------------------------------------------------------------------------- */
/* Banner                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The client brand banner. The Figma frame uses an exported Pfizer lockup;
 * this renders the same gradient band with a typographic wordmark instead, so
 * the prototype does not ship a third party's logo asset.
 */
export function BannerBlock({
  title,
  subtitle,
  compact,
}: {
  title: string;
  subtitle: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cx(
        "flex items-center justify-between gap-4 bg-linear-100",
        "from-[#2c3f8f] via-[#1462b8] to-[#00a3e0]",
        compact ? "px-4 py-4" : "px-8 py-7 sm:px-10",
      )}
    >
      <div className="min-w-0">
        <p
          className={cx(
            "font-serif leading-none font-semibold tracking-tight text-white italic",
            compact ? "text-[15px]" : "text-[28px]",
          )}
        >
          Pfizer
        </p>
        <p
          className={cx(
            "mt-1.5 truncate font-medium tracking-[0.08em] text-white/75 uppercase",
            compact ? "text-[7px]" : "text-[10px]",
          )}
        >
          {subtitle}
        </p>
      </div>
      {!compact ? (
        <p className="hidden max-w-[45%] truncate text-right text-[11px] font-medium tracking-[0.04em] text-white/70 uppercase sm:block">
          {title}
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Contents                                                                    */
/* -------------------------------------------------------------------------- */

export function ContentsBlock({
  entries,
  onJump,
}: {
  entries: { id: string; title: string }[];
  onJump?: (sectionId: string) => void;
}) {
  return (
    <nav aria-label="Contents">
      <p className="label-caps">Contents</p>
      <ol className="mt-2.5">
        {entries.map((entry, i) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onJump?.(entry.id)}
              disabled={!onJump}
              className={cx(
                "group flex w-full items-baseline gap-3 py-1.5 text-left",
                onJump && "cursor-pointer",
              )}
            >
              <span className="w-5 shrink-0 text-[12px] text-grey-400 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={cx(
                  "shrink-0 text-[13px] text-grey-900",
                  onJump && "group-hover:text-violet-700",
                )}
              >
                {entry.title}
              </span>
              <span className="mt-[-3px] h-px min-w-4 flex-1 self-center bg-grey-200" />
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Section title                                                               */
/* -------------------------------------------------------------------------- */

export function SectionTitleBlock({
  title,
  index,
}: {
  title: string;
  index: number;
}) {
  return (
    <div className="flex items-baseline gap-3 border-b border-grey-200 pb-2">
      <span className="text-[12px] text-grey-400 tabular-nums">
        {String(index).padStart(2, "0")}
      </span>
      <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-grey-900">
        {title}
      </h2>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Metrics                                                                     */
/* -------------------------------------------------------------------------- */

export function MetricsBlock({ metrics }: { metrics: Metric[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
      {metrics.map((m) => {
        // A rising number is not automatically good news — negative mentions
        // going up is bad. `positiveIsGood` carries that judgement.
        const good =
          m.direction === "flat"
            ? null
            : (m.direction === "up") === m.positiveIsGood;
        const Icon =
          m.direction === "up"
            ? ArrowUpRightIcon
            : m.direction === "down"
              ? ArrowDownRightIcon
              : MinusIcon;

        return (
          <div key={m.id}>
            <dt className="text-[11px] leading-4 font-medium tracking-[0.04em] text-grey-600 uppercase">
              {m.label}
            </dt>
            <dd className="mt-1.5 flex items-baseline gap-2">
              <span className="font-serif text-[26px] leading-none text-grey-900 tabular-nums">
                {m.value}
              </span>
              <span
                className={cx(
                  "inline-flex items-center gap-0.5 text-[12px] font-medium tabular-nums",
                  good === null
                    ? "text-grey-500"
                    : good
                      ? "text-success-fg"
                      : "text-warning-fg",
                )}
              >
                <Icon size={11} weight="bold" />
                {m.delta}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/* -------------------------------------------------------------------------- */
/* Charts                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Charts are drawn as inline SVG rather than pulled from a charting library —
 * the shapes needed here are simple, and it keeps the dependency list honest.
 */

export function BarChartBlock({
  title,
  points,
}: {
  title: string;
  points: ChartPoint[];
}) {
  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <figure>
      <figcaption className="label-caps">{title}</figcaption>
      <div className="mt-3 flex h-[132px] items-end gap-2">
        {points.map((p) => {
          const total = Math.round((p.value / max) * 100);
          const negative = p.negative
            ? Math.round((p.negative / max) * 100)
            : 0;
          return (
            <div key={p.label} className="flex min-w-0 flex-1 flex-col justify-end">
              <div
                className="relative w-full overflow-hidden rounded-[3px] bg-violet-200"
                style={{ height: `${total}%` }}
                title={`${p.label}: ${p.value} placements`}
              >
                {negative > 0 ? (
                  <span
                    className="absolute inset-x-0 bottom-0 bg-violet-700"
                    style={{ height: `${(negative / total) * 100}%` }}
                  />
                ) : null}
              </div>
              <span className="mt-2 truncate text-center text-[10px] text-grey-500">
                {p.label}
              </span>
            </div>
          );
        })}
      </div>
      <ChartLegend
        items={[
          { color: "bg-violet-200", label: "Total coverage" },
          { color: "bg-violet-700", label: "Negative" },
        ]}
      />
    </figure>
  );
}

export function LineChartBlock({
  title,
  points,
}: {
  title: string;
  points: ChartPoint[];
}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const w = 100;
  const h = 40;
  const step = points.length > 1 ? w / (points.length - 1) : w;

  const coords = points.map((p, i) => ({
    x: i * step,
    y: h - (p.value / max) * (h - 4) - 2,
  }));
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;

  return (
    <figure>
      <figcaption className="label-caps">{title}</figcaption>
      <div className="mt-3">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="h-[124px] w-full"
          role="img"
          aria-label={`${title}. Values from ${points[0]?.label} to ${points[points.length - 1]?.label}.`}
        >
          <polygon points={area} className="fill-violet-100" />
          <polyline
            points={line}
            fill="none"
            className="stroke-violet-700"
            strokeWidth="1"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {coords.map((c, i) => (
            <circle
              key={points[i].label}
              cx={c.x}
              cy={c.y}
              r="1"
              className="fill-white stroke-violet-700"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <div className="mt-2 flex justify-between">
          {points.map((p) => (
            <span key={p.label} className="text-[10px] text-grey-500">
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}

const PIE_COLOURS = [
  "var(--color-violet-700)",
  "var(--color-violet-200)",
  "#8fb3e0",
  "#c8d4e4",
  "var(--color-grey-200)",
];

export function PieChartBlock({
  title,
  points,
}: {
  title: string;
  points: ChartPoint[];
}) {
  const total = points.reduce((sum, p) => sum + p.value, 0) || 1;

  // Donut drawn with stroke-dasharray on concentric circles.
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <figure>
      <figcaption className="label-caps">{title}</figcaption>
      <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-4">
        <svg viewBox="0 0 42 42" className="size-[116px] shrink-0 -rotate-90">
          {points.map((p, i) => {
            const fraction = p.value / total;
            const dash = fraction * circumference;
            const el = (
              <circle
                key={p.label}
                cx="21"
                cy="21"
                r={radius}
                fill="transparent"
                stroke={PIE_COLOURS[i % PIE_COLOURS.length]}
                strokeWidth="7"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              >
                <title>{`${p.label}: ${p.value}%`}</title>
              </circle>
            );
            offset += dash;
            return el;
          })}
        </svg>

        <dl className="grid min-w-[180px] flex-1 gap-1.5">
          {points.map((p, i) => (
            <div key={p.label} className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-[2px]"
                style={{ background: PIE_COLOURS[i % PIE_COLOURS.length] }}
              />
              <dt className="flex-1 truncate text-[12px] text-grey-700">{p.label}</dt>
              <dd className="text-[12px] font-medium text-grey-900 tabular-nums">
                {p.value}%
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </figure>
  );
}

function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-grey-600">
          <span className={cx("size-2 rounded-[2px]", item.color)} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Table                                                                       */
/* -------------------------------------------------------------------------- */

export function TableBlock({
  columns,
  rows,
}: {
  columns: string[];
  rows: TableRow[];
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[420px] border-collapse text-left">
        <thead>
          <tr className="border-b border-grey-200">
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="pb-2 text-[11px] font-medium tracking-[0.04em] text-grey-600 uppercase"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-grey-100 last:border-0">
              {row.cells.map((cell, j) => (
                <td
                  key={j}
                  className={cx(
                    "py-2.5 pr-4 text-[13px] last:pr-0",
                    j === 0 ? "font-medium text-grey-900" : "text-grey-700",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Callout & quote                                                             */
/* -------------------------------------------------------------------------- */

const CALLOUT_TONE = {
  risk: {
    wrap: "border-warning-fg/20 bg-warning-surface",
    icon: "text-warning-fg",
    Icon: WarningCircleIcon,
  },
  opportunity: {
    wrap: "border-success-fg/20 bg-success-surface",
    icon: "text-success-fg",
    Icon: TrendUpIcon,
  },
  note: {
    wrap: "border-grey-200 bg-grey-50",
    icon: "text-grey-600",
    Icon: NoteIcon,
  },
} as const;

export function CalloutBlock({
  tone,
  title,
  children,
}: {
  tone: "risk" | "opportunity" | "note";
  title: string;
  children: ReactNode;
}) {
  const t = CALLOUT_TONE[tone];
  return (
    <aside className={cx("flex gap-3 rounded-lg border px-4 py-3.5", t.wrap)}>
      <t.Icon size={16} weight="fill" className={cx("mt-px shrink-0", t.icon)} />
      <div className="min-w-0">
        <p className="text-[12px] font-semibold tracking-[0.02em] text-grey-900 uppercase">
          {title}
        </p>
        <div className="mt-1 text-[13px] leading-[20px] text-grey-700">{children}</div>
      </div>
    </aside>
  );
}

export function QuoteBlock({
  attribution,
  children,
}: {
  attribution: string;
  children: ReactNode;
}) {
  return (
    <blockquote className="border-l-2 border-violet-700 pl-4">
      <div className="font-serif text-[16px] leading-[26px] text-grey-800">
        {children}
      </div>
      <footer className="mt-2 text-[12px] text-grey-500">— {attribution}</footer>
    </blockquote>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                      */
/* -------------------------------------------------------------------------- */

export function FooterBlock({ children }: { children: ReactNode }) {
  return (
    <footer className="border-t border-grey-200 pt-4 text-[11px] leading-[18px] text-grey-500">
      {children}
    </footer>
  );
}
