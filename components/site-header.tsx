import Link from "next/link";
import { ReactNode } from "react";

type SiteHeaderProps = {
  rightSlot?: ReactNode;
};

export function SiteHeader({ rightSlot }: SiteHeaderProps) {
  return (
    <header className="mx-auto mb-4 flex w-full max-w-6xl items-center justify-between border-b border-slate-200/80 px-1 py-3 sm:mb-5">
      <Link href="/" className="flex flex-col text-slate-900">
        <span className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-700">Zybe Zone</span>
        <span className="text-lg font-black sm:text-xl">Kids Learn</span>
      </Link>
      {rightSlot ? (
        <div>{rightSlot}</div>
      ) : (
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Play and learn</div>
      )}
    </header>
  );
}
