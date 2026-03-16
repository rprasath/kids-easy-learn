"use client";

type RouterLike = {
  push: (...args: any[]) => void;
  replace?: (...args: any[]) => void;
};

type NavigateOptions = {
  exitFullscreen?: boolean;
  replace?: boolean;
};

export function navigateClient(router: RouterLike, href: string, options: NavigateOptions = {}) {
  const { exitFullscreen = true, replace = false } = options;

  if (exitFullscreen && typeof document !== "undefined" && document.fullscreenElement) {
    void document.exitFullscreen?.().catch(() => undefined);
  }

  if (typeof window !== "undefined") {
    if (replace) {
      window.location.replace(href);
      return;
    }

    window.location.assign(href);
    return;
  }

  if (replace && router.replace) {
    router.replace(href);
    return;
  }

  router.push(href);
}
