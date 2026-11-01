import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PublicHeader } from "@/components/layout/public-header";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Services" };

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none sm:px-6"
      >
        {children}
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        {APP_NAME}
      </footer>
    </div>
  );
}
