import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ROUTES } from "@/config/routes";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex h-16 items-center px-4 sm:px-8">
        <Link
          href={ROUTES.home}
          aria-label="Eventify home"
          className="flex items-center"
        >
          <Image
            src="/brand/eventify-logo.png"
            alt="Eventify"
            width={108}
            height={36}
            unoptimized
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 items-center justify-center px-4 py-10"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="py-6 text-center text-xs text-muted-foreground">
        {APP_NAME}
      </footer>
    </div>
  );
}
