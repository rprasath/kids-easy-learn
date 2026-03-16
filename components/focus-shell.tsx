"use client";

import Link from "next/link";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from "react";

type FocusShellProps = PropsWithChildren<{
  mode: "flashcards" | "quiz" | "map-quiz";
}>;

type StudyTheme = "light" | "dark";

type StudyChromeContextValue = {
  isFullscreen: boolean;
  theme: StudyTheme;
  toggleFullscreen: () => void;
  setTheme: (theme: StudyTheme) => void;
};

const StudyChromeContext = createContext<StudyChromeContextValue | null>(null);
const STORAGE_KEY = "zybezone-kids-learn.study-theme.v1";

export function useStudyChrome() {
  const context = useContext(StudyChromeContext);

  if (!context) {
    throw new Error("useStudyChrome must be used inside FocusShell.");
  }

  return context;
}

export function FocusShell({ children, mode }: FocusShellProps) {
  const shellRef = useRef<HTMLElement>(null);
  const [theme, setTheme] = useState<StudyTheme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return storedTheme === "dark" ? "dark" : "light";
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement !== null);
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    onFullscreenChange();

    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (mode === "flashcards") {
      return;
    }

    if (document.fullscreenElement) {
      return;
    }

    void document.documentElement.requestFullscreen?.().catch(() => undefined);
  }, [mode]);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined);
      return;
    }

    void document.documentElement.requestFullscreen?.().catch(() => undefined);
  }

  const headerTone =
    theme === "dark"
      ? "border-slate-700/90 text-slate-100"
      : "border-slate-300/90 text-slate-900";
  const subtleTone = theme === "dark" ? "text-slate-300" : "text-slate-600";
  const ghostButton =
    theme === "dark"
      ? "border-slate-600 bg-slate-900/80 text-slate-100"
      : "border-slate-300 bg-white/90 text-slate-900";
  const activeThemeButton =
    theme === "dark"
      ? "bg-white text-slate-950"
      : "bg-slate-900 text-white";
  const inactiveThemeButton =
    theme === "dark"
      ? "bg-transparent text-slate-300"
      : "bg-transparent text-slate-600";

  const shellClassName =
    theme === "dark"
      ? "min-h-screen bg-[linear-gradient(180deg,#08111f_0%,#0c1628_56%,#111b2f_100%)] px-3 py-2 text-slate-100 sm:px-5 sm:py-3"
      : "min-h-screen bg-[linear-gradient(180deg,#fbf7f1_0%,#f4f6f7_58%,#eef3f6_100%)] px-3 py-2 text-slate-900 sm:px-5 sm:py-3";

  const contextValue = useMemo(
    () => ({ isFullscreen, theme, toggleFullscreen, setTheme }),
    [isFullscreen, theme],
  );

  return (
    <StudyChromeContext.Provider value={contextValue}>
      <main
        ref={shellRef}
        className={shellClassName}
        style={{ colorScheme: theme }}
      >
        <header className={`mx-auto mb-4 flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-b px-1 pb-3 ${headerTone}`}>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${ghostButton}`}
            >
              Home
            </Link>
            <div className={`text-xs font-black uppercase tracking-[0.22em] ${subtleTone}`}>{mode}</div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`inline-flex rounded-full border px-1 py-1 ${ghostButton}`}>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] ${theme === "light" ? activeThemeButton : inactiveThemeButton}`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] ${theme === "dark" ? activeThemeButton : inactiveThemeButton}`}
              >
                Dark
              </button>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${ghostButton}`}
            >
              {isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
            </button>
          </div>
        </header>
        {children}
      </main>
    </StudyChromeContext.Provider>
  );
}
