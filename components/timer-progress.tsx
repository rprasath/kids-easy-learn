"use client";

type TimerProgressProps = {
  active: boolean;
  label: string;
  secondsLeft: number;
  totalSeconds: number;
};

export function TimerProgress({ active, label, secondsLeft, totalSeconds }: TimerProgressProps) {
  if (!active) {
    return null;
  }

  const safeTotal = Math.max(totalSeconds, 1);
  const progress = Math.max(0, Math.min(secondsLeft / safeTotal, 1));
  const progressPercent = Math.round(progress * 100);

  return (
    <div className="w-full rounded-[1.35rem] bg-white/80 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.16em] text-slate-600">
        <span>{label}</span>
        <span>{secondsLeft}s left</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={Math.max(0, Math.min(secondsLeft, safeTotal))}
        className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-sky-400 transition-[width] duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
