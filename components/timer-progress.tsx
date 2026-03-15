"use client";

import { useStudyChrome } from "@/components/focus-shell";

type TimerProgressProps = {
  active: boolean;
  label: string;
  secondsLeft: number;
  totalSeconds: number;
};

export function TimerProgress({ active, label, secondsLeft, totalSeconds }: TimerProgressProps) {
  const { theme } = useStudyChrome();

  if (!active) {
    return null;
  }

  const safeTotal = Math.max(totalSeconds, 1);
  const progress = Math.max(0, Math.min(secondsLeft / safeTotal, 1));
  const progressPercent = Math.round(progress * 100);
  const textTone = theme === "dark" ? "text-slate-300" : "text-slate-500";
  const trackTone = theme === "dark" ? "bg-slate-700/90" : "bg-slate-200/90";

  return (
    <div className="w-full px-1 py-1">
      <div className={`flex items-center justify-between gap-3 text-[11px] font-black uppercase tracking-[0.16em] ${textTone}`}>
        <span>{label}</span>
        <span>{secondsLeft}s left</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={Math.max(0, Math.min(secondsLeft, safeTotal))}
        className={`mt-2 h-2 overflow-hidden rounded-full ${trackTone}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] via-[#efb26e] to-[#86bad8] transition-[width] duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
