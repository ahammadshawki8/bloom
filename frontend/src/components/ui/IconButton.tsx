"use client";

import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

interface Props extends ComponentProps<"button"> {
  label: string;
  children: ReactNode;
  tone?: "paper" | "glass" | "plain";
}

export function IconButton({ label, children, tone = "paper", className, ...rest }: Props) {
  return (
    <button
      aria-label={label}
      title={label}
      className={clsx(
        "inline-grid size-11 shrink-0 place-items-center rounded-full text-mulberry transition-[transform,background-color] duration-200 active:scale-90",
        tone === "paper" && "bg-paper shadow-lift hover:bg-white",
        tone === "glass" && "bg-white/70 backdrop-blur-md hover:bg-white/90",
        tone === "plain" && "hover:bg-mulberry/6",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
