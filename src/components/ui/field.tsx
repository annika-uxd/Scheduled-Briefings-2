"use client";

import { CaretDownIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cx } from "@/lib/format";

const FIELD_BASE =
  "w-full rounded-md border border-grey-200 bg-white text-[13px] text-grey-900 shadow-xs " +
  "transition-colors duration-100 placeholder:text-grey-500 " +
  "hover:border-grey-300 focus:border-violet-700 focus:outline-none " +
  "focus:ring-2 focus:ring-violet-700/15";

export function Label({
  children,
  htmlFor,
  hint,
}: {
  children: ReactNode;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px] font-medium text-grey-900"
    >
      <span>{children}</span>
      {hint ? <span className="text-[12px] font-normal text-grey-500">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(FIELD_BASE, "h-8 px-2.5", className)} {...rest} />;
}

export function Textarea({
  className,
  rows = 3,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cx(FIELD_BASE, "resize-none px-2.5 py-2 leading-[20px]", className)}
      {...rest}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cx(FIELD_BASE, "h-8 pr-8 pl-2.5", className)} {...rest}>
        {children}
      </select>
      <CaretDownIcon
        size={12}
        weight="bold"
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-grey-500"
      />
    </div>
  );
}

/**
 * The search field from the Figma page headers: input with an attached
 * icon button on the right.
 */
export function SearchField({
  value,
  onChange,
  placeholder = "Search...",
  className,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label: string;
}) {
  return (
    <div className={cx("flex h-[30px] w-full max-w-[356px] min-w-0", className)}>
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(
          "min-w-0 flex-1 rounded-l-md border border-r-0 border-grey-200 bg-white px-3",
          "text-[13px] text-grey-900 shadow-xs transition-colors duration-100",
          "placeholder:text-grey-500 hover:border-grey-300",
          "focus:border-violet-700 focus:outline-none",
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
      <span
        aria-hidden
        className={cx(
          "flex w-[33px] items-center justify-center rounded-r-md",
          "border border-grey-200 bg-white text-grey-600 shadow-xs",
        )}
      >
        <MagnifyingGlassIcon size={14} />
      </span>
    </div>
  );
}
