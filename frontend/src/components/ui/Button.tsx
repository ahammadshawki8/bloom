"use client";

import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "soft" | "outline" | "quiet";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium select-none whitespace-nowrap " +
  "transition-[transform,background-color,color,box-shadow] duration-200 ease-[var(--ease-petal)] " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary: "bg-mulberry text-ivory hover:bg-[#563649] shadow-lift",
  soft: "bg-rose-wash text-mulberry hover:bg-[#efd2cf]",
  outline: "border border-mulberry/25 text-mulberry hover:border-mulberry/60 hover:bg-paper",
  quiet: "text-mulberry hover:bg-mulberry/5",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-small",
  md: "h-12 px-6 text-[1rem]",
  lg: "h-14 px-8 text-[1.0625rem]",
};

interface Common {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconEnd?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", icon, iconEnd, className, children, ...rest }: Common & ComponentProps<"button">) {
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      {children}
      {iconEnd}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  icon,
  iconEnd,
  className,
  children,
  ...rest
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={clsx(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      {children}
      {iconEnd}
    </Link>
  );
}
