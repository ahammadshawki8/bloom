import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { OpenStudio } from "./OpenStudio";

export function LandingHeader() {
  return (
    <header className="relative z-20 mx-auto flex max-w-[1240px] items-center justify-between px-5 pt-[calc(16px+var(--safe-top))] pb-4 md:px-10 md:pt-7">
      <Link href="/" aria-label="Bloom home">
        <Wordmark />
      </Link>
      <nav className="flex items-center gap-1 md:gap-2">
        <a href="#how" className="hidden rounded-full px-4 py-2 text-small text-mulberry-soft hover:text-mulberry md:inline-block">
          How it works
        </a>
        <a href="#private" className="hidden rounded-full px-4 py-2 text-small text-mulberry-soft hover:text-mulberry md:inline-block">
          Privacy
        </a>
        <OpenStudio variant="outline" className="ml-2">
          Open your studio
        </OpenStudio>
      </nav>
    </header>
  );
}
