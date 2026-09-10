"use client";

import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Leading icon, sized by the caller (14–16px). */
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-violet-700 text-white shadow-xs hover:bg-violet-800 active:bg-violet-800 disabled:bg-grey-300 disabled:text-grey-0 disabled:shadow-none",
  secondary:
    "bg-white text-grey-900 border border-grey-200 shadow-xs hover:bg-grey-50 active:bg-grey-100 disabled:text-grey-400",
  ghost:
    "bg-transparent text-grey-700 hover:bg-grey-100 active:bg-grey-200 disabled:text-grey-400",
  danger:
    "bg-danger-strong text-white shadow-xs hover:brightness-95 active:brightness-90 disabled:bg-grey-300",
};

const SIZES: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[12px] gap-1.5 rounded-md",
  md: "h-8 px-3 text-[13px] gap-1.5 rounded-md",
};

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap",
        "transition-colors duration-100 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

/** Square icon-only button, used for row actions and card overflow menus. */
export function IconButton({
  className,
  children,
  label,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-md",
        "text-grey-600 transition-colors duration-100",
        "hover:bg-grey-100 hover:text-grey-900 active:bg-grey-200",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
