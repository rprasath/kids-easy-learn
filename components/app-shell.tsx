import { PropsWithChildren } from "react";
import { SiteHeader } from "@/components/site-header";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <SiteHeader />
      {children}
    </main>
  );
}
