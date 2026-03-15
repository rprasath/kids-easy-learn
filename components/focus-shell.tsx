import { PropsWithChildren } from "react";
import { SiteHeader } from "@/components/site-header";

type FocusShellProps = PropsWithChildren<{
  mode: "flashcards" | "quiz";
}>;

export function FocusShell({ children, mode }: FocusShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(214,240,255,0.65),transparent_35%),linear-gradient(180deg,#f8f2e5_0%,#f7f8fb_60%,#edf6ff_100%)] px-3 py-2 sm:px-4 sm:py-3">
      <SiteHeader
        rightSlot={
          <div className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
          {mode}
          </div>
        }
      />
      {children}
    </main>
  );
}
