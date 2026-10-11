"use client";

import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

interface Props extends ComponentProps<"button"> {
  selected?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Chip({ selected, icon, children, className, ...rest }: Props) {
  return (
    <button
      aria-pressed={selected}
      className={clsx(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-small font-medium transition-colors duration-200",
        selected ? "bg-mulberry text-ivory" : "bg-paper text-mulberry ring-1 ring-line hover:ring-mulberry/30",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
