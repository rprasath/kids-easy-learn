import Link from "next/link";
import { ReactNode } from "react";

type SiteHeaderProps = {
  rightSlot?: ReactNode;
};

export function SiteHeader({ rightSlot }: SiteHeaderProps) {
  return (
    <header className="mx-auto mb-6 flex w-full max-w-7xl items-center justify-between rounded-[1.6rem] bg-white/88 px-5 py-4 paper-shadow backdrop-blur">
      <Link href="/" className="text-lg font-black tracking-[0.18em] text-slate-900 sm:text-xl">
        Zybe Zone - Kids learn
      </Link>
      {rightSlot ? <div>{rightSlot}</div> : <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">kidslearn.zybezone.com</div>}
    </header>
  );
}
