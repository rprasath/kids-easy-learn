import { PropsWithChildren } from "react";
import { SiteHeader } from "@/components/site-header";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <SiteHeader />
      {children}
    </main>
  );
}
